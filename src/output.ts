export class InstanceOutput {
    lines: string[] = [];

    write(...lines: string[]) {
        this.lines.push(...lines);
    }
}