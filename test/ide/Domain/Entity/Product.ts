/**
 * Entity Product - Domain Layer
 */
export default class Product {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly price: number,
        public readonly stock: number,
    ) {}

    isAvailable(): boolean {
        return this.stock > 0
    }
}

