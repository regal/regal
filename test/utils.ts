import { inspect } from "util";

export const log = (o: any, title?: string) =>
    console.log(
        `${title ? `${title}: ` : ""}${inspect(o, { depth: Infinity })}`
    );
