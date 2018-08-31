import { StaticAgentRegistry } from "./agents";
import { HookManager } from "./api-hooks";
import { RegalError } from "./error";
import { GameOptions } from "./game-config";
import GameInstance from "./game-instance";
import { GameOutput } from "./output";

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
    if (!err || !err.name || !err.stack || !err.message) {
        return new RegalError("Invalid error object.");
    }

    // If err is already a RegalError, return it
    if (err.message.indexOf("RegalError:") !== -1) {
        return err;
    }

    // Else, create a RegalError
    const msg = `An error occurred while executing the request. Details: <${
        err.name
    }: ${err.message}>`;
    const newErr = new RegalError(msg);
    newErr.stack = err.stack;

    return newErr;
};

export class Game {
    public static getOptionCommand(
        instance: GameInstance,
        options: string[]
    ): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    public static getMetadataCommand(): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    public static postPlayerCommand(
        instance: GameInstance,
        command: string
    ): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            validateGameInstance(instance);

            if (command === undefined) {
                throw new RegalError("Command must be defined.");
            }
            if (HookManager.playerCommandHook === undefined) {
                throw new RegalError(
                    "onPlayerCommand has not been implemented by the game developer."
                );
            }

            newInstance = instance.cycle();

            const activatedEvent = HookManager.playerCommandHook(command);
            newInstance.events.invoke(activatedEvent);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        let response: GameResponse;

        if (err !== undefined) {
            const output: GameOutput = {
                error: err,
                wasSuccessful: false
            };

            response = {
                output
            };
        } else {
            const output: GameOutput = {
                log: newInstance.output.lines,
                wasSuccessful: true
            };

            response = {
                instance: newInstance,
                output
            };
        }

        return response;
    }

    public static postStartCommand(options: GameOptions): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    public static postUndoCommand(instance: GameInstance): GameResponse {
        // TODO
        throw new Error("Method not implemented.");
    }

    public static postOptionCommand(
        instance: GameInstance,
        options: GameOptions
    ): GameResponse {
        // TODO
        throw new Error("Method not implemented");
    }
}

export interface GameResponse {
    instance?: GameInstance;
    output: GameOutput;
}

export const resetGame = () => {
    HookManager.resetHooks();
    StaticAgentRegistry.resetRegistry();
};
