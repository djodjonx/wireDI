import { defineBuilderConfig } from '../../../index'
import { UserService, ProductService, OrderService, ConsoleLogger } from '../fixtures'

// ✅ Class tokens
export const classTokens = defineBuilderConfig({
    builderId: 'valid.class.tokens',
    injections: [
        { token: UserService },
        { token: ProductService },
        { token: OrderService },
    ],
})

// ✅ Different class tokens - should be valid
export const configValidDifferentClasses = defineBuilderConfig({
    builderId: 'test.valid.classes',
    injections: [
        { token: ConsoleLogger },
        { token: ProductService },
    ],
})
