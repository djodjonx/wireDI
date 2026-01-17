import { defineBuilderConfig } from '../../../index'
import { UserService, ProductService } from '../fixtures'

// ✅ Optional listeners
export const optionalListeners = defineBuilderConfig({
    builderId: 'valid.no.listeners',
    injections: [
        { token: UserService },
    ],
    // listeners property omitted - OK
})

// ✅ This should NOT error - no listeners needed
export const _configNoListeners = defineBuilderConfig({
    builderId: 'test.no.listeners',
    injections: [
        { token: UserService },
        { token: ProductService }
    ]
    // No listeners property - OK!
})
