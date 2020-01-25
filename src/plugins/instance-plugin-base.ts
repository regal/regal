import { EventId } from "../events";
import { GameInstance } from "../state";
import { InstancePlugin, PluginArgs } from "./plugin-types";

export abstract class InstancePluginBase<
    Options = object,
    GameType extends GameInstance = GameInstance
> implements InstancePlugin<Options, GameType> {
    public abstract recycle: (
        game: GameType
    ) => InstancePlugin<Options, GameType>;

    public abstract revert: (
        revertTo: EventId,
        game: GameType
    ) => InstancePlugin<Options, GameType>;

    public options: Options;

    public game: GameType;

    constructor(args: PluginArgs<InstancePlugin<Options, GameType>>) {
        this.options = args.options;
        this.game = args.game;
    }
}
