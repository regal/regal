import { expect } from "chai";
import "mocha";

import { definePlugin, InstancePluginBase } from "../../src/plugins";
import { GameInstance } from "../../src";
import { EventId } from "../../src/events";

describe("Plugins", function() {
    interface TestOptions {
        foo: string;
    }

    interface TestGameType {
        stateProp: number;
    }

    class InstanceTestPlugin extends InstancePluginBase<
        TestOptions,
        GameInstance<TestGameType>
    > {
        constructor(args) {
            super(args);
        }

        recycle = (game: GameInstance<TestGameType>) =>
            new InstanceTestPlugin({ options: this.options, game });

        revert = (revertTo: EventId, game: GameInstance<TestGameType>) =>
            this.recycle(game);
    }

    it("Using definePlugin", function() {
        const testPlugin = definePlugin({
            name: "Test Plugin",
            version: "v0.0.1",
            key: "test",
            options: { foo: { defaultValue: "bar" } },
            onConstructApi: args => new InstanceTestPlugin(args)
        });

        const key = testPlugin.key;
        const options = testPlugin.options;
        const api = testPlugin.onConstructApi({} as any);
        const tp = new InstanceTestPlugin({} as any);
    });
});
