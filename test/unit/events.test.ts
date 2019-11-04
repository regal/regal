import { expect } from "chai";
import "mocha";

import { RegalError } from "../../src/error";
import {
    on,
    noop,
    EventRecord,
    TrackedEvent,
    nq,
    isEventQueue,
    enqueue,
    GameEventBuilder,
    getUntrackedEventPK
} from "../../src/events";
import {
    log,
    getDemoMetadata,
    Dummy,
    aPKs,
    oPKs,
    getInitialOutputPK,
    ePKs
} from "../test-utils";
import {
    Agent,
    PropertyOperation,
    StaticAgentRegistry,
    getGameInstancePK
} from "../../src/agents";
import { OutputLineType } from "../../src/output";
import { Game } from "../../src/api";
import { buildGameInstance } from "../../src/state";

const MD = getDemoMetadata();

describe("Events", function() {
    beforeEach(function() {
        Game.reset();
    });

    it("The `on` function does not alter the inner event function", function() {
        const greet = on("GREET", game => {
            game.output.write("Hello, world!");
        });

        Game.init(MD);

        const myGame = buildGameInstance();
        greet(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: getUntrackedEventPK().plus(1),
                name: "GREET",
                output: [getInitialOutputPK()]
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([
            {
                id: getInitialOutputPK(),
                type: OutputLineType.NORMAL,
                data: "Hello, world!"
            }
        ]);
    });

    it("Partial application and name templating with `on`", function() {
        const greet = (name: string) =>
            on(`GREET <${name}>`, game => {
                game.output.write(`Hello, ${name}!`);
            });

        Game.init(MD);

        const myGame = buildGameInstance();
        greet("Regal")(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: getUntrackedEventPK().plus(1),
                name: "GREET <Regal>",
                output: [getInitialOutputPK()]
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([
            {
                id: getInitialOutputPK(),
                type: OutputLineType.NORMAL,
                data: "Hello, Regal!"
            }
        ]);
    });

    it("Returning another EventFunction from inside another executes it", function() {
        const morning = on("MORNING", game => {
            game.output.write("Have a great day!");
        });

        const afternoon = on("AFTERNOON", game => {
            game.output.write("Keep it up!");
        });

        const motivate = (date: Date) =>
            on("MOTIVATE", game => {
                return date.getHours() < 12 ? morning : afternoon;
            });

        Game.init(MD);

        const myGame = buildGameInstance();
        const myDate = new Date("August 5, 2018 10:15:00");

        motivate(myDate)(myGame);

        const [_epk0, epk1, epk2] = ePKs(2);

        expect(myGame.events.history).to.deep.equal([
            {
                id: epk2,
                causedBy: epk1,
                name: "MORNING",
                output: [getInitialOutputPK()]
            },
            {
                id: epk1,
                caused: [epk2],
                name: "MOTIVATE"
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([
            {
                id: getInitialOutputPK(),
                type: OutputLineType.NORMAL,
                data: "Have a great day!"
            }
        ]);
    });

    it("noop returns undefined", function() {
        Game.init(MD);
        expect(noop(buildGameInstance())).to.be.undefined;
    });

    it("Returning noop from an EventFunction is the same as returning nothing", function() {
        Game.init(MD);

        const withNoop = on("FUNC", game => {
            game.output.write("Test");
            game.state.foo = [true, new Agent()];
            return noop;
        });

        const withoutNoop = on("FUNC", game => {
            game.output.write("Test");
            game.state.foo = [true, new Agent()];
        });

        expect(withNoop(buildGameInstance())).to.deep.equal(
            withoutNoop(buildGameInstance())
        );
    });

    it("Compile Check: `on` can be paramterized with a custom state", function() {
        interface Custom {
            count: number;
            arr: string[];
        }

        // Ensure these compile
        on<Custom>("ADD", game => {
            game.state.count++;
            game.state.arr.unshift("foo");
        });
    });

    it("Declaring a parameterized `on` with the GameEventHandler type", function() {
        interface Custom {
            count: number;
            arr: string[];
        }

        const fn: GameEventBuilder<Custom> = on;

        const init = fn("INIT", game => {
            game.state.count = 0;
            game.state.arr = [];
        });

        const add = (arg: string) =>
            fn("ADD", game => {
                game.state.count++;
                game.state.arr.unshift(arg);
            });

        Game.init(MD);

        const myGame = buildGameInstance();
        init.then(add("foo"))(myGame);

        expect(myGame.state.count).to.equal(1);
        expect(myGame.state.arr).to.deep.equal(["foo"]);
    });

    it("Passing another TrackedEvent as the second argument to `on` does not infinite loop", function() {
        const inner = on("inner", game => {
            game.output.write("Reached inner");
        });

        const outer = on("outer", inner);

        Game.init(MD);

        const myGame = buildGameInstance();
        outer(myGame);

        expect(myGame.output.lines.map(line => line.data)).to.deep.equal([
            "Reached inner"
        ]);
    });

    it("Passing an EventQueue as the second argument to `on` does not infinite loop", function() {
        const inner = (num: number) =>
            on("inner", game => {
                game.output.write("Reached inner" + num);
            });

        const outer = on("outer", inner(1).then(inner(2)));

        Game.init(MD);

        const myGame = buildGameInstance();
        outer(myGame);

        expect(myGame.output.lines.map(line => line.data)).to.deep.equal([
            "Reached inner1",
            "Reached inner2"
        ]);
    });

    describe("Queueing", function() {
        it("Executing a singleton EventQueue immediately with `then`", function() {
            const learnSkill = (name: string, skill: string) =>
                on(`LEARN SKILL <${skill}>`, game => {
                    game.output.write(`${name} learned ${skill}!`);
                });

            const addItemToInventory = (name: string, item: string) =>
                on(`ADD ITEM <${item}>`, game => {
                    game.output.write(`Added ${item} to ${name}'s inventory.`);
                });

            const makeSword = (name: string) =>
                on("MAKE SWORD", game => {
                    game.output.write(`${name} made a sword!`);
                    return learnSkill(name, "Blacksmithing").then(
                        addItemToInventory(name, "Sword")
                    );
                });

            Game.init(MD);

            const myGame = buildGameInstance();
            const [opk0, opk1, opk2] = oPKs(2);
            const [_epk0, epk1, epk2, epk3] = ePKs(3);

            makeSword("King Arthur")(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk3,
                    causedBy: epk1,
                    name: "ADD ITEM <Sword>",
                    output: [opk2]
                },
                {
                    id: epk2,
                    causedBy: epk1,
                    name: "LEARN SKILL <Blacksmithing>",
                    output: [opk1]
                },
                {
                    id: epk1,
                    name: "MAKE SWORD",
                    output: [opk0],
                    caused: [epk2, epk3]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.NORMAL,
                    data: "King Arthur made a sword!"
                },
                {
                    id: opk1,
                    type: OutputLineType.NORMAL,
                    data: "King Arthur learned Blacksmithing!"
                },
                {
                    id: opk2,
                    type: OutputLineType.NORMAL,
                    data: "Added Sword to King Arthur's inventory."
                }
            ]);
        });

        it("Chaining n-ary immediate EventQueues with `then`", function() {
            const foo = (name: string) => on(`FOO <${name}>`, game => {});
            const complex = on("COMPLEX", game => {
                return foo("ONE")
                    .then(foo("TWO"), foo("THREE"))
                    .then(foo("FOUR"));
            });

            Game.init(MD);

            const myGame = buildGameInstance();
            complex(myGame);

            const [_epk0, epk1, epk2, epk3, epk4, epk5] = ePKs(5);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk5,
                    causedBy: epk1,
                    name: "FOO <FOUR>"
                },
                {
                    id: epk4,
                    causedBy: epk1,
                    name: "FOO <THREE>"
                },
                {
                    id: epk3,
                    causedBy: epk1,
                    name: "FOO <TWO>"
                },
                {
                    id: epk2,
                    causedBy: epk1,
                    name: "FOO <ONE>"
                },
                {
                    id: epk1,
                    name: "COMPLEX",
                    caused: [epk2, epk3, epk4, epk5]
                }
            ]);
        });

        it("Delayed execution with enqueue", function() {
            const hitGround = (item: string) =>
                on(`HIT GROUND <${item}>`, game => {
                    game.output.write(`${item} hits the ground. Thud!`);
                });

            const fall = (item: string) =>
                on(`FALL <${item}>`, game => {
                    game.output.write(`${item} falls.`);
                    return enqueue(hitGround(item));
                });

            const drop = (items: string[]) =>
                on("DROP ITEMS", game => {
                    let queue = enqueue();
                    items.forEach(item => {
                        queue = queue.nq(fall(item));
                    });
                    return queue;
                });

            Game.init(MD);

            const myGame = buildGameInstance();
            const [opk0, opk1, opk2, opk3, opk4, opk5] = oPKs(5);
            const [_epk0, epk1, epk2, epk3, epk4, epk5, epk6, epk7] = ePKs(7);
            const items = ["Hat", "Duck", "Spoon"];

            drop(items)(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk7,
                    causedBy: epk4,
                    name: "HIT GROUND <Spoon>",
                    output: [opk5]
                },
                {
                    id: epk6,
                    causedBy: epk3,
                    name: "HIT GROUND <Duck>",
                    output: [opk4]
                },
                {
                    id: epk5,
                    causedBy: epk2,
                    name: "HIT GROUND <Hat>",
                    output: [opk3]
                },
                {
                    id: epk4,
                    causedBy: epk1,
                    name: "FALL <Spoon>",
                    output: [opk2],
                    caused: [epk7]
                },
                {
                    id: epk3,
                    causedBy: epk1,
                    name: "FALL <Duck>",
                    output: [opk1],
                    caused: [epk6]
                },
                {
                    id: epk2,
                    causedBy: epk1,
                    name: "FALL <Hat>",
                    output: [opk0],
                    caused: [epk5]
                },
                {
                    id: epk1,
                    name: "DROP ITEMS",
                    caused: [epk2, epk3, epk4]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.NORMAL,
                    data: "Hat falls."
                },
                {
                    id: opk1,
                    type: OutputLineType.NORMAL,
                    data: "Duck falls."
                },
                {
                    id: opk2,
                    type: OutputLineType.NORMAL,
                    data: "Spoon falls."
                },
                {
                    id: opk3,
                    type: OutputLineType.NORMAL,
                    data: "Hat hits the ground. Thud!"
                },
                {
                    id: opk4,
                    type: OutputLineType.NORMAL,
                    data: "Duck hits the ground. Thud!"
                },
                {
                    id: opk5,
                    type: OutputLineType.NORMAL,
                    data: "Spoon hits the ground. Thud!"
                }
            ]);
        });

        it("Invoking an EventQueue works just like any other EventFunction", function() {
            const spam = on("SPAM", game => {
                game.output.write("Get spammed.");
            });

            Game.init(MD);

            const myGame = buildGameInstance();
            const [opk0, opk1] = oPKs(1);

            spam.then(spam)(myGame);

            expect(myGame.output.lines).to.deep.equal([
                { data: "Get spammed.", id: opk0, type: OutputLineType.NORMAL },
                { data: "Get spammed.", id: opk1, type: OutputLineType.NORMAL }
            ]);
        });

        it("TrackedEvent.then returns an EventQueue", function() {
            Game.init(MD);
            const eq = on("FOO", on("BAZ", () => {})).then(on("BAR", () => {}));
            expect(isEventQueue(eq)).to.be.true;
        });

        describe("QTests", function() {
            // Start utility functions

            const buildExpectedOutput = (
                events: string[],
                causes: string[]
            ) => {
                if (events.length != causes.length) {
                    throw new Error("Args must be the same length.");
                }

                let id = getUntrackedEventPK();

                const eventRecords = events.map(name => {
                    id = id.plus(1);
                    return {
                        id,
                        name
                    } as Partial<EventRecord>;
                });

                causes.forEach((causeName, idx) => {
                    if (causeName === undefined) {
                        return;
                    }

                    const causeIdx = eventRecords.findIndex(
                        event => event.name === causeName
                    );

                    if (causeIdx < 0) {
                        throw new Error("Cause not found.");
                    }

                    const causeRecord = eventRecords[causeIdx];
                    const effectRecord = eventRecords[idx];

                    effectRecord.causedBy = causeRecord.id;

                    if (causeRecord.caused === undefined) {
                        causeRecord.caused = [];
                    }

                    causeRecord.caused.push(effectRecord.id);
                });

                return eventRecords.reverse();
            };

            const f = (n: number) => on(`f${n}`, game => noop);

            const QueueTest = (
                q: () => TrackedEvent,
                immediate: string[],
                delayed: string[]
            ) =>
                it(`QTest: ${q.toString().split("=> ")[1]} -> ${immediate.join(
                    ", "
                )} | ${delayed.join(", ")}`, function() {
                    // Test basic queue execution
                    const init = on("INIT", game => q());

                    Game.init(MD);

                    let myGame = buildGameInstance();
                    init(myGame);

                    let expectedEventNames = ["INIT"].concat(
                        immediate,
                        delayed
                    );
                    let expectedEventCauses = [undefined].concat(
                        Array(expectedEventNames.length - 1).fill("INIT")
                    );
                    let expectedOutput = buildExpectedOutput(
                        expectedEventNames,
                        expectedEventCauses
                    );

                    expect(myGame.events.history).deep.equal(expectedOutput);

                    // Assert that the generated queue has the correct events in the immediate and deferred event collections.
                    const toEventNames = (event: TrackedEvent) =>
                        event.eventName;
                    const queue = q();

                    if (isEventQueue(queue)) {
                        expect(
                            queue.immediateEvents.map(toEventNames)
                        ).to.deep.equal(immediate);
                        expect(
                            queue.delayedEvents.map(toEventNames)
                        ).to.deep.equal(delayed);
                    } else {
                        expect(immediate.length).to.equal(1);
                        expect(delayed.length).to.equal(0);
                    }
                });

            const QueueTestError = (
                q: () => TrackedEvent,
                error: Function | Error,
                message: string
            ) =>
                it(`QTest: ${q.toString().split("=> ")[1]} -> ${
                    error.name
                }: ${message}`, function() {
                    expect(q).to.throw(RegalError, message);
                });

            // End utility functions

            /* * Queue Tests * */

            // * 1. return f1;
            // *      f1 | .
            QueueTest(() => f(1), ["f1"], []);

            // * 2. return f1.then(f2);
            // *      f1 f2 | .
            QueueTest(() => f(1).then(f(2)), ["f1", "f2"], []);

            // * 3. return f1.then(f2, f3, f4);
            // *      f1 f2 f3 f4 | .
            QueueTest(
                () => f(1).then(f(2), f(3), f(4)),
                ["f1", "f2", "f3", "f4"],
                []
            );

            // * 4. return f1.then(f2.then(f3), f4);
            // *      f1 f2 f3 f4 | .
            QueueTest(
                () => f(1).then(f(2).then(f(3)), f(4)),
                ["f1", "f2", "f3", "f4"],
                []
            );

            // * 5. return f1.then(f2, f3).then(f4);
            // *      f1 f2 f3 f4 | .
            QueueTest(
                () =>
                    f(1)
                        .then(f(2), f(3))
                        .then(f(4)),
                ["f1", "f2", "f3", "f4"],
                []
            );

            // * 6. return f1.then(f2.then(f3), f4.then(f5, f6).then(f7)).then(f8, f9);
            // *      f1 f2 f3 f4 f5 f6 f7 f8 f9 | .
            QueueTest(
                () =>
                    f(1)
                        .then(
                            f(2).then(f(3)),
                            f(4)
                                .then(f(5), f(6))
                                .then(f(7))
                        )
                        .then(f(8), f(9)),
                ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9"],
                []
            );

            // * 7. return nq(f1);
            // *      . | f1
            QueueTest(() => nq(f(1)), [], ["f1"]);

            // * 8. return nq(f1, f2, f3);
            // *      . | f1 f2 f3
            QueueTest(() => nq(f(1), f(2), f(3)), [], ["f1", "f2", "f3"]);

            // * 9. return nq(f1.then(f2), f3);
            // *      . | f1 f2 f3
            QueueTest(() => nq(f(1).then(f(2)), f(3)), [], ["f1", "f2", "f3"]);

            // * 10. return nq(f1, f2).nq(f3);
            // *      . | f1 f2 f3
            QueueTest(() => nq(f(1), f(2)).nq(f(3)), [], ["f1", "f2", "f3"]);

            // * 11. return nq(f1, f2).then(f3);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(
                () => nq(f(1), f(2)).then(f(3)),
                RegalError,
                "Any enqueue instruction must happen at the end of the return statement."
            );

            // * 12. return f1.then(f2, f3).thenq(f4, f5)
            // *      f1 f2 f3 | f4 f5
            QueueTest(
                () =>
                    f(1)
                        .then(f(2), f(3))
                        .thenq(f(4), f(5)),
                ["f1", "f2", "f3"],
                ["f4", "f5"]
            );

            // * 13. return f1.then(nq(f2, f3));
            // *      f1 | f2 f3
            QueueTest(() => f(1).then(nq(f(2), f(3))), ["f1"], ["f2", "f3"]);

            // * 14. return f1.thenq(f2, f3);
            // *      f1 | f2 f3
            QueueTest(() => f(1).thenq(f(2), f(3)), ["f1"], ["f2", "f3"]);

            // * 15. return f1.then(nq(f2, f3)).then(f4);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(
                () =>
                    f(1)
                        .then(nq(f(2), f(3)))
                        .then(f(4)),
                RegalError,
                "Any enqueue instruction must happen at the end of the return statement."
            );

            // * 16. return f1.thenq(f2, f3).then(f4);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(
                () =>
                    f(1)
                        .thenq(f(2), f(3))
                        .then(f(4)),
                RegalError,
                "Any enqueue instruction must happen at the end of the return statement."
            );

            // * 17. return f1.thenq(f2, f3).thenq(f4, f5);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(
                () =>
                    f(1)
                        .thenq(f(2), f(3))
                        .then(f(4), f(5)),
                RegalError,
                "Any enqueue instruction must happen at the end of the return statement."
            );

            // * 18. return f1.thenq(f2.then(f3, f4), f5);
            // *      f1 | f2 f3 f4 f5
            QueueTest(
                () => f(1).thenq(f(2).then(f(3), f(4)), f(5)),
                ["f1"],
                ["f2", "f3", "f4", "f5"]
            );

            // * 19. return f1.thenq(nq(f2, f3));
            // *      f1 | f2 f3
            QueueTest(() => f(1).thenq(nq(f(2), f(3))), ["f1"], ["f2", "f3"]);

            // * 20. return f1.thenq(f2.thenq(f3, f4));
            // *      f1 | f2 f3 f4
            QueueTest(
                () => f(1).thenq(f(2).thenq(f(3), f(4))),
                ["f1"],
                ["f2", "f3", "f4"]
            );

            // * 21. return f1.thenq(f2.then(f3, f4).then(nq(f5)), f6.thenq(f7, f8));
            // *      f1 | f2 f3 f4 f6 f5 f7 f8
            QueueTest(
                () =>
                    f(1).thenq(
                        f(2)
                            .then(f(3), f(4))
                            .then(nq(f(5))),
                        f(6).thenq(f(7), f(8))
                    ),
                ["f1"],
                ["f2", "f3", "f4", "f6", "f5", "f7", "f8"]
            );

            // * 22. return f1.then(f2, f3, nq(f4, f5));
            // *      f1 f2 f3 | f4 f5
            QueueTest(
                () => f(1).then(f(2), f(3), nq(f(4), f(5))),
                ["f1", "f2", "f3"],
                ["f4", "f5"]
            );

            // * 23. return f1.thenq(f2, nq(f3, f4), f5);
            // *      f1 | f2 f5 f3 f4
            QueueTest(
                () => f(1).thenq(f(2), nq(f(3), f(4)), f(5)),
                ["f1"],
                ["f2", "f5", "f3", "f4"]
            );

            // * 24. return f1.then(f2, nq(f3, f4), f5);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(
                () => f(1).then(f(2), nq(f(3), f(4)), f(5)),
                RegalError,
                "Any enqueue instruction must happen at the end of the return statement."
            );
        });
    });

    describe("Agent Change Tracking", function() {
        it("Agent changes are tracked in GameInstance.events.history", function() {
            StaticAgentRegistry.reset();

            const heal = (target: Dummy, amount: number) =>
                on("HEAL", game => {
                    target.health += amount;
                    game.output.write(
                        `Healed ${target.name} by ${amount}. Health is now ${
                            target.health
                        }.`
                    );
                });

            Game.init(MD);

            const myGame = buildGameInstance({ trackAgentChanges: true });
            const dummy = myGame.using(new Dummy("Lars", 10));

            heal(dummy, 15)(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: getUntrackedEventPK().plus(1),
                    name: "HEAL",
                    output: [getInitialOutputPK()],
                    changes: [
                        {
                            agentId: getGameInstancePK().plus(1),
                            op: PropertyOperation.MODIFIED,
                            init: 10,
                            final: 25,
                            property: "health"
                        }
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: getInitialOutputPK(),
                    type: OutputLineType.NORMAL,
                    data: "Healed Lars by 15. Health is now 25."
                }
            ]);
        });

        it("Complicated agent changes are tracked in GameInstance.events.history", function() {
            const changeFriendsHealth = (target: Dummy, amount: number) =>
                on(`CHANGE <${target["friend"].name}> HEALTH`, game => {
                    target["friend"].health += amount;
                });

            const readStatus = on("READ STATUS", game => {
                let agent: Dummy = game.state.mainAgent;
                do {
                    game.output.write(
                        `${agent.name}'s health is ${agent.health}.`
                    );
                    agent = agent["friend"];
                } while (agent);
            });

            const addFriend = (target: Dummy, _friend: Dummy) =>
                on("ADD FRIEND", game => {
                    const friend = game.using(_friend);

                    target["friend"] = friend;

                    game.output.write(
                        `${target.name} has a new friend! (${friend.name})`
                    );
                    return changeFriendsHealth(target, 11);
                });

            const start = on("START", game => {
                const lars = new Dummy("Lars", 10);
                const bill = new Dummy("Bill", 25);

                game.state.mainAgent = lars;

                return addFriend(game.state.mainAgent, bill).thenq(readStatus);
            });

            Game.init(MD);

            const myGame = buildGameInstance({ trackAgentChanges: true });
            start(myGame);

            const [apk0, apk1, apk2] = aPKs(2);
            const [opk0, opk1, opk2] = oPKs(2);
            const [_epk0, epk1, epk2, epk3, epk4] = ePKs(4);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk3,
                    name: "READ STATUS",
                    causedBy: epk1,
                    output: [opk1, opk2]
                },
                {
                    id: epk4,
                    name: "CHANGE <Bill> HEALTH",
                    causedBy: epk2,
                    changes: [
                        {
                            agentId: apk2,
                            op: PropertyOperation.MODIFIED,
                            property: "health",
                            init: 25,
                            final: 36
                        }
                    ]
                },
                {
                    id: epk2,
                    name: "ADD FRIEND",
                    output: [opk0],
                    causedBy: epk1,
                    caused: [epk4],
                    changes: [
                        {
                            agentId: apk2,
                            op: PropertyOperation.ADDED,
                            property: "name",
                            init: undefined,
                            final: "Bill"
                        },
                        {
                            agentId: apk2,
                            op: PropertyOperation.ADDED,
                            property: "health",
                            init: undefined,
                            final: 25
                        },
                        {
                            agentId: apk1,
                            op: PropertyOperation.ADDED,
                            property: "friend",
                            init: undefined,
                            final: {
                                refId: apk2
                            }
                        }
                    ]
                },
                {
                    id: epk1,
                    name: "START",
                    caused: [epk2, epk3],
                    changes: [
                        {
                            agentId: apk1,
                            op: PropertyOperation.ADDED,
                            property: "name",
                            init: undefined,
                            final: "Lars"
                        },
                        {
                            agentId: apk1,
                            op: PropertyOperation.ADDED,
                            property: "health",
                            init: undefined,
                            final: 10
                        },
                        {
                            agentId: apk0,
                            op: PropertyOperation.ADDED,
                            property: "mainAgent",
                            init: undefined,
                            final: {
                                refId: apk1
                            }
                        }
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.NORMAL,
                    data: "Lars has a new friend! (Bill)"
                },
                {
                    id: opk1,
                    type: OutputLineType.NORMAL,
                    data: "Lars's health is 10."
                },
                {
                    id: opk2,
                    type: OutputLineType.NORMAL,
                    data: "Bill's health is 36."
                }
            ]);
        });
    });

    describe("Other InstanceEvents Behavior", function() {
        it("InstanceEvents.recycle breaks the connection between EventRecord PK providers", function() {
            const spam = on("SPAM", game => {
                game.output.write("Get spammed.");
            });

            Game.init(MD);

            const baseGame = buildGameInstance();
            spam(baseGame);

            const newGame = baseGame.recycle();

            spam(baseGame);
            spam(newGame);

            const basePKs = baseGame.events.history.map(
                eventRecord => eventRecord.id
            );

            expect(basePKs[0].minus(1).equals(basePKs[1])).to.be.true;
            expect(basePKs[0].equals(newGame.events.history[0].id)).to.be.true;
        });
    });
});
