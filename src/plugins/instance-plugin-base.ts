import { GameInstance } from "../state";
import { InstancePlugin, PluginArgs } from "./plugin-types";

export abstract class InstancePluginBase<
    Options = object,
    GameType extends GameInstance = GameInstance
> implements InstancePlugin<Options, GameType> {
    public options: Options;

    public game: GameType;

    constructor(args: PluginArgs<Options, GameType>) {
        this.options = args.options;
        this.game = args.game;
    }
}
