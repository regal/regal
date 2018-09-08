import { expect } from "chai";
import "mocha";

import GameInstance from "../src/game-instance";
import { RegalError } from "../src/error";
import {
    OPTION_KEYS,
    DEFAULT_GAME_OPTIONS,
    MetadataManager,
    ensureOverridesAllowed
} from "../src/config";
import { OutputLineType } from "../src/output";
import { getDemoMetadata, metadataWithOptions } from "./test-utils";

describe("Config", function() {
    beforeEach(function() {
        MetadataManager.forceConfig(getDemoMetadata());
    });

    afterEach(function() {
        MetadataManager.reset();
    });

    describe("Game Options", function() {
        it("Test defaults", function() {
            const myGame = new GameInstance();
            OPTION_KEYS.forEach(key => {
                expect(myGame.options[key]).to.deep.equal(
                    DEFAULT_GAME_OPTIONS[key]
                );
            });
        });

        describe("GameOption Validation", function() {
            it("GameOptions.debug VALID", function() {
                const myGame = new GameInstance({ debug: true });
                expect(myGame.options.overrides).to.deep.equal({
                    debug: true
                });
                expect(myGame.options.debug).to.be.true;
            });

            it("GameOptions.debug INVALID", function() {
                expect(() => new GameInstance(<any>{ debug: 3 })).to.throw(
                    RegalError,
                    "RegalError: The option <debug> is of type <number>, must be of type <boolean>."
                );
            });

            // allowOverrides cannot be overridden, so the following tests require changing the metadata config

            it("GameOptions.allowOverrides VALID: boolean", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions({ allowOverrides: true })
                );

                const myGame = new GameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.be.true;
            });

            it("GameOptions.allowOverrides VALID: empty array", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions({ allowOverrides: [] })
                );

                const myGame = new GameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.deep.equal([]);
            });

            it("GameOptions.allowOverrides VALID: valid array", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions({
                        allowOverrides: ["debug", "showMinor"]
                    })
                );

                const myGame = new GameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.deep.equal([
                    "debug",
                    "showMinor"
                ]);
            });

            it("GameOptions.allowOverrides INVALID: mistype", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions(<any>{ allowOverrides: 3 })
                );
                expect(() => new GameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <allowOverrides> is of type <number>, must be of type <boolean> or <string[]>."
                );
            });

            it("GameOptions.allowOverrides INVALID: illegal array", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions({ allowOverrides: ["debug", "blark"] })
                );
                expect(() => new GameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <blark> does not exist."
                );
            });

            it("GameOptions.allowOverrides INVALID: allowing allowOverrides", function() {
                MetadataManager.forceConfig(
                    metadataWithOptions({ allowOverrides: ["allowOverrides"] })
                );
                expect(() => new GameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <allowOverrides> is not allowed to be overridden."
                );
            });

            it("GameOptions.showMinor VALID", function() {
                const myGame = new GameInstance({ showMinor: true });
                expect(myGame.options.overrides).to.deep.equal({
                    showMinor: true
                });
                expect(myGame.options.showMinor).to.be.true;
            });

            it("GameOptions.showMinor INVALID", function() {
                expect(() => new GameInstance(<any>{ showMinor: 3 })).to.throw(
                    RegalError,
                    "RegalError: The option <showMinor> is of type <number>, must be of type <boolean>."
                );
            });
        });

        describe("Option Behavior", function() {
            it("DEBUG output is not printed when GameOptions.debug is set to false", function() {
                const myGame = new GameInstance({ debug: false });
                myGame.output.writeDebug("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([]);
            });

            it("DEBUG output is printed when GameOptions.debug is set to true", function() {
                const myGame = new GameInstance({ debug: true });
                myGame.output.writeDebug("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([
                    {
                        id: 1,
                        type: OutputLineType.DEBUG,
                        data: "Hello, world!"
                    }
                ]);
            });

            it("MINOR output is not printed when GameOptions.showMinor is set to false", function() {
                const myGame = new GameInstance({ showMinor: false });
                myGame.output.writeMinor("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([]);
            });

            it("MINOR output is printed when GameOptions.showMinor is set to true", function() {
                const myGame = new GameInstance({ showMinor: true });
                myGame.output.writeMinor("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([
                    {
                        id: 1,
                        type: OutputLineType.MINOR,
                        data: "Hello, world!"
                    }
                ]);
            });
        });
    });

    describe("InstanceOptions", function() {
        it("The properties of InstanceOptions cannot be modified", function() {
            const myGame = new GameInstance();
            expect(() => (myGame.options.debug = true)).to.throw(
                RegalError,
                "Cannot modify the properties of InstanceOptions."
            );
        });

        it("The properties of InstanceOptions.overrides cannot be modified", function() {
            const myGame = new GameInstance();
            expect(
                () => ((<any>myGame.options.overrides).debug = true)
            ).to.throw(
                RegalError,
                "Cannot modify the properties of the InstanceOption option overrides."
            );
        });

        it("ensureOverridesAllowed blocks overriding of the allowOverrides option", function() {
            expect(() =>
                ensureOverridesAllowed({ allowOverrides: true }, true)
            ).to.throw(
                RegalError,
                "The allowOverrides option can never be overridden."
            );
        });

        it("InstanceOptions cannot be created with forbidden options", function() {
            MetadataManager.forceConfig(
                metadataWithOptions({ allowOverrides: ["debug"] })
            );

            expect(() => new GameInstance({ showMinor: false })).to.throw(
                RegalError,
                "The following option overrides are forbidden: <showMinor>."
            );
        });
    });
});
