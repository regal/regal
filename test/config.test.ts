import { expect } from "chai";
import "mocha";

import GameInstance from "../src/game-instance";
import { RegalError } from "../src/error";
import { OPTION_KEYS, DEFAULT_GAME_OPTIONS } from "../src/config";
import { OutputLineType } from "../src/output";

describe("Config", function() {
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

            it("GameOptions.forbidChanges VALID: boolean", function() {
                const myGame = new GameInstance({ forbidChanges: true });
                expect(myGame.options.overrides).to.deep.equal({
                    forbidChanges: true
                });
                expect(myGame.options.forbidChanges).to.be.true;
            });

            it("GameOptions.forbidChanges VALID: empty array", function() {
                const myGame = new GameInstance({ forbidChanges: [] });
                expect(myGame.options.overrides).to.deep.equal({
                    forbidChanges: []
                });
                expect(myGame.options.forbidChanges).to.deep.equal([]);
            });

            it("GameOptions.forbidChanges VALID: valid array", function() {
                const myGame = new GameInstance({
                    forbidChanges: ["debug", "forbidChanges"]
                });
                expect(myGame.options.overrides).to.deep.equal({
                    forbidChanges: ["debug", "forbidChanges"]
                });
                expect(myGame.options.forbidChanges).to.deep.equal([
                    "debug",
                    "forbidChanges"
                ]);
            });

            it("GameOptions.forbidChanges INVALID: mistype", function() {
                expect(
                    () => new GameInstance(<any>{ forbidChanges: 3 })
                ).to.throw(
                    RegalError,
                    "RegalError: The option <forbidChanges> is of type <number>, must be of type <boolean> or <string[]>."
                );
            });

            it("GameOptions.forbidChanges INVALID: illegal array", function() {
                expect(
                    () =>
                        new GameInstance({ forbidChanges: ["debug", "blark"] })
                ).to.throw(
                    RegalError,
                    "RegalError: The option <blark> does not exist."
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
    });
});
