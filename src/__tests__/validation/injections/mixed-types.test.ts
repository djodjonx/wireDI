import { defineBuilderConfig, type ContainerProvider } from '../../../index'
import { TOKENS, ConsoleLogger, UserRepository, UserService, ProductService } from '../fixtures'

// ✅ Mixed injection types
export const mixedTypes = defineBuilderConfig({
    builderId: 'valid.mixed.types',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, factory: () => new UserRepository() },
        { token: TOKENS.Config, value: () => ({ apiUrl: 'http://api.com', timeout: 5000, retries: 3 }) },
        { token: UserService },
    ],
})

// ✅ Mix of provider, factory, value, class - should be valid
export const configValidMixed = defineBuilderConfig({
    builderId: 'test.valid.mixed',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, factory: (_provider: ContainerProvider) => new UserRepository() },
        { token: TOKENS.Config, value: () => ({ apiUrl: 'http://api.com', timeout: 5000, retries: 1 }) },
        { token: ProductService },
    ],
})
