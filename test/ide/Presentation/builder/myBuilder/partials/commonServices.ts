import { definePartialConfig } from '@djodjonx/diligent'
import { TOKENS } from '../tokens'

// Infrastructure imports
import ConsoleLogger from '../../../../Infrastructure/Logger/ConsoleLogger'

/**
 * Partial config for common services (Logger, etc.)
 */
export const commonServicesPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
    listeners: [],
})

