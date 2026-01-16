import type ts from 'typescript'
import type { NormalizedToken, TokenType } from './types'

/**
 * Service de normalisation des tokens d'injection
 *
 * Génère des identifiants uniques pour comparer les tokens,
 * qu'ils soient des symboles, des classes ou des chaînes.
 */
export class TokenNormalizer {
    private typescript: typeof ts

    constructor(
        typescript: typeof ts,
        private checker: ts.TypeChecker,
    ) {
        this.typescript = typescript
    }

    /**
     * Normalise un token depuis un noeud AST
     * Supporte: Symbol, Class, String literal, MemberExpression (TOKENS.X)
     */
    normalize(node: ts.Node, sourceFile: ts.SourceFile): NormalizedToken | null {
        const ts = this.typescript

        // Cas 1: String literal - @inject('API_KEY')
        if (ts.isStringLiteral(node)) {
            return {
                id: `STRING:${node.text}`,
                type: 'string',
                displayName: `"${node.text}"`,
                node,
                sourceFile,
                position: node.getStart(sourceFile),
            }
        }

        // Cas 2: Identifier simple - @inject(MyClass) ou @inject(MY_TOKEN)
        if (ts.isIdentifier(node)) {
            return this.normalizeIdentifier(node, sourceFile)
        }

        // Cas 3: Member expression - @inject(TOKENS.Logger)
        if (ts.isPropertyAccessExpression(node)) {
            return this.normalizeMemberExpression(node, sourceFile)
        }

        // Cas 4: Call expression - Symbol('name')
        if (ts.isCallExpression(node)) {
            return this.normalizeCallExpression(node, sourceFile)
        }

        return null
    }

    /**
     * Normalise un identifiant (classe ou variable symbol)
     */
    private normalizeIdentifier(
        node: ts.Identifier,
        sourceFile: ts.SourceFile,
    ): NormalizedToken | null {
        const symbol = this.checker.getSymbolAtLocation(node)
        if (!symbol) return null

        // Résoudre les alias (imports)
        const resolvedSymbol = this.resolveAlias(symbol)
        if (!resolvedSymbol) return null

        return this.createTokenFromSymbol(resolvedSymbol, node, sourceFile)
    }

    /**
     * Normalise un accès membre (TOKENS.Logger)
     */
    private normalizeMemberExpression(
        node: ts.PropertyAccessExpression,
        sourceFile: ts.SourceFile,
    ): NormalizedToken | null {
        const symbol = this.checker.getSymbolAtLocation(node)
        if (!symbol) return null

        const resolvedSymbol = this.resolveAlias(symbol)
        if (!resolvedSymbol) return null

        // Construire le nom d'affichage complet
        const displayName = node.getText(sourceFile)

        return this.createTokenFromSymbol(resolvedSymbol, node, sourceFile, displayName)
    }

    /**
     * Normalise un appel Symbol('name')
     */
    private normalizeCallExpression(
        node: ts.CallExpression,
        sourceFile: ts.SourceFile,
    ): NormalizedToken | null {
        const ts = this.typescript

        // Vérifier si c'est Symbol(...)
        if (ts.isIdentifier(node.expression) && node.expression.text === 'Symbol') {
            const arg = node.arguments[0]
            if (arg && ts.isStringLiteral(arg)) {
                // Symbol('name') inline - utiliser la position comme ID unique
                return {
                    id: `INLINE_SYMBOL:${sourceFile.fileName}:${node.getStart(sourceFile)}`,
                    type: 'symbol',
                    displayName: `Symbol('${arg.text}')`,
                    node,
                    sourceFile,
                    position: node.getStart(sourceFile),
                }
            }
        }

        return null
    }

    /**
     * Crée un token normalisé depuis un symbole TypeScript
     */
    private createTokenFromSymbol(
        symbol: ts.Symbol,
        originalNode: ts.Node,
        sourceFile: ts.SourceFile,
        displayNameOverride?: string,
    ): NormalizedToken | null {
        const declaration = symbol.valueDeclaration || symbol.declarations?.[0]
        if (!declaration) return null

        const declSourceFile = declaration.getSourceFile()
        const type = this.determineTokenType(symbol, declaration)

        // ID unique basé sur le fichier et la position de déclaration
        const id = `${type.toUpperCase()}:${declSourceFile.fileName}:${declaration.getStart(declSourceFile)}`

        return {
            id,
            type,
            displayName: displayNameOverride || symbol.getName(),
            node: originalNode,
            sourceFile,
            position: originalNode.getStart(sourceFile),
        }
    }

    /**
     * Détermine le type d'un token depuis son symbole
     */
    private determineTokenType(symbol: ts.Symbol, declaration: ts.Declaration): TokenType {
        const ts = this.typescript

        // Vérifier si c'est une classe
        if (ts.isClassDeclaration(declaration)) {
            return 'class'
        }

        // Vérifier si c'est un symbole (variable initialisée avec Symbol())
        if (ts.isVariableDeclaration(declaration)) {
            const varDecl = declaration as ts.VariableDeclaration
            if (varDecl.initializer && ts.isCallExpression(varDecl.initializer)) {
                const callExpr = varDecl.initializer
                if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'Symbol') {
                    return 'symbol'
                }
            }
        }

        // Vérifier si c'est une propriété d'objet avec Symbol()
        if (ts.isPropertyAssignment(declaration)) {
            const propDecl = declaration as ts.PropertyAssignment
            if (propDecl.initializer && ts.isCallExpression(propDecl.initializer)) {
                const callExpr = propDecl.initializer
                if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'Symbol') {
                    return 'symbol'
                }
            }
        }

        // Vérifier le type via le TypeChecker
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, declaration)
        const typeString = this.checker.typeToString(type)

        if (typeString === 'symbol' || typeString.includes('unique symbol')) {
            return 'symbol'
        }

        return 'unknown'
    }

    /**
     * Résout les alias d'import pour obtenir le symbole original
     */
    private resolveAlias(symbol: ts.Symbol): ts.Symbol | null {
        const ts = this.typescript

        // Suivre la chaîne d'alias
        let current = symbol
        const visited = new Set<ts.Symbol>()

        while (current.flags & ts.SymbolFlags.Alias) {
            if (visited.has(current)) {
                // Cycle détecté
                return null
            }
            visited.add(current)

            try {
                current = this.checker.getAliasedSymbol(current)
            } catch {
                // Erreur de résolution
                return current
            }
        }

        return current
    }

    /**
     * Compare deux tokens pour vérifier s'ils sont identiques
     */
    areTokensEqual(token1: NormalizedToken, token2: NormalizedToken): boolean {
        return token1.id === token2.id
    }

    /**
     * Normalise un token depuis un type (pour injection implicite par type)
     */
    normalizeFromType(
        typeNode: ts.TypeNode,
        sourceFile: ts.SourceFile,
    ): NormalizedToken | null {
        const ts = this.typescript

        if (!ts.isTypeReferenceNode(typeNode)) {
            return null
        }

        const typeName = typeNode.typeName

        if (ts.isIdentifier(typeName)) {
            return this.normalizeIdentifier(typeName, sourceFile)
        }

        if (ts.isQualifiedName(typeName)) {
            // Pour les types qualifiés comme Namespace.Type
            const symbol = this.checker.getSymbolAtLocation(typeName)
            if (symbol) {
                const resolvedSymbol = this.resolveAlias(symbol)
                if (resolvedSymbol) {
                    return this.createTokenFromSymbol(resolvedSymbol, typeNode, sourceFile)
                }
            }
        }

        return null
    }
}

