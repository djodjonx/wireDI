import { defineBuilderConfig, type ContainerProvider } from '../../../index'
import { TOKENS, ConsoleLogger, UserRepository, type LoggerInterface } from '../fixtures'

// ✅ Factory with correct type
export const factoryCorrectType = defineBuilderConfig({
    builderId: 'valid.factory.correct',
    injections: [
        {
            token: TOKENS.Logger,
            factory: (_provider: ContainerProvider): LoggerInterface => new ConsoleLogger(),
        },
    ],
})

// ✅ Factory with correct type - should be valid (duplicate test case from other file)
export const configValidFactory = defineBuilderConfig({
    builderId: 'test.valid.factory',
    injections: [
        {
            token: TOKENS.Logger,
            factory: (_provider: ContainerProvider): LoggerInterface => new ConsoleLogger(),
        },
    ],
})

// ✅ Multiple factories with different tokens - should be valid
export const configValidMultipleFactories = defineBuilderConfig({
    builderId: 'test.valid.factories',
    injections: [
        { token: TOKENS.Logger, factory: (_provider: ContainerProvider) => new ConsoleLogger() },
        { token: TOKENS.UserRepository, factory: (_provider: ContainerProvider) => new UserRepository() },
    ],
})
