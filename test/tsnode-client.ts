import * as readline from "readline";

declare const process: any;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("What's your name? ", (resp: string) => {
    console.log(`Hi, ${resp}!`);
    rl.close();
});