import { defineBuilderConfig } from '../../../index'
import { TOKENS, type ConfigInterface } from '../fixtures'

// ✅ Value with correct type
export const valueCorrectType = defineBuilderConfig({
    builderId: 'valid.value.correct',
    injections: [
        {
            token: TOKENS.Config,
            value: (): ConfigInterface => ({
                apiUrl: 'https://api.example.com',
                timeout: 5000,
                retries: 3,
            }),
        },
    ],
})

// ✅ Value with correct type - should be valid
export const configValidValue = defineBuilderConfig({
    builderId: 'test.valid.value',
    injections: [
        {
            token: TOKENS.Config,
            value: (): ConfigInterface => ({ apiUrl: 'http://api.com', timeout: 5000, retries: 0 }),
        },
    ],
})
