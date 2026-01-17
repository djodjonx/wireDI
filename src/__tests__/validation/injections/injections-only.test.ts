import { defineBuilderConfig } from '../../../index'
import { TOKENS, ConsoleLogger, ProductService } from '../fixtures'

// ✅ Injections without listeners - should be valid (listeners optional)
export const configInjectionsOnly = defineBuilderConfig({
    builderId: 'test.injections.only',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: ProductService },
    ],
})
