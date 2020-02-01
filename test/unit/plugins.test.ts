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
    InstancePlugin,
    Agent,
    on
} from "../../src";
import { gameInit, ePKAtNum } from "../test-utils";
import { buildGameInstance } from "../../src/state";
import { PluginManager } from "../../src/plugins";
import { inspect } from "util";

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
    constructor(args) {
        super(args);
    }

    /** my docs */
    customFunction = (input: string) => {
        this.game.state.pluginStateVar = input;
    };
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

class AdvancedTestPluginAgent extends Agent {
    private _maxKey = undefined;
    private _maxCount = 0;

    public add(key: string, amount: number) {
        if (!this[key]) {
            this[key] = [];
        }
        const arr = this[key] as number[];

        arr.push(amount);

        const total = arr.reduce((prev, current) => prev + current, 0);
        if (this._maxKey === undefined || total > this._maxCount) {
            this._maxKey = key;
            this._maxCount = total;
        }
    }

    public max() {
        return { key: this._maxKey, count: this._maxCount };
    }

    public getCount(key: string) {
        return this[key]
            ? this[key].reduce((prev, current) => prev + current, 0)
            : undefined;
    }
}

interface AdvancedTestPluginRequiredState {
    advanced: AdvancedTestPluginAgent;
}

interface AdvancedTestPluginOptions {
    multiplier: number;
}

class InstanceAdvancedTestPlugin extends InstancePluginBase<
    AdvancedTestPluginOptions,
    GameInstance<AdvancedTestPluginRequiredState>
> {
    private _state: AdvancedTestPluginAgent;
    public tempValue: string;

    constructor(args) {
        super(args);
        if (!this.game.state.advanced) {
            this.game.state.advanced = new AdvancedTestPluginAgent();
        }
        this._state = this.game.state.advanced;
    }

    public add(key: string, amount: number) {
        this._state.add(key, amount * this.options.multiplier);
    }

    public getMax() {
        return this._state.max();
    }

    public getCount(key: string) {
        return this._state.getCount(key);
    }
}

const AdvancedTestPlugin = definePlugin({
    name: "Advanced Test Plugin",
    version: "23.2.12",
    key: "advanced",
    options: {
        multiplier: {
            defaultValue: 1
        }
    },
    onConstructApi: (
        args: PluginArgs<
            AdvancedTestPluginOptions,
            GameInstance<AdvancedTestPluginRequiredState>
        >
    ) => new InstanceAdvancedTestPlugin(args)
});

const defineTestPlugin = (overrides: Partial<typeof TestPlugin> = {}) =>
    definePlugin({ ...TestPlugin, ...overrides });

const buildTestPluginGameInstance = () =>
    buildGameInstance<TestPluginRequiredState, WithPlugin<typeof TestPlugin>>();

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
            registerPlugin(AdvancedTestPlugin);

            gameInit();
            const myGame = buildGameInstance();

            expect(Object.keys(myGame.plugins).sort()).deep.equals([
                "advanced",
                "test"
            ]);
        });
    });

    describe("Other registered plugin behavior", function() {
        it("Registered plugins can use game state to function", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            myGame.plugins.advanced.add("foo", 1);
            myGame.plugins.advanced.add("bar", 3);
            myGame.plugins.advanced.add("foo", 6);

            expect(myGame.plugins.advanced.getMax()).to.deep.equal({
                key: "foo",
                count: 7
            });
            expect(myGame.plugins.advanced.getCount("bar")).to.equal(3);
        });

        it("Plugins function despite being recycled if they depend on state data", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            myGame.plugins.advanced.add("foo", 1);
            myGame.plugins.advanced.add("bar", 3);

            expect(myGame.plugins.advanced.getMax()).to.deep.equal({
                key: "bar",
                count: 3
            });
            expect(myGame.plugins.advanced.getCount("foo")).to.equal(1);

            const newGame = myGame.recycle();
            newGame.plugins.advanced.add("foo", 4);

            expect(newGame.plugins.advanced.getMax()).to.deep.equal({
                key: "foo",
                count: 5
            });
        });

        it("Plugins are re-constructed every game cycle, clearing all data not in the game state", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            myGame.plugins.advanced.tempValue = "lars";
            expect(myGame.plugins.advanced.tempValue).to.equal("lars");

            const newGame = myGame.recycle();

            expect(newGame.plugins.advanced.tempValue).to.be.undefined;
            expect(myGame.plugins.advanced.tempValue).to.equal("lars");
        });

        it("Plugins are re-constructed every game cycle, so modifying one does not modify others", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            myGame.plugins.advanced.tempValue = "lars";
            const newGame = myGame.recycle();
            newGame.plugins.advanced.tempValue = "boo";

            expect(newGame.plugins.advanced.tempValue).to.equal("boo");
            expect(myGame.plugins.advanced.tempValue).to.equal("lars");
        });

        it("Plugins are re-constructed every game cycle, so modifying one does not modify others (even when dependent on game state)", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            myGame.plugins.advanced.add("lars", 1);
            const newGame = myGame.recycle();
            newGame.plugins.advanced.add("boo", 3);

            expect(myGame.plugins.advanced.getMax()).to.deep.equal({
                key: "lars",
                count: 1
            });
            expect(myGame.plugins.advanced.getCount("boo")).to.be.undefined;

            expect(newGame.plugins.advanced.getMax()).to.deep.equal({
                key: "boo",
                count: 3
            });
            expect(newGame.plugins.advanced.getCount("lars")).to.equal(1);
        });

        it("Reverting a game instance reverts the game state depended on by plugins when trackAgentChanges is false", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            type CustomGame = GameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >;

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >();

            const add = on("ADD", (game: CustomGame) => {
                game.plugins.advanced.add("foo", 1);
            });

            expect(myGame.plugins.advanced.getCount("foo")).to.be.undefined;

            for (let i = 0; i < 10; i++) {
                add(myGame);
            }

            expect(myGame.plugins.advanced.getCount("foo")).to.equal(10);

            const newGame = myGame.revert();
            expect(newGame.plugins.advanced.getCount("foo")).to.be.undefined;
        });

        it("Reverting a game instance reverts the game state depended on by plugins when trackAgentChanges is true", function() {
            registerPlugin(AdvancedTestPlugin);
            gameInit();

            type CustomGame = GameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >;

            const myGame = buildGameInstance<
                AdvancedTestPluginRequiredState,
                WithPlugin<typeof AdvancedTestPlugin>
            >({ trackAgentChanges: true });

            const add = on("ADD", (game: CustomGame) => {
                game.plugins.advanced.add("foo", 1);
            });

            expect(myGame.plugins.advanced.getCount("foo")).to.be.undefined;

            for (let i = 0; i < 10; i++) {
                add(myGame);
            }

            expect(myGame.plugins.advanced.getCount("foo")).to.equal(10);

            expect(
                myGame.revert(ePKAtNum(3)).plugins.advanced.getCount("foo")
            ).to.equal(3);
            expect(
                myGame.revert(ePKAtNum(7)).plugins.advanced.getCount("foo")
            ).to.equal(7);
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
