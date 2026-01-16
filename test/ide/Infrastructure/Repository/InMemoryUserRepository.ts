import { injectable } from 'tsyringe'
import User from '../../Domain/Entity/User'
import type UserRepositoryInterface from '../../Domain/Repository/UserRepositoryInterface'

/**
 * In-Memory User Repository - Infrastructure Layer
 */
@injectable()
export default class InMemoryUserRepository implements UserRepositoryInterface {
    private users: Map<string, User> = new Map()

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) ?? null
    }

    async findByEmail(email: string): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user
            }
        }
        return null
    }

    async save(user: User): Promise<void> {
        this.users.set(user.id, user)
    }

    async delete(id: string): Promise<void> {
        this.users.delete(id)
    }
}

