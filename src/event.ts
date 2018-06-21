import {GameInstance} from './gameInstance';

export type EventFunction = (x: GameInstance) => GameInstance;

export const track = (name: string, func: EventFunction): EventFunction => 
    (game: GameInstance) => {
        game.events.push(name);
        return func(game);
};

export const noop = () => (game: GameInstance) => game;