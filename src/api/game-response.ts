import { GameMetadata } from "../config";
import { RegalError } from "../error";
import { OutputLine } from "../output";
import { GameInstance } from "../state";

/**
 * Interface for the response of every `Game` API method,
 * containing some output and a `GameInstance`, if applicable.
 */
export interface GameResponse {
    /**
     * The new instance state of the game.
     *
     * Will not be defined if an error occurred during the request,
     * or if `getMetdataCommand` was called.
     */
    instance?: GameInstance;

    /**
     * The output generated by the request, which will vary in
     * structure depending on the request and if it was successful.
     */
    output: GameResponseOutput;
}

/**
 * Represents the output generated by a request to the `Game` API.
 */
export interface GameResponseOutput {
    /** Whether the request was executed successfully. */
    wasSuccessful: boolean;

    /** The error that was thrown if `wasSuccessful` is false. */
    error?: RegalError;

    /** Contains any lines of output emitted because of the request. */
    log?: OutputLine[];

    /** Contains the game's metadata if `Game.getMetdataCommand` was called. */
    metadata?: GameMetadata;
}
