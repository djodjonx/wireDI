import { defineBuilderConfig } from '../../../index'
import { TOKENS, ConsoleLogger } from '../fixtures'

// ✅ Basic injection with provider
export const basicProvider = defineBuilderConfig({
    builderId: 'valid.basic.provider',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})
