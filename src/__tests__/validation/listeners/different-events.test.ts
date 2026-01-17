import { defineBuilderConfig } from '../../../index'
import { UserCreatedEvent, UserUpdatedEvent, AuditLogListener, ProductCreatedEvent, LoggingListener } from '../fixtures'

// ✅ Listeners - same listener for different events
export const listenersSameForDifferentEvents = defineBuilderConfig({
    builderId: 'valid.listeners.same',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: AuditLogListener },
        { event: UserUpdatedEvent, listener: AuditLogListener },
    ],
})

// ✅ This should NOT error - different events
export const _configDifferentEvents = defineBuilderConfig({
    builderId: 'test.different.events',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: LoggingListener },
        { event: ProductCreatedEvent, listener: LoggingListener }, // Different event, OK!
    ],
})
