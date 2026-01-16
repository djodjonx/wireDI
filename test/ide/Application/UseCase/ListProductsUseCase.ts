import { inject, injectable } from 'tsyringe'
import type Product from '../../Domain/Entity/Product'
import type ProductRepositoryInterface from '../../Domain/Repository/ProductRepositoryInterface'
import type LoggerInterface from '../../Domain/Service/LoggerInterface'
import { TOKENS } from '../../Presentation/builder/myBuilder/tokens'

/**
 * Use Case: List Products - Application Layer
 */
@injectable()
export default class ListProductsUseCase {
    constructor(
        @inject(TOKENS.ProductRepository) private productRepository: ProductRepositoryInterface,
        @inject(TOKENS.Logger) private logger: LoggerInterface,
    ) {}

    async execute(): Promise<Product[]> {
        this.logger.info('Listing all products')

        const products = await this.productRepository.findAll()

        this.logger.info('Products fetched', { count: products.length })
        return products
    }
}

