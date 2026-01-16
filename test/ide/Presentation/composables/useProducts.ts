import { ref, computed } from '../../shared/vue-mock'
import type Product from '../../Domain/Entity/Product'
import ListProductsUseCase from '../../Application/UseCase/ListProductsUseCase'
import { useMyBuilder } from '../builder/myBuilder'

/**
 * Composable for Product operations
 * Vue.js style composable that uses the DI container
 */
export function useProducts() {
    const { resolve } = useMyBuilder()

    // State
    const products = ref<Product[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const hasProducts = computed(() => products.value.length > 0)
    const productCount = computed(() => products.value.length)
    const availableProducts = computed(() =>
        products.value.filter(p => p.isAvailable())
    )

    // Actions
    async function fetchProducts(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            const useCase = resolve(ListProductsUseCase)
            products.value = await useCase.execute()
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unknown error'
            products.value = []
        } finally {
            isLoading.value = false
        }
    }

    function clearProducts(): void {
        products.value = []
        error.value = null
    }

    return {
        // State
        products,
        isLoading,
        error,

        // Computed
        hasProducts,
        productCount,
        availableProducts,

        // Actions
        fetchProducts,
        clearProducts,
    }
}

