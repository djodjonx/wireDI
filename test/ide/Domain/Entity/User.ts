/**
 * Entity User - Domain Layer
 */
export default class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        private _isActive: boolean = true,
    ) {}

    get isActive(): boolean {
        return this._isActive
    }

    activate(): void {
        this._isActive = true
    }

    deactivate(): void {
        this._isActive = false
    }
}

