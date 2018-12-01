/*
 * Contains the read-only container for all options in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameOptions } from "./game-options";

/**
 * Read-only container that provides an API to view the game instance's current game options.
 */
// tslint:disable-next-line:no-empty-interface
export interface InstanceOptions extends GameOptions {}
