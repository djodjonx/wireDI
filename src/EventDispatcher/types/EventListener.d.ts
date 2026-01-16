import type Event from './Event'

export default interface EventListener {
  onEvent(event: Event): void
}
