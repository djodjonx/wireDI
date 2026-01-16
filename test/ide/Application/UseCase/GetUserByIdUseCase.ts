import { inject, injectable } from 'tsyringe'
import type User from '../../Domain/Entity/User'
import type UserRepositoryInterface from '../../Domain/Repository/UserRepositoryInterface'
import type LoggerInterface from '../../Domain/Service/LoggerInterface'
import { TOKENS } from '../../Presentation/builder/myBuilder/tokens'

/**
 * Use Case: Get User By Id - Application Layer
 */
@injectable()
export default class GetUserByIdUseCase {
    constructor(
        @inject(TOKENS.UserRepository) private userRepository: UserRepositoryInterface,
        @inject(TOKENS.Logger) private logger: LoggerInterface,
    ) {}

    async execute(userId: string): Promise<User | null> {
        this.logger.info('Fetching user', { userId })

        const user = await this.userRepository.findById(userId)

        if (!user) {
            this.logger.warn('User not found', { userId })
            return null
        }

        this.logger.info('User found', { userId, email: user.email })
        return user
    }
}

