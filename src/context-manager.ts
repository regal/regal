export class ContextManager {
    public static isContextStatic(): boolean {
        return this._contextIsStatic;
    }

    public static reset(): void {
        this._contextIsStatic = true;
    }

    public static init(): void {
        this._contextIsStatic = false;
    }

    private static _contextIsStatic: boolean = true;
}
