export const mapObject = <ReturnType extends object>(
    obj: object,
    mapFn: (value: any, key: PropertyKey) => any
): ReturnType => {
    const newObject = {};
    for (const [key, value] of Object.entries(obj)) {
        newObject[key] = mapFn(value, key);
    }
    return newObject as ReturnType;
};
