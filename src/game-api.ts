import GameInstance from "./game-instance";
import { GameOptions } from "./game-config";
import { GameOutput } from "./output";

export const Game = {

    getOptionCommand(instance: GameInstance, options: string[]): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    },

    getMetadataCommand(): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    },

    postPlayerCommand(instance: GameInstance, command: string): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    },

    postStartCommand(options: GameOptions): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    },

    postUndoCommand(instance: GameInstance): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    },

    postOptionCommand(instance: GameInstance, options: GameOptions): GameResponse {
        // TODO
        throw new Error("Method not implemented");
    }
};

export interface GameResponse {
    instance?: GameInstance;
    output: GameOutput;
}