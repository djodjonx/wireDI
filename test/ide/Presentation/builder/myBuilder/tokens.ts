/**
 * Injection tokens for DI container
 *
 * Note: Use symbols for interfaces/abstractions only.
 * For concrete classes (Use Cases), use the class directly as token.
 */
export const TOKENS = {
    // Repositories (interfaces need symbols)
    UserRepository: Symbol('UserRepository'),
    ProductRepository: Symbol('ProductRepository'),

    // Services (interfaces need symbols)
    Logger: Symbol('Logger'),
} as const

