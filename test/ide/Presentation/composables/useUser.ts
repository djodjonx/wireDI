import { ref, computed } from '../../shared/vue-mock'
import type User from '../../Domain/Entity/User'
import GetUserByIdUseCase from '../../Application/UseCase/GetUserByIdUseCase'
import { useMyBuilder } from '../builder/myBuilder'

/**
 * Composable for User operations
 * Vue.js style composable that uses the DI container
 */
export function useUser() {
    const { resolve } = useMyBuilder()

    // State
    const user = ref<User | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const hasUser = computed(() => user.value !== null)
    const userName = computed(() => user.value?.name ?? '')
    const userEmail = computed(() => user.value?.email ?? '')

    // Actions
    async function fetchUser(userId: string): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            const useCase = resolve(GetUserByIdUseCase)
            user.value = await useCase.execute(userId)

            if (!user.value) {
                error.value = `User with id ${userId} not found`
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unknown error'
            user.value = null
        } finally {
            isLoading.value = false
        }
    }

    function clearUser(): void {
        user.value = null
        error.value = null
    }

    return {
        // State
        user,
        isLoading,
        error,

        // Computed
        hasUser,
        userName,
        userEmail,

        // Actions
        fetchUser,
        clearUser,
    }
}

