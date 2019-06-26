import { expect } from "chai";
import "mocha";

import {
    generateSeed,
    Charsets,
    InstanceRandom,
    buildInstanceRandom,
    SEED_LENGTH,
    DEFAULT_SEED_CHARSET
} from "../../src/random";
import { buildGameInstance } from "../../src/state";
import { RegalError } from "../../src/error";
import { log, getDemoMetadata } from "../test-utils";
import { Game } from "../../src/api";
import { Agent, isAgent } from "../../src/agents";
import { on } from "../../src/events";

describe("Random", function() {
    beforeEach(function() {
        Game.reset();
        Game.init(getDemoMetadata());
    });

    describe("Generate Seed", function() {
        it("Generates a random string with the given charset and length", function() {
            const seed = generateSeed();

            expect(seed.length).to.equal(SEED_LENGTH);
            for (let i = 0; i < seed.length; i++) {
                expect(DEFAULT_SEED_CHARSET.includes(seed[i])).to.be.true;
            }
        });

        it("Generates a unique seed every time", function() {
            expect(generateSeed()).to.not.equal(generateSeed()); // This has a 1/(89^10) chance of failing. If it does, repent.
        });
    });

    describe("InstanceRandom", function() {
        it("InstanceRandom has the seed specified by the config option", function() {
            const myGame = buildGameInstance();
            expect(myGame.random.seed).to.equal(myGame.options.seed);
        });

        it("Generating a random value increments numGenerations", function() {
            const myGame = buildGameInstance();
            expect(myGame.random.numGenerations).to.equal(0);

            myGame.random.int(0, 10);
            expect(myGame.random.numGenerations).to.equal(1);

            myGame.random.decimal();
            expect(myGame.random.numGenerations).to.equal(2);

            myGame.random.string(5);
            expect(myGame.random.numGenerations).to.equal(3);

            myGame.random.choice([true, false, "3"]);
            expect(myGame.random.numGenerations).to.equal(4);

            myGame.random.boolean();
            expect(myGame.random.numGenerations).to.equal(5);
        });

        it("Generating two GameInstances with the same seed generates the same values", function() {
            const rand1 = buildGameInstance({ seed: "foo" }).random;
            const rand2 = buildGameInstance({ seed: "foo" }).random;

            const ops: ((random: InstanceRandom) => any)[] = [
                rand => rand.int(-5, 15),
                rand => rand.decimal(),
                rand => rand.string(20),
                rand => rand.string(1, "832hds0a9dn."),
                rand => rand.choice(["a", "b", "c"]),
                rand => rand.boolean(),
                rand => rand.int(100, 101)
            ];

            for (const op of ops) {
                expect(op(rand1)).to.equal(op(rand2));
            }
        });

        it("Recycling an InstanceRandom preserves numGenerations", function() {
            const game1 = buildGameInstance();
            game1.random.decimal();
            expect(game1.random.numGenerations).to.equal(1);

            const game2 = game1.recycle();
            expect(game2.random.numGenerations).to.equal(1);
        });

        it("Recycling an InstanceRandom preserves seed", function() {
            const game1 = buildGameInstance();
            const game2 = game1.recycle();

            expect(game1.options.seed).to.equal(game2.options.seed);
            expect(game1.random.seed).to.equal(game2.random.seed);
        });

        it("Recycling an InstanceRandom maintains the stream of generated values", function() {
            const game1 = buildGameInstance();
            game1.random.decimal();
            game1.random.decimal();

            const game2 = game1.recycle();
            expect(game1.random.decimal()).to.equal(game2.random.decimal());
            expect(game1.random.string(5)).to.equal(game2.random.string(5));
        });

        it("Throws an error if no seed exists", function() {
            const invalidGame = buildGameInstance();
            delete (invalidGame.options as any).seed;

            expect(() => buildInstanceRandom(invalidGame)).to.throw(
                RegalError,
                "Seed must be defined before an InstanceRandom can be constructed."
            );
        });

        describe("InstanceRandom.int()", function() {
            it("Generates a random integer within the range (inclusive)", function() {
                const myGame = buildGameInstance();
                const min = -5;
                const max = 100;

                const result = myGame.random.int(min, max);

                expect(result >= min).to.be.true;
                expect(result <= max).to.be.true;
                expect(Math.floor(result)).to.equal(result);
            });

            it("Chooses the only available number when min and max are equal", function() {
                const myGame = buildGameInstance();
                const num = 10;

                expect(myGame.random.int(num, num)).to.equal(num);
            });

            it("Throws an error if min is greater than max", function() {
                const myGame = buildGameInstance();
                const min = 10;
                const max = 0;

                expect(() => myGame.random.int(min, max)).to.throw(
                    RegalError,
                    "Min <10> must be less than or equal to max <0>."
                );

                expect(myGame.random.numGenerations).to.equal(0);
            });
        });

        describe("InstanceRandom.decimal()", function() {
            it("Generates a random decimal between zero and one", function() {
                const myGame = buildGameInstance();
                let result = myGame.random.decimal();

                while (result === 0) {
                    result = myGame.random.decimal();
                }

                expect(result > 0).to.be.true;
                expect(result < 1).to.be.true;
            });
        });

        describe("InstanceRandom.string()", function() {
            it("Generates a random string of the given length with the given charset", function() {
                const myGame = buildGameInstance();
                let len = 0;

                for (const charset in Charsets) {
                    len += 3;
                    const result = myGame.random.string(len, charset);

                    expect(result.length).to.equal(len);
                    for (let i = 0; i < len; i++) {
                        expect(charset.includes(result[i])).to.be.true;
                    }
                }
            });

            it("Defaults to use EXPANDED_CHARSET", function() {
                const myGame = buildGameInstance();
                const len = 10;

                const result = myGame.random.string(len);

                expect(result.length).to.equal(len);
                for (let i = 0; i < len; i++) {
                    expect(Charsets.EXPANDED_CHARSET.includes(result[i])).to.be
                        .true;
                }
            });

            it("Can make a string longer than the length of the charset", function() {
                const len = 20;
                const charset = Charsets.NUMBERS_CHARSET;

                expect(charset.length).to.be.lessThan(len); // Precondition

                const myGame = buildGameInstance();
                const result = myGame.random.string(len, charset);

                expect(result.length).to.equal(len);
            });

            it("Returns a string with a single character if length is one", function() {
                const myGame = buildGameInstance();
                const result = myGame.random.string(1);

                expect(result.length).to.equal(1);
                expect(DEFAULT_SEED_CHARSET.includes(result)).to.be.true;
            });

            it("Throws an error if string is less than or equal to zero", function() {
                const myGame = buildGameInstance();
                expect(() => myGame.random.string(0)).to.throw(
                    RegalError,
                    "Length <0> must be greater than zero."
                );
                expect(myGame.random.numGenerations).to.equal(0);
            });

            it("Throws an error if charset is only one character", function() {
                const myGame = buildGameInstance();
                expect(() => myGame.random.string(5, "a")).to.throw(
                    RegalError,
                    "Charset <a> must have at least two unique characters."
                );
                expect(myGame.random.numGenerations).to.equal(0);
            });

            it("Generates a seeded string using a custom binary charset", function() {
                const myGame = buildGameInstance({ seed: "lars" });
                expect(myGame.random.string(16, "01")).to.equal(
                    "1111010110110000"
                );
            });

            it("Throws an error if charset does not have at least two unique characters", function() {
                const myGame = buildGameInstance();
                expect(() => myGame.random.string(5, "OOO")).to.throw(
                    RegalError,
                    "Charset <OOO> must have at least two unique characters."
                );
                expect(myGame.random.numGenerations).to.equal(0);
            });

            it("Allows duplicates if there are at least two unique characters", function() {
                const myGame = buildGameInstance({ seed: "lars" });
                expect(myGame.random.string(5, "abababab")).to.equal("ababb");
            });
        });

        describe("InstanceRandom.choice()", function() {
            it("Picks a random element from an array", function() {
                const arr = [1, "foo", false];
                const myGame = buildGameInstance();

                expect(arr.includes(myGame.random.choice(arr)));
                expect(arr.length).to.equal(3);
            });

            it("Returns the only element in a singleton array", function() {
                const arr = ["sup"];
                const myGame = buildGameInstance();

                expect(myGame.random.choice(arr)).to.equal("sup");
            });

            it("Returns undefined for an empty array", function() {
                const myGame = buildGameInstance();
                expect(myGame.random.choice([])).to.be.undefined;
            });

            it("Throws an error if passed undefined", function() {
                const myGame = buildGameInstance();
                expect(() => myGame.random.choice(undefined)).to.throw(
                    RegalError,
                    "Array must be defined."
                );
                expect(myGame.random.numGenerations).to.equal(0);
            });

            it("Can choose a random agent from an agent array", function() {
                class TestAgent extends Agent {
                    constructor(public n: number) {
                        super();
                    }
                }

                const myGame = buildGameInstance();
                const arr = myGame.using([
                    new TestAgent(2),
                    new TestAgent(3),
                    new TestAgent(4)
                ]);

                const result = myGame.random.choice(arr);
                expect(isAgent(result)).to.be.true;
                expect(result.n > 1 && result.n <= 4).to.be.true;
            });
        });

        describe("InstanceAgents.boolean()", function() {
            it("Picks either true or false", function() {
                const myGame = buildGameInstance();
                let result = myGame.random.boolean();

                // This looks hacky, but it ensures that the method returns true and false, and not undefined
                if (result === true) {
                    while (result === true) {
                        result = myGame.random.boolean();
                    }
                    expect(result).to.be.false;
                } else {
                    expect(result).to.be.false;
                    while (result === false) {
                        result = myGame.random.boolean();
                    }
                    expect(result).to.be.true;
                }
            });
        });

        it("Generated values are recorded in InstanceEvent's EventRecord history", function() {
            interface S {
                randos: any[];
            }

            const rand1 = on<S>("RAND1", game => {
                game.state.randos = [];
                const randos = game.state.randos;

                randos.push(game.random.boolean());
                randos.push(game.random.decimal());
            });

            const rand2 = on<S>("RAND2", game => {
                const randos = game.state.randos;

                randos.push(game.random.int(1, 10));
                randos.push(game.random.string(5));
                randos.push(game.random.choice(randos));
            });

            const myGame = buildGameInstance<S>({ seed: "wooof" });
            rand1.then(rand2)(myGame);

            expect(myGame.state.randos).to.deep.equal([
                false,
                0.0217038414025921,
                10,
                "IcR*G",
                false
            ]);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: 2,
                    name: "RAND2",
                    randoms: [
                        { id: 2, value: 10 },
                        { id: 3, value: "IcR*G" },
                        { id: 4, value: 0 } // InstanceRandom.choice records the index of the selected element, not the element itself
                    ]
                },
                {
                    id: 1,
                    name: "RAND1",
                    randoms: [
                        { id: 0, value: false },
                        { id: 1, value: 0.0217038414025921 }
                    ]
                }
            ]);
        });
    });
});
