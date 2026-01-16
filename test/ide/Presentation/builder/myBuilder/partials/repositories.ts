import { definePartialConfig } from '@djodjonx/diligent'
import { TOKENS } from '../tokens'

// Infrastructure imports
import InMemoryUserRepository from '../../../../Infrastructure/Repository/InMemoryUserRepository'
import InMemoryProductRepository from '../../../../Infrastructure/Repository/InMemoryProductRepository'

/**
 * Partial config for repositories
 */
export const repositoriesPartial = definePartialConfig({
    injections: [
        { token: TOKENS.UserRepository, provider: InMemoryUserRepository },
        // { token: TOKENS.ProductRepository, provider: InMemoryProductRepository },
    ],
    listeners: [],
})

