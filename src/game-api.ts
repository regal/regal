import { buildRevertFunction, StaticAgentRegistry } from "./agents";
import { HookManager } from "./api-hooks";
import { GameOptions, MetadataManager, OPTION_KEYS } from "./config";
import { RegalError } from "./error";
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

const buildLogResponse = (err: RegalError, newInstance: GameInstance) => {
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
};

export class Game {
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

        return buildLogResponse(err, newInstance);
    }

    public static postStartCommand(
        options: Partial<GameOptions> = {}
    ): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            if (HookManager.startCommandHook === undefined) {
                throw new RegalError(
                    "onStartCommand has not been implemented by the game developer."
                );
            }

            newInstance = new GameInstance(options);
            newInstance.events.invoke(HookManager.startCommandHook);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return buildLogResponse(err, newInstance);
    }

    public static postUndoCommand(instance: GameInstance): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            validateGameInstance(instance);

            // TODO - include onBeforeUndoCommand hook

            newInstance = instance.cycle();
            buildRevertFunction(instance.agents)(newInstance);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return err !== undefined
            ? {
                  output: {
                      error: err,
                      wasSuccessful: false
                  }
              }
            : {
                  instance: newInstance,
                  output: {
                      wasSuccessful: true
                  }
              };
    }

    public static postOptionCommand(
        instance: GameInstance,
        options: Partial<GameOptions>
    ): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            validateGameInstance(instance);

            const oldOverrideKeys = Object.keys(instance.options.overrides);
            const newOptionKeys = Object.keys(options);

            const newOptions: Partial<GameOptions> = {};

            oldOverrideKeys
                .filter(key => !newOptionKeys.includes(key))
                .forEach(key => (newOptions[key] = instance.options[key]));
            newOptionKeys.forEach(key => (newOptions[key] = options[key]));

            newInstance = instance.cycle(newOptions);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return err !== undefined
            ? {
                  output: {
                      error: err,
                      wasSuccessful: false
                  }
              }
            : {
                  instance: newInstance,
                  output: {
                      wasSuccessful: true
                  }
              };
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
