import { defineBuilderConfig } from '../../../index'
import { UserCreatedEvent, EmailNotificationListener, SmsNotificationListener, EmailListener, SmsListener } from '../fixtures'

// ✅ Listeners - different listeners for same event
export const listenersDifferentForSameEvent = defineBuilderConfig({
    builderId: 'valid.listeners.different',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener },
        { event: UserCreatedEvent, listener: SmsNotificationListener },
    ],
})

// ✅ This should NOT error - different listeners
export const _configDifferentListeners = defineBuilderConfig({
    builderId: 'test.different.listeners',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: SmsListener }, // Different listener, OK!
    ],
})
