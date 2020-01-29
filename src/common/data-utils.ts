export const mapObject = <ValueIn, ValueOut>(
    obj: { [key: string]: ValueIn },
    mapFn: (value: ValueIn, key: PropertyKey) => ValueOut
): { [key: string]: ValueOut } => {
    const newObject = {};
    for (const [key, value] of Object.entries(obj)) {
        newObject[key] = mapFn(value, key);
    }
    return newObject;
};
