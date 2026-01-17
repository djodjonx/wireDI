import { defineBuilderConfig } from '../../../index'
import { UserCreatedEvent, ProductCreatedEvent, OrderPlacedEvent, EmailListener, SmsListener, LoggingListener } from '../fixtures'

// ✅ This should NOT error - all different pairs
export const _configMultipleValid = defineBuilderConfig({
    builderId: 'test.multiple.valid',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: SmsListener },
        { event: UserCreatedEvent, listener: LoggingListener },
        { event: ProductCreatedEvent, listener: EmailListener },
        { event: ProductCreatedEvent, listener: SmsListener },
        { event: OrderPlacedEvent, listener: LoggingListener },
    ]
})
