/**
 * Mock Vue reactivity for testing purposes
 * This mimics Vue 3 composition API without the actual Vue dependency
 */

export interface Ref<T> {
    value: T
}

export function ref<T>(initialValue: T): Ref<T> {
    return { value: initialValue }
}

export interface ComputedRef<T> {
    readonly value: T
}

export function computed<T>(getter: () => T): ComputedRef<T> {
    return {
        get value() {
            return getter()
        },
    }
}

