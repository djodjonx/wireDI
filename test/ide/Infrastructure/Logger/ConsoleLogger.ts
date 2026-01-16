import { injectable } from 'tsyringe'
import type LoggerInterface from '../../Domain/Service/LoggerInterface'

/**
 * Console Logger - Infrastructure Layer
 */
@injectable()
export default class ConsoleLogger implements LoggerInterface {
    info(message: string, context?: Record<string, unknown>): void {
        console.log(`[INFO] ${message}`, context ?? '')
    }

    error(message: string, context?: Record<string, unknown>): void {
        console.error(`[ERROR] ${message}`, context ?? '')
    }

    warn(message: string, context?: Record<string, unknown>): void {
        console.warn(`[WARN] ${message}`, context ?? '')
    }

    debug(message: string, context?: Record<string, unknown>): void {
        console.debug(`[DEBUG] ${message}`, context ?? '')
    }
}

