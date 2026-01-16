// Types
export type {
    ContainerProvider,
    ProviderToken,
    Constructor,
    ProviderAdapterOptions,
} from './types'

export { ProviderLifecycle } from './types'

// Provider Manager
export {
    useContainerProvider,
    getContainerProvider,
    hasContainerProvider,
    resetContainerProvider,
} from './ProviderManager'

// Adapters - tsyringe (built-in)
export { TsyringeProvider } from './adapters/TsyringeProvider'
export type {
    TsyringeProviderOptions,
    TsyringeDependencies,
    TsyringeDependencyContainer,
    TsyringeLifecycle,
} from './adapters/TsyringeProvider'

// Adapters - Awilix (optional, requires 'awilix' package)
export { AwilixProvider } from './adapters/AwilixProvider'
export type { AwilixProviderOptions } from './adapters/AwilixProvider'

// Adapters - InversifyJS (optional, requires 'inversify' package)
export { InversifyProvider } from './adapters/InversifyProvider'
export type { InversifyProviderOptions } from './adapters/InversifyProvider'

