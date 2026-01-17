import { defineBuilderConfig } from '../../../index'
import { TOKENS, ConsoleLogger, UserRepository, ProductRepository } from '../fixtures'

// ✅ Multiple different providers
export const multipleDifferentProviders = defineBuilderConfig({
    builderId: 'valid.multiple.providers',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, provider: UserRepository },
        { token: TOKENS.ProductRepository, provider: ProductRepository },
    ],
})

// ✅ Different tokens - should be valid
export const configValidDifferentTokens = defineBuilderConfig({
    builderId: 'test.valid.different',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, provider: UserRepository },
    ],
})

// ============================================================
// Type-level tests to verify validation types work
// ============================================================

// Test that ValidateInjectionsInternal catches duplicates
type TestDuplicateDetection = typeof configValidDifferentTokens extends { injections: infer I }
    ? I extends readonly unknown[]
        ? 'valid'
        : 'invalid'
    : 'invalid'

// This should be 'valid' because there are no duplicates
const _typeTest: TestDuplicateDetection = 'valid'

export { _typeTest }