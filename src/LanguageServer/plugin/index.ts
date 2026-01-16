import type ts from 'typescript'
import type { DIPluginConfig, FileCache } from './types'
import { ValidationEngine } from './ValidationEngine'

/**
 * Obtient la version d'un fichier source pour le cache
 */
function getFileVersion(sourceFile: ts.SourceFile): string {
    // Utiliser la version si disponible, sinon la longueur du texte
    return (sourceFile as any).version || sourceFile.getText().length.toString()
}

/**
 * Fichiers externes que le plugin veut ajouter au projet
 */
function getExternalFilesImpl(): string[] {
    return []
}

/**
 * Appelé quand les fichiers du projet changent
 */
function onConfigurationChangedImpl(_config: DIPluginConfig): void {
    // Possibilité de mettre à jour la config à chaud
}

/**
 * TypeScript Language Service Plugin pour la validation DI
 *
 * Ce plugin s'intègre au service de langage TypeScript pour fournir
 * des diagnostics en temps réel sur les erreurs d'injection de dépendances.
 *
 * Architecture: Pattern Décorateur sur ts.LanguageService
 *
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin
 */
function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
    const typescript = modules.typescript

    function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
        const config: DIPluginConfig = info.config || {}

        // Logger TOUJOURS - pour le diagnostic
        const forceLog = (msg: string) => {
            info.project.projectService.logger.info(`[DI-Validator] ${msg}`)
        }

        forceLog('===== Plugin initialisé =====')
        forceLog(`Config: ${JSON.stringify(config)}`)
        forceLog(`Project root: ${info.project.getCurrentDirectory()}`)

        // Logger via le TSServer (verbose pour les détails)
        const logger = (msg: string) => {
            if (config.verbose) {
                info.project.projectService.logger.info(`[DI-Validator] ${msg}`)
            }
        }


        // Cache par fichier pour les performances
        const fileCache = new Map<string, FileCache>()

        // Créer le proxy du Language Service (Pattern Décorateur)
        const proxy = Object.create(null) as ts.LanguageService
        const originalLS = info.languageService

        // Délégation par défaut de toutes les méthodes
        for (const key of Object.keys(originalLS) as (keyof ts.LanguageService)[]) {
            const method = originalLS[key]
            if (typeof method === 'function') {
                ;(proxy as any)[key] = (...args: any[]) => (method as Function).apply(originalLS, args)
            }
        }

        // ============================================================
        // INTERCEPTION: getSemanticDiagnostics
        // ============================================================
        proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
            // Obtenir les diagnostics originaux de TypeScript
            const originalDiagnostics = originalLS.getSemanticDiagnostics(fileName)

            const program = originalLS.getProgram()
            if (!program) {
                logger('Pas de program disponible')
                return originalDiagnostics
            }

            const sourceFile = program.getSourceFile(fileName)
            if (!sourceFile) {
                return originalDiagnostics
            }

            // Ne pas analyser les fichiers de déclaration
            if (sourceFile.isDeclarationFile) {
                return originalDiagnostics
            }

            // Ne pas analyser les fichiers node_modules
            if (fileName.includes('node_modules')) {
                return originalDiagnostics
            }

            try {
                // Vérifier le cache
                const version = getFileVersion(sourceFile)
                const cached = fileCache.get(fileName)

                if (cached && cached.version === version) {
                    // Utiliser le cache si la version n'a pas changé
                    // Note: On ne cache pas les diagnostics car ils dépendent du contexte global
                }

                // Effectuer la validation DI
                const diDiagnostics = validateDI(program, sourceFile, logger)

                // Fusion des diagnostics
                return [...originalDiagnostics, ...diDiagnostics]
            } catch (error) {
                logger(`Erreur lors de la validation: ${error}`)
                return originalDiagnostics
            }
        }

        // ============================================================
        // INTERCEPTION OPTIONNELLE: getQuickInfoAtPosition
        // Affiche les infos DI au survol (future feature)
        // ============================================================
        // proxy.getQuickInfoAtPosition = (fileName: string, position: number) => {
        //     const original = originalLS.getQuickInfoAtPosition(fileName, position)
        //     // Ajouter des infos sur les dépendances...
        //     return original
        // }

        /**
         * Valide les dépendances DI et retourne les diagnostics
         */
        function validateDI(
            program: ts.Program,
            currentFile: ts.SourceFile,
            log: (msg: string) => void,
        ): ts.Diagnostic[] {
            const checker = program.getTypeChecker()
            const engine = new ValidationEngine(typescript, checker, log)

            // Log des fichiers sources disponibles dans le program
            const sourceFiles = program.getSourceFiles()
            const projectFiles = sourceFiles.filter(sf =>
                !sf.isDeclarationFile && !sf.fileName.includes('node_modules')
            )
            info.project.projectService.logger.info(
                `[DI-Validator] Programme: ${projectFiles.length} fichier(s) source(s) projet`
            )
            for (const sf of projectFiles.slice(0, 10)) {
                info.project.projectService.logger.info(`[DI-Validator]   - ${sf.fileName}`)
            }

            // Validation complète du programme
            const errors = engine.validate(program)

            info.project.projectService.logger.info(
                `[DI-Validator] Validation: ${errors.length} erreur(s) totale(s) trouvée(s)`
            )

            // Filtrer les erreurs pour le fichier courant
            const fileErrors = errors.filter(error =>
                error.file.fileName === currentFile.fileName
            )

            info.project.projectService.logger.info(
                `[DI-Validator] Fichier ${currentFile.fileName}: ${fileErrors.length} erreur(s)`
            )

            return engine.convertToDiagnostics(fileErrors)
        }

        return proxy
    }

    return {
        create,
        getExternalFiles: getExternalFilesImpl,
        onConfigurationChanged: onConfigurationChangedImpl,
    }
}

// Export CommonJS requis pour les plugins TypeScript
module.exports = init

