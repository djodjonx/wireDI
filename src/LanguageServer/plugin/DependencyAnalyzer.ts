import type ts from 'typescript'
import type { AnalyzedClass, RequiredDependency } from './types'
import { TokenNormalizer } from './TokenNormalizer'

/**
 * Analyseur des dépendances de constructeur des classes injectables
 *
 * Détecte les dépendances via:
 * - Décorateurs @inject(TOKEN)
 * - Types des paramètres (injection implicite)
 */
export class DependencyAnalyzer {
    private tokenNormalizer: TokenNormalizer
    private typescript: typeof ts

    constructor(
        typescript: typeof ts,
        private checker: ts.TypeChecker,
        private logger: (msg: string) => void,
    ) {
        this.typescript = typescript
        this.tokenNormalizer = new TokenNormalizer(typescript, checker)
    }

    /**
     * Analyse une classe pour extraire ses dépendances de constructeur
     */
    analyzeClass(classSymbol: ts.Symbol): AnalyzedClass | null {
        const declaration = this.getClassDeclaration(classSymbol)
        if (!declaration) return null

        const sourceFile = declaration.getSourceFile()
        const dependencies = this.extractConstructorDependencies(declaration, sourceFile)

        return {
            symbol: classSymbol,
            name: classSymbol.getName(),
            sourceFile,
            declaration,
            dependencies,
        }
    }

    /**
     * Obtient la déclaration de classe depuis un symbole
     */
    private getClassDeclaration(symbol: ts.Symbol): ts.ClassDeclaration | null {
        const ts = this.typescript

        const declaration = symbol.valueDeclaration || symbol.declarations?.[0]
        if (!declaration) return null

        if (ts.isClassDeclaration(declaration)) {
            return declaration
        }

        return null
    }

    /**
     * Extrait les dépendances du constructeur d'une classe
     */
    private extractConstructorDependencies(
        classDecl: ts.ClassDeclaration,
        sourceFile: ts.SourceFile,
    ): RequiredDependency[] {
        const ts = this.typescript
        const dependencies: RequiredDependency[] = []

        // Trouver le constructeur
        const constructor = classDecl.members.find(
            (member): member is ts.ConstructorDeclaration => ts.isConstructorDeclaration(member)
        )

        if (!constructor) {
            return dependencies
        }

        // Analyser chaque paramètre
        constructor.parameters.forEach((param, index) => {
            const dependency = this.analyzeParameter(param, index, sourceFile)
            if (dependency) {
                dependencies.push(dependency)
            }
        })

        return dependencies
    }

    /**
     * Analyse un paramètre de constructeur pour extraire sa dépendance
     */
    private analyzeParameter(
        param: ts.ParameterDeclaration,
        index: number,
        sourceFile: ts.SourceFile,
    ): RequiredDependency | null {
        // Capturer le type attendu du paramètre
        const expectedType = param.type
            ? this.checker.getTypeFromTypeNode(param.type)
            : undefined

        // Priorité 1: Décorateur @inject()
        const injectDecorator = this.findInjectDecorator(param)
        if (injectDecorator) {
            const token = this.extractTokenFromDecorator(injectDecorator, sourceFile)
            if (token) {
                return {
                    token,
                    parameterIndex: index,
                    parameterNode: param,
                    injectionMethod: 'decorator',
                    expectedType,
                }
            }
        }

        // Priorité 2: Type du paramètre (injection implicite)
        if (param.type) {
            const token = this.tokenNormalizer.normalizeFromType(param.type, sourceFile)
            if (token && this.isInjectableType(token)) {
                return {
                    token,
                    parameterIndex: index,
                    parameterNode: param,
                    injectionMethod: 'type',
                    expectedType,
                }
            }
        }

        return null
    }

    /**
     * Trouve le décorateur @inject sur un paramètre
     */
    private findInjectDecorator(param: ts.ParameterDeclaration): ts.Decorator | null {
        const ts = this.typescript
        const decorators = ts.getDecorators(param)

        if (!decorators) return null

        for (const decorator of decorators) {
            if (ts.isCallExpression(decorator.expression)) {
                const callee = decorator.expression.expression

                if (ts.isIdentifier(callee) && callee.text === 'inject') {
                    // Vérifier sémantiquement que c'est bien @inject de tsyringe
                    if (this.isInjectFromTsyringe(callee)) {
                        return decorator
                    }
                }
            }
        }

        return null
    }

    /**
     * Vérifie si un identifiant 'inject' provient de tsyringe
     */
    private isInjectFromTsyringe(node: ts.Identifier): boolean {
        const ts = this.typescript
        const symbol = this.checker.getSymbolAtLocation(node)
        if (!symbol) return true // Assume true si pas de symbole

        // Résoudre l'alias
        let resolved = symbol
        while (resolved.flags & ts.SymbolFlags.Alias) {
            try {
                resolved = this.checker.getAliasedSymbol(resolved)
            } catch {
                break
            }
        }

        const declaration = resolved.valueDeclaration || resolved.declarations?.[0]
        if (!declaration) return true

        const fileName = declaration.getSourceFile().fileName
        return fileName.includes('tsyringe') || !fileName.includes('node_modules')
    }

    /**
     * Extrait le token depuis un décorateur @inject(TOKEN)
     */
    private extractTokenFromDecorator(
        decorator: ts.Decorator,
        sourceFile: ts.SourceFile,
    ): ReturnType<TokenNormalizer['normalize']> {
        const ts = this.typescript

        if (!ts.isCallExpression(decorator.expression)) {
            return null
        }

        const args = decorator.expression.arguments
        if (args.length === 0) {
            return null
        }

        return this.tokenNormalizer.normalize(args[0], sourceFile)
    }

    /**
     * Vérifie si un token représente un type injectable (pas primitif)
     */
    private isInjectableType(token: ReturnType<TokenNormalizer['normalize']>): boolean {
        if (!token) return false

        // Exclure les types primitifs et built-in
        const nonInjectableTypes = new Set([
            'string', 'number', 'boolean', 'object', 'any', 'unknown',
            'never', 'void', 'null', 'undefined', 'symbol', 'bigint',
            'String', 'Number', 'Boolean', 'Object', 'Function',
            'Array', 'Map', 'Set', 'Promise', 'Date', 'RegExp', 'Error',
        ])

        // Vérifier par le nom d'affichage
        if (nonInjectableTypes.has(token.displayName)) {
            return false
        }

        // Seules les classes sont injectables implicitement
        return token.type === 'class'
    }

    /**
     * Analyse toutes les classes d'un fichier source
     */
    analyzeSourceFile(sourceFile: ts.SourceFile): AnalyzedClass[] {
        const classes: AnalyzedClass[] = []
        this.visitNode(sourceFile, classes)
        return classes
    }

    private visitNode(node: ts.Node, classes: AnalyzedClass[]): void {
        const ts = this.typescript

        if (ts.isClassDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name)
            if (symbol) {
                const analyzed = this.analyzeClass(symbol)
                if (analyzed && analyzed.dependencies.length > 0) {
                    classes.push(analyzed)
                }
            }
        }

        ts.forEachChild(node, (child: ts.Node) => this.visitNode(child, classes))
    }
}
