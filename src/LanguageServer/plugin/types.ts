import type ts from 'typescript'

/**
 * Identifiant unique pour un token d'injection
 * Format: "TYPE:path/to/file.ts:position" ou "STRING:literal" ou "CLASS:path:name"
 */
export type TokenId = string

/**
 * Types de tokens supportés
 */
export type TokenType = 'symbol' | 'class' | 'string' | 'unknown'

/**
 * Représente un token d'injection normalisé
 */
export interface NormalizedToken {
    /** Identifiant unique calculé pour comparaison */
    id: TokenId
    /** Type du token */
    type: TokenType
    /** Nom lisible pour les messages d'erreur */
    displayName: string
    /** Noeud AST original */
    node: ts.Node
    /** Fichier source */
    sourceFile: ts.SourceFile
    /** Position dans le fichier */
    position: number
    /** Symbole TypeScript du token (pour vérification de type) */
    symbol?: ts.Symbol
}

/**
 * Représente un provider enregistré dans une configuration
 */
export interface RegisteredProvider {
    /** Token sous lequel le provider est enregistré */
    token: NormalizedToken
    /** Classe qui implémente le provider (si applicable) */
    providerClass?: ts.Symbol
    /** Nom de la classe provider */
    providerClassName?: string
    /** Type d'enregistrement */
    registrationType: 'class' | 'symbol-provider' | 'value' | 'factory'
    /** Noeud AST de l'enregistrement */
    node: ts.Node
    /** Type TypeScript du provider (pour vérification de compatibilité) */
    providerType?: ts.Type
}

/**
 * Représente une dépendance requise par un constructeur
 */
export interface RequiredDependency {
    /** Token requis */
    token: NormalizedToken
    /** Index du paramètre dans le constructeur */
    parameterIndex: number
    /** Noeud du paramètre */
    parameterNode: ts.ParameterDeclaration
    /** Méthode d'injection: décorateur @inject ou type implicite */
    injectionMethod: 'decorator' | 'type'
    /** Type attendu de la dépendance */
    expectedType?: ts.Type
}

/**
 * Représente l'analyse d'une classe injectable
 */
export interface AnalyzedClass {
    /** Symbole de la classe */
    symbol: ts.Symbol
    /** Nom de la classe */
    name: string
    /** Fichier source de la déclaration */
    sourceFile: ts.SourceFile
    /** Noeud de déclaration */
    declaration: ts.ClassDeclaration
    /** Dépendances du constructeur */
    dependencies: RequiredDependency[]
}

/**
 * Représente une configuration analysée (Builder ou Partial)
 */
export interface AnalyzedConfig {
    /** Type de configuration */
    type: 'builder' | 'partial'
    /** Identifiant du builder (si applicable) */
    builderId?: string
    /** Nom de la variable (si assignée) */
    variableName?: string
    /** Symbole de la variable de config */
    symbol?: ts.Symbol
    /** Providers enregistrés directement dans cette config */
    localProviders: RegisteredProvider[]
    /** Tokens fournis (calculé avec héritage) */
    providedTokens: Map<TokenId, RegisteredProvider>
    /** Références aux configs parentes (extends) */
    parentConfigs: ts.Symbol[]
    /** Noeud de l'appel defineBuilderConfig/definePartialConfig */
    callNode: ts.CallExpression
    /** Fichier source */
    sourceFile: ts.SourceFile
}

/**
 * Erreur de validation DI
 */
export interface DIValidationError {
    /** Message d'erreur */
    message: string
    /** Fichier où reporter l'erreur */
    file: ts.SourceFile
    /** Position de début */
    start: number
    /** Longueur du span */
    length: number
    /** Informations connexes (ex: où la dépendance est requise) */
    relatedInformation?: Array<{
        file: ts.SourceFile
        start: number
        length: number
        message: string
    }>
}

/**
 * Configuration du plugin
 */
export interface DIPluginConfig {
    /** Mode verbeux pour debug */
    verbose?: boolean
    /** Nom des fonctions de config à détecter */
    configFunctions?: {
        builder: string
        partial: string
    }
}

/**
 * Cache pour un fichier source
 */
export interface FileCache {
    /** Version du fichier (pour invalidation) */
    version: string
    /** Classes analysées dans ce fichier */
    analyzedClasses: Map<string, AnalyzedClass>
    /** Configs analysées dans ce fichier */
    analyzedConfigs: AnalyzedConfig[]
}

/**
 * État global du validateur
 */
export interface ValidatorState {
    /** Cache par fichier */
    fileCache: Map<string, FileCache>
    /** Set des configs visitées (détection de cycles) */
    visitedConfigs: Set<ts.Symbol>
}

