import { expect } from "chai";
import "mocha";

import {
    InstancePluginBase,
    GameInstance,
    EventId,
    PluginArgs,
    definePlugin,
    Game,
    RegalError,
    registerPlugin,
    WithPlugin,
    InstancePlugin
} from "../../src";
import { gameInit } from "../test-utils";
import { buildGameInstance } from "../../src/state";
import { PluginManager } from "../../src/plugins";

interface TestOptions {
    option1: string;
    option2: boolean;
}

interface TestPluginRequiredState {
    pluginStateVar: string;
}

class InstanceTestPlugin extends InstancePluginBase<
    TestOptions,
    GameInstance<TestPluginRequiredState>
> {
    public recycle = (args: PluginArgs<TestOptions>) =>
        new InstanceTestPlugin(args, true);

    public revert: (
        revertTo: EventId,
        pluginArgs: PluginArgs
    ) => InstanceTestPlugin;

    constructor(args, public wasRecycled = false) {
        super(args);
    }

    /** my docs */
    customFunction = (input: string) => {
        this.game.state.pluginStateVar = input;
    };
}

class InstanceRecycleTestPlugin extends InstancePluginBase {
    constructor(args, public allTimeCalls = []) {
        super(args);
    }

    public recycle = args =>
        new InstanceRecycleTestPlugin(args, [
            ...this.allTimeCalls,
            ...this.thisTimeCalls
        ]);

    public revert = (revertTo: EventId, args) =>
        new InstanceRecycleTestPlugin(args, [...this.allTimeCalls]);

    public thisTimeCalls = [];

    public add = (s: string) => this.thisTimeCalls.push(s);
}

const TestPlugin = definePlugin({
    name: "Test Plugin",
    version: "v0.0.1",
    key: "test",
    options: {
        option1: {
            defaultValue: "foo",
            description: "my really cool option"
        },
        option2: {
            defaultValue: true
        }
    },
    onConstructApi: (args: PluginArgs<TestOptions>) =>
        new InstanceTestPlugin(args)
});

const RecycleTestPlugin = definePlugin({
    name: "Recycle Test Plugin",
    version: "23.2.12",
    key: "recycleTest",
    options: {},
    onConstructApi: (args: PluginArgs) => new InstanceRecycleTestPlugin(args)
});

const defineTestPlugin = (overrides: Partial<typeof TestPlugin> = {}) =>
    definePlugin({ ...TestPlugin, ...overrides });

const buildTestPluginGameInstance = () =>
    buildGameInstance<TestPluginRequiredState, WithPlugin<typeof TestPlugin>>();

const buildAllTestPluginsGameInstance = () =>
    buildGameInstance<
        TestPluginRequiredState,
        WithPlugin<typeof TestPlugin> & WithPlugin<typeof RecycleTestPlugin>
    >();

describe("Plugins", function() {
    beforeEach(function() {
        Game.reset();
    });

    describe("Defining plugins", function() {
        it("definePlugin accepts a valid plugin and returns it", function() {
            expect(defineTestPlugin()).to.deep.equal(TestPlugin);
        });

        it("definePlugin rejects a plugin with an invalid key type", function() {
            expect(() => defineTestPlugin({ key: false } as any)).to.throw(
                RegalError
            );
        });

        it("definePlugin rejects a plugin with an empty string as a key", function() {
            expect(() => defineTestPlugin({ key: "" } as any)).to.throw(
                RegalError
            );
        });

        it("definePlugin rejects a plugin with a non-standard version string", function() {
            expect(() => defineTestPlugin({ version: "arf" })).to.throw(
                RegalError
            );
        });

        it("definePlugin accepts versions that may or may not start with 'v'", function() {
            expect(defineTestPlugin({ version: "1.23.0" }).version).to.equal(
                "1.23.0"
            );
            expect(defineTestPlugin({ version: "v1.23.0" }).version).to.equal(
                "v1.23.0"
            );
        });
    });

    describe("Registering plugins", function() {
        it("Registering makes that plugin's options accessible at game.plugins[key]", function() {
            registerPlugin(defineTestPlugin());
            gameInit();

            const myGame = buildTestPluginGameInstance();

            expect(
                Object.keys(myGame.plugins.test.options).sort()
            ).to.deep.equal(["option1", "option2"]);
        });

        it("Registering sets that plugin's options to their default values if no override is provided", function() {
            registerPlugin(defineTestPlugin());
            gameInit();

            const myGame = buildTestPluginGameInstance();
            const { option1, option2 } = myGame.plugins.test.options;

            expect(option1).to.equal(TestPlugin.options.option1.defaultValue);
            expect(option2).to.equal(TestPlugin.options.option2.defaultValue);
        });

        it("Registering makes those plugin's custom methods accessible at game.plugins[key]", function() {
            registerPlugin(defineTestPlugin());
            gameInit();

            const myGame = buildTestPluginGameInstance();

            expect(myGame.state.pluginStateVar).to.be.undefined;
            myGame.plugins.test.customFunction("lars");
            expect(myGame.state.pluginStateVar).to.equal("lars");
        });

        it("Registering multiple plugins with the same key throws an error", function() {
            registerPlugin(defineTestPlugin());

            expect(() => registerPlugin(defineTestPlugin())).to.throw(
                RegalError
            );
        });

        it("Registering outside the static context throws an error", function() {
            gameInit();
            expect(() => registerPlugin(defineTestPlugin())).to.throw(
                RegalError
            );
        });

        it("game.plugins has keys for every registered plugin", function() {
            registerPlugin(TestPlugin);
            registerPlugin(RecycleTestPlugin);

            gameInit();
            const myGame = buildGameInstance();

            expect(Object.keys(myGame.plugins).sort()).deep.equals([
                "recycleTest",
                "test"
            ]);
        });
    });

    describe("Other registered plugin behavior", function() {
        it("Recycling the gameInstance runs every plugin's recycle function", function() {
            registerPlugin(TestPlugin);
            registerPlugin(RecycleTestPlugin);

            gameInit();

            const myGame = buildAllTestPluginsGameInstance();
            myGame.plugins.recycleTest.add("lars");
            myGame.plugins.recycleTest.add("foo");

            // Test plugins' initial states
            expect(myGame.plugins.test.wasRecycled).to.be.false;
            expect(myGame.plugins.recycleTest.thisTimeCalls).to.deep.equal([
                "lars",
                "foo"
            ]);
            expect(myGame.plugins.recycleTest.allTimeCalls).to.deep.equal([]);

            const newGame = myGame.recycle();
            newGame.plugins.recycleTest.add("bar");

            // Confirm plugins' initial states hold after recycling on the old instance
            expect(myGame.plugins.test.wasRecycled).to.be.false;
            expect(myGame.plugins.recycleTest.thisTimeCalls).to.deep.equal([
                "lars",
                "foo"
            ]);
            expect(myGame.plugins.recycleTest.allTimeCalls).to.deep.equal([]);

            // Test plugins' post-recycle states on the new instance
            expect(newGame.plugins.test.wasRecycled).to.be.true;
            expect(newGame.plugins.recycleTest.thisTimeCalls).to.deep.equal([
                "bar"
            ]);
            expect(newGame.plugins.recycleTest.allTimeCalls).to.deep.equal([
                "lars",
                "foo"
            ]);
        });
    });

    describe("PluginManager internal tests", function() {
        it("Initializing multiple times throws an error", function() {
            PluginManager.init();
            expect(() => PluginManager.init()).to.throw(RegalError);
        });

        it("PluginManager.getPluginsConstructor throws an error if not .init() hasn't been called", function() {
            expect(() => PluginManager.getPluginsConstructor()).to.throw(
                RegalError
            );
        });
    });
});
