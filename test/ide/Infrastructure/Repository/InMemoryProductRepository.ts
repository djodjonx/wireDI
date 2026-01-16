import { injectable } from 'tsyringe'
import Product from '../../Domain/Entity/Product'
import type ProductRepositoryInterface from '../../Domain/Repository/ProductRepositoryInterface'

/**
 * In-Memory Product Repository - Infrastructure Layer
 */
@injectable()
export default class InMemoryProductRepository implements ProductRepositoryInterface {
    private products: Map<string, Product> = new Map()

    async findById(id: string): Promise<Product | null> {
        return this.products.get(id) ?? null
    }

    async findAll(): Promise<Product[]> {
        return Array.from(this.products.values())
    }

    async save(product: Product): Promise<void> {
        this.products.set(product.id, product)
    }
}

