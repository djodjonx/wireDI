import type User from '../Entity/User'

/**
 * Repository interface for User - Domain Layer
 */
export default interface UserRepositoryInterface {
    findById(id: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    save(user: User): Promise<void>
    delete(id: string): Promise<void>
}

