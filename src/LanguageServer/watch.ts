#!/usr/bin/env node
/**
 * Watch mode pour le DI Validator
 * Lance la validation à chaque modification de fichier
 */

import { watch } from 'fs'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')

const _filesToWatch = [
    'test/ide/Presentation/builder/**/*.ts',
    'test/ide/Application/**/*.ts',
]

console.log('\n🔍 DI Validator - Mode Watch\n')
console.log('Surveillance des fichiers...')
console.log('Appuyez sur Ctrl+C pour arrêter.\n')

let debounceTimer: NodeJS.Timeout | null = null

function runValidation() {
    console.clear()
    console.log('\n🔄 Validation en cours...\n')

    const child = spawn('pnpm', [
        'validate:di',
        'test/ide/Presentation/builder/myBuilder/index.ts',
        'test/ide/Presentation/builder/myBuilder/partials/commonServices.ts',
        'test/ide/Presentation/builder/myBuilder/partials/repositories.ts',
    ], {
        cwd: projectRoot,
        stdio: 'inherit',
    })

    child.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ Aucune erreur détectée')
        }
        console.log('\n⏳ En attente de modifications...\n')
    })
}

// Première validation
runValidation()

// Surveiller les changements
const watchDirs = [
    resolve(projectRoot, 'test/ide/Presentation'),
    resolve(projectRoot, 'test/ide/Application'),
]

for (const dir of watchDirs) {
    watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename?.endsWith('.ts')) return

        // Debounce pour éviter les validations multiples
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            console.log(`\n📝 Fichier modifié: ${filename}`)
            runValidation()
        }, 500)
    })
}

