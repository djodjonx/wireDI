import type Product from '../Entity/Product'

/**
 * Repository interface for Product - Domain Layer
 */
export default interface ProductRepositoryInterface {
    findById(id: string): Promise<Product | null>
    findAll(): Promise<Product[]>
    save(product: Product): Promise<void>
}

