/**
 * Contains the `InstanceState` class, which is an agent used to store
 * references to custom data in the `GameInstance` across game cycles.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import { Agent } from "./agent-model";

/**
 * Free-form agent to contain any instance state desired by the game developer,
 * and has a reserved agent id of 0.
 *
 * Properties set within this object are maintained between game cycles, so
 * it should be used to store long-term state.
 */
export class InstanceState extends Agent {
    /**
     * Constructs a new `InstanceState` and registers it with the `GameInstance.
     * @param game The `GameInstance` that manages this state.
     */
    constructor(game: GameInstance) {
        super();
        return this.register(game, 0);
    }
}
