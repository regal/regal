import { EventId } from "../events";
import { GameInstance } from "../state";
import { InstancePlugin, PluginConstructorArgs } from "./plugin-types";

export abstract class InstancePluginBase<
    Options = object,
    GameType extends GameInstance<any> = GameInstance
> implements InstancePlugin<Options, GameType> {
    public options: Options;
    public game: GameType;

    protected abstract recycle: (
        game: GameType
    ) => InstancePlugin<Options, GameType>;

    protected abstract revert: (
        revertTo: EventId,
        game: GameType
    ) => InstancePlugin<Options, GameType>;

    constructor(
        args: PluginConstructorArgs<InstancePlugin<Options, GameType>>
    ) {
        this.options = args.options;
        this.game = args.game;
    }
}
