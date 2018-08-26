import GameInstance from "./game-instance";
import { GameOptions } from "./game-config";
import { GameOutput } from "./output";
import { HookManager } from "./api-hooks";
import { RegalError } from "./error";

const validateGameInstance = (instance: GameInstance): void => {
    if (
        instance === undefined ||
        instance.agents === undefined ||
        instance.events === undefined ||
        instance.output === undefined ||
        instance.state === undefined
    ) {
        throw new RegalError("Invalid GameInstance.");
    }
};

const wrapApiErrorAsRegalError = (err: any): RegalError => {
    if (!err || !err.stack || !err.message) {
        throw new RegalError("Not a valid error object.");
    }
    
    // If err is already a RegalError, return it
    if (err.message.indexOf("RegalError:") !== -1) {
        return err;
    }

    // Else, create a RegalError
    const msg = `An error occurred while executing the request. Details: ${err.message}`;
    const newErr = new RegalError(msg);
    newErr.stack = err.stack;

    return newErr;
}

const cloneGame = (instance: GameInstance): GameInstance => {
    // TODO
    return instance;
};

export class Game {

    static getOptionCommand(instance: GameInstance, options: string[]): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    static getMetadataCommand(): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    static postPlayerCommand(instance: GameInstance, command: string): GameResponse {
        validateGameInstance(instance);

        if (command === undefined) {
            throw new RegalError("Command must be defined.");
        }
        if (HookManager.playerCommandHook === undefined) {
            throw new RegalError("onPlayerCommand has not been implemented by the game developer.");
        }

        let newInstance = cloneGame(instance);
        let err: RegalError;

        try {
            const activatedEvent = HookManager.playerCommandHook(command);
            newInstance.events.invoke(activatedEvent);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        let response: GameResponse;
        
        if (err !== undefined) {
            const output: GameOutput = {
                wasSuccessful: false,
                error: err
            };

            response = {
                output
            };
        } else {
            const output: GameOutput = {
                wasSuccessful: true,
                log: newInstance.output.lines
            };

            response = {
                instance: newInstance,
                output
            }
        }

        return response;
    }

    static postStartCommand(options: GameOptions): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    static postUndoCommand(instance: GameInstance): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    static postOptionCommand(instance: GameInstance, options: GameOptions): GameResponse {
        // TODO
        throw new Error("Method not implemented");
    }
};

export interface GameResponse {
    instance?: GameInstance;
    output: GameOutput;
}