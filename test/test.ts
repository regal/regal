export class GameInstance {
    eventCount: number;
    events: string[];
    output: string[];
    // state: Map<uid, any>;
}

export type EventFunction = (x: GameInstance) => GameInstance;

export const track = (name: string, func: EventFunction): EventFunction => 
    (game: GameInstance) => {
        game.eventCount++;
        game.events.push(`${game.eventCount}: ${name}`);
        return func(game);
};

export const pipe = (...funcs: EventFunction[]): EventFunction => 
    funcs.reduce((f, g) => (game: GameInstance) => g(f(game)));

export type uid = string;

const attack = (subject: uid, target: uid, tool: uid) =>
    track("ATTACK", (game: GameInstance) => {
        game.output.push(`${subject} attacks ${target} with ${tool}.`);
        return hit(target, 3) (game);
});

const hit = (subject: uid, damage: number) =>
    track("HIT", (game: GameInstance) => {
        game.output.push(`${subject} takes ${damage} damage.`);
        return game;
});