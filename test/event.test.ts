import { expect } from 'chai';
import 'mocha';

import GameInstance from '../src/game-instance';
import { RegalError } from '../src/error';
import { on, noop, EventRecord, TrackedEvent, nq, isEventQueue, enqueue, InstanceEvents } from '../src/event';
import { log } from '../src/utils';
import { Agent, PropertyOperation, resetRegistry } from '../src/agent';
import { OutputLineType } from '../src/output';

describe("Event", function() {

    it("The `on` function does not alter the inner event function", function() {
        const greet = on("GREET", game => {
            game.output.write("Hello, world!");
            return noop;
        });

        const myGame = new GameInstance();
        greet(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: 1,
                name: "GREET",
                output: [
                    1
                ],
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([{
            id: 1,
            type: OutputLineType.NORMAL,
            data: "Hello, world!"
        }]);
    });

    it("Partial application and name templating with `on`", function() {
        const greet = (name: string) =>
            on(`GREET <${name}>`, game => {
                game.output.write(`Hello, ${name}!`);
                return noop;
            });

        const myGame = new GameInstance();
        greet("Regal")(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: 1,
                name: "GREET <Regal>",
                output: [
                    1
                ],
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([{
            id: 1,
            type: OutputLineType.NORMAL,
            data: "Hello, Regal!"
        }]);
    });

    it("Returning another EventFunction from inside another executes it", function() {
        const morning = on("MORNING", game => {
            game.output.write("Have a great day!");
            return noop;
        });

        const afternoon = on("AFTERNOON", game => {
            game.output.write("Keep it up!");
            return noop;
        });

        const motivate = (date: Date) =>
            on("MOTIVATE", game => {
                return (date.getHours() < 12) ? morning : afternoon;
            });

        const myGame = new GameInstance();
        const myDate = new Date("August 5, 2018 10:15:00");

        motivate(myDate)(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: 2,
                causedBy: 1,
                name: "MORNING",
                output: [
                    1
                ]
            },
            {
                id: 1,
                caused: [
                    2
                ],
                name: "MOTIVATE"
            }
        ]);
        expect(myGame.output.lines).to.deep.equal([{
            id: 1,
            type: OutputLineType.NORMAL,
            data: "Have a great day!"
        }]);
    });

    it("noop returns undefined", function() {
        expect(noop(new GameInstance())).to.be.undefined;
    });

    describe("Queueing", function() {

        it("Executing a singleton EventQueue immediately with `then`", function() {
            const learnSkill = (name: string, skill: string) =>
                on(`LEARN SKILL <${skill}>`, game => {
                    game.output.write(`${name} learned ${skill}!`);
                    return noop;
                });
    
            const addItemToInventory = (name: string, item: string) =>
                on(`ADD ITEM <${item}>`, game => {
                    game.output.write(`Added ${item} to ${name}'s inventory.`);
                    return noop;
                });
    
            const makeSword = (name: string) =>
                on("MAKE SWORD", game => {
                    game.output.write(`${name} made a sword!`);
                    return learnSkill(name, "Blacksmithing")
                        .then(addItemToInventory(name, "Sword"));
                });
    
            const myGame = new GameInstance();
    
            makeSword("King Arthur")(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 3,
                    causedBy: 1,
                    name: "ADD ITEM <Sword>",
                    output: [
                        3
                    ]
                },
                {
                    id: 2,
                    causedBy: 1,
                    name: "LEARN SKILL <Blacksmithing>",
                    output: [
                        2
                    ]
                },
                {
                    id: 1,
                    name: "MAKE SWORD",
                    output: [
                        1
                    ],
                    caused: [
                        2, 3
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "King Arthur made a sword!"
                },
                {
                    id: 2,
                    type: OutputLineType.NORMAL,
                    data: "King Arthur learned Blacksmithing!"
                },
                {
                    id: 3,
                    type: OutputLineType.NORMAL,
                    data: "Added Sword to King Arthur's inventory."
                }
            ]);
        });

        it("Chaining n-ary immediate EventQueues with `then`", function() {
            const foo = (name: string) => on(`FOO <${name}>`, game => {
                return noop;
            });
            const complex = on("COMPLEX", game => {
                return foo("ONE")
                    .then(foo("TWO"), foo("THREE"))
                    .then(foo("FOUR"));
            });
    
            const myGame = new GameInstance();
            complex(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 5,
                    causedBy: 1,
                    name: "FOO <FOUR>",
                },
                {
                    id: 4,
                    causedBy: 1,
                    name: "FOO <THREE>",
                },
                {
                    id: 3,
                    causedBy: 1,
                    name: "FOO <TWO>",
                },
                {
                    id: 2,
                    causedBy: 1,
                    name: "FOO <ONE>",
                },
                {
                    id: 1,
                    name: "COMPLEX",
                    caused: [
                        2, 3, 4, 5
                    ]
                }
            ]);
        });

        it("Delayed execution with enqueue", function() {
            const hitGround = (item: string) =>
                on(`HIT GROUND <${item}>`, game => {
                    game.output.write(`${item} hits the ground. Thud!`);
                    return noop;
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

            const myGame = new GameInstance();
            const items = ["Hat", "Duck", "Spoon"];

            drop(items)(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: 7,
                    causedBy: 4,
                    name: "HIT GROUND <Spoon>",
                    output: [
                        6
                    ]
                },
                {
                    id: 6,
                    causedBy: 3,
                    name: "HIT GROUND <Duck>",
                    output: [
                        5
                    ]
                },
                {
                    id: 5,
                    causedBy: 2,
                    name: "HIT GROUND <Hat>",
                    output: [
                        4
                    ]
                },
                {
                    id: 4,
                    causedBy: 1,
                    name: "FALL <Spoon>",
                    output: [
                        3
                    ],
                    caused: [
                        7
                    ]
                },
                {
                    id: 3,
                    causedBy: 1,
                    name: "FALL <Duck>",
                    output: [
                        2
                    ],
                    caused: [
                        6
                    ]
                },
                {
                    id: 2,
                    causedBy: 1,
                    name: "FALL <Hat>",
                    output: [
                        1
                    ],
                    caused: [
                        5
                    ]
                },
                {
                    id: 1,
                    name: "DROP ITEMS",
                    caused: [
                        2, 3, 4
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "Hat falls."
                },
                {
                    id: 2,
                    type: OutputLineType.NORMAL,
                    data: "Duck falls."
                },
                {
                    id: 3,
                    type: OutputLineType.NORMAL,
                    data: "Spoon falls."
                },
                {
                    id: 4,
                    type: OutputLineType.NORMAL,
                    data: "Hat hits the ground. Thud!"
                },
                {
                    id: 5,
                    type: OutputLineType.NORMAL,
                    data: "Duck hits the ground. Thud!"
                },
                {
                    id: 6,
                    type: OutputLineType.NORMAL,
                    data: "Spoon hits the ground. Thud!"
                }
            ]);
        });

        it("Attempting to invoke an EventQueue throws an error", function() {
            const nonevent = on("FOO", game => noop);
            const queue = nq(nonevent, nonevent);
            expect(() => queue(new GameInstance())).to.throw(RegalError, "Cannot invoke an EventQueue.");
        });

        describe("QTests", function() {

            // Start utility functions

            const buildExpectedOutput = (events: string[], causes: string[]) => {
                if (events.length != causes.length) {
                    throw new Error("Args must be the same length.");
                }

                let id = 0;

                const eventRecords = events.map(name => {
                    return {
                        id: ++id,
                        name
                    } as Partial<EventRecord>;
                });

                causes.forEach((causeName, idx) => {
                    if (causeName === undefined) {
                        return;
                    }

                    const causeIdx = eventRecords.findIndex(event => event.name === causeName);

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
            }

            const f = (n: number) => on(`f${n}`, game => noop);

            const QueueTest = (q: () => TrackedEvent, immediate: string[], delayed: string[]) => 
                it(`QTest: ${
                    q.toString().split("=> ")[1]
                } -> ${
                    immediate.join(', ')
                } | ${
                    delayed.join(', ')
                }`, 
                function() {
                    // Test basic queue execution
                    const init = on("INIT", game => q());
        
                    let myGame = new GameInstance();
                    init(myGame);

                    let expectedEventNames = ["INIT"].concat(immediate, delayed);
                    let expectedEventCauses = [undefined].concat(Array(expectedEventNames.length - 1).fill("INIT"));
                    let expectedOutput = buildExpectedOutput(expectedEventNames, expectedEventCauses);

                    expect(myGame.events.history).deep.equal(expectedOutput);

                    // Assert that the generated queue has the correct events in the immediate and deferred event collections.
                    const toEventNames = (event: TrackedEvent) => event.eventName;
                    const queue = q();

                    if (isEventQueue(queue)) {
                        expect(queue.immediateEvents.map(toEventNames)).to.deep.equal(immediate);
                        expect(queue.delayedEvents.map(toEventNames)).to.deep.equal(delayed);
                    } else {
                        expect(immediate.length).to.equal(1);
                        expect(delayed.length).to.equal(0);
                    }
                });

            const QueueTestError = (q: () => TrackedEvent, error: Function | Error, message: string) =>
                it(`QTest: ${q.toString().split("=> ")[1]} -> ${error.name}: ${message}`, function() {
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
            QueueTest(() => f(1).then(f(2), f(3), f(4)), ["f1", "f2", "f3", "f4"], []);

            // * 4. return f1.then(f2.then(f3), f4);
            // *      f1 f2 f3 f4 | .
            QueueTest(() => f(1).then(f(2).then(f(3)), f(4)), ["f1", "f2", "f3", "f4"], []);
            
            // * 5. return f1.then(f2, f3).then(f4);
            // *      f1 f2 f3 f4 | .
            QueueTest(() => f(1).then(f(2), f(3)).then(f(4)), ["f1", "f2", "f3", "f4"], []);
            
            // * 6. return f1.then(f2.then(f3), f4.then(f5, f6).then(f7)).then(f8, f9);
            // *      f1 f2 f3 f4 f5 f6 f7 f8 f9 | .
            QueueTest(() => f(1).then(f(2).then(f(3)), f(4).then(f(5), f(6)).then(f(7))).then(f(8), f(9)), 
                ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9"], []);

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
            QueueTestError(() => nq(f(1), f(2)).then(f(3)), RegalError, "Any enqueue instruction must happen at the end of the return statement.");
    
            // * 12. return f1.then(f2, f3).thenq(f4, f5)
            // *      f1 f2 f3 | f4 f5
            QueueTest(() => f(1).then(f(2), f(3)).thenq(f(4), f(5)), ["f1", "f2", "f3"], ["f4", "f5"]);

            // * 13. return f1.then(nq(f2, f3));
            // *      f1 | f2 f3
            QueueTest(() => f(1).then(nq(f(2), f(3))), ["f1"], ["f2", "f3"]);

            // * 14. return f1.thenq(f2, f3);
            // *      f1 | f2 f3
            QueueTest(() => f(1).thenq(f(2), f(3)), ["f1"], ["f2", "f3"]);

            // * 15. return f1.then(nq(f2, f3)).then(f4);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(() => f(1).then(nq(f(2), f(3))).then(f(4)), RegalError, "Any enqueue instruction must happen at the end of the return statement.");
    
            // * 16. return f1.thenq(f2, f3).then(f4);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(() => f(1).thenq(f(2), f(3)).then(f(4)), RegalError, "Any enqueue instruction must happen at the end of the return statement.");

            // * 17. return f1.thenq(f2, f3).thenq(f4, f5);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.  
            QueueTestError(() => f(1).thenq(f(2), f(3)).then(f(4), f(5)), RegalError, "Any enqueue instruction must happen at the end of the return statement."); 

            // * 18. return f1.thenq(f2.then(f3, f4), f5);
            // *      f1 | f2 f3 f4 f5   
            QueueTest(() => f(1).thenq(f(2).then(f(3), f(4)), f(5)), ["f1"], ["f2", "f3", "f4", "f5"]);
            
            // * 19. return f1.thenq(nq(f2, f3));
            // *      f1 | f2 f3   
            QueueTest(() => f(1).thenq(nq(f(2), f(3))), ["f1"], ["f2", "f3"]);

            // * 20. return f1.thenq(f2.thenq(f3, f4));
            // *      f1 | f2 f3 f4   
            QueueTest(() => f(1).thenq(f(2).thenq(f(3), f(4))), ["f1"], ["f2", "f3", "f4"]);

            // * 21. return f1.thenq(f2.then(f3, f4).then(nq(f5)), f6.thenq(f7, f8));
            // *      f1 | f2 f3 f4 f6 f5 f7 f8   
            QueueTest(() => f(1).thenq(f(2).then(f(3), f(4)).then(nq(f(5))), f(6).thenq(f(7), f(8))),
                ["f1"], ["f2", "f3", "f4", "f6", "f5", "f7", "f8"]);

            // * 22. return f1.then(f2, f3, nq(f4, f5));
            // *      f1 f2 f3 | f4 f5       
            QueueTest(() => f(1).then(f(2), f(3), nq(f(4), f(5))), ["f1", "f2", "f3"], ["f4", "f5"]);
            
            // * 23. return f1.thenq(f2, nq(f3, f4), f5);
            // *      f1 | f2 f5 f3 f4 
            QueueTest(() => f(1).thenq(f(2), nq(f(3), f(4)), f(5)), ["f1"], ["f2", "f5", "f3", "f4"]);

            // * 24. return f1.then(f2, nq(f3, f4), f5);
            // *      RegalError: Any enqueue instruction must happen at the end of the return statement.
            QueueTestError(() => f(1).then(f(2), nq(f(3), f(4)), f(5)), RegalError, "Any enqueue instruction must happen at the end of the return statement.");
        });
   
    });

    describe("Agent Change Tracking", function() {
        it("Agent changes are tracked in GameInstance.events.history", function() {
            resetRegistry();
            
            const heal = (target: Dummy, amount: number) =>
                on("HEAL", game => {
                    target.health += amount;
                    game.output.write(`Healed ${target.name} by ${amount}. Health is now ${target.health}.`);
                    return noop;
                });
            
            const myGame = new GameInstance();
            const dummy = new Dummy("Lars", 10).register(myGame);
    
            heal(dummy, 15)(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 1,
                    name: "HEAL",
                    output: [
                        1
                    ],
                    changes: [
                        {
                            agentId: 1,
                            op: PropertyOperation.MODIFIED,
                            init: 10,
                            final: 25,
                            property: "health"
                        }
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([{
                id: 1,
                type: OutputLineType.NORMAL,
                data: "Healed Lars by 15. Health is now 25."
            }]);
        });
    
        it("Complicated agent changes are tracked in GameInstance.events.history", function() {
            const changeFriendsHealth = (target: Dummy, amount: number) =>
                on(`CHANGE <${target["friend"].name}> HEALTH`, game => {
                    target["friend"].health += amount;
                    return noop;
                });
    
            const readStatus = on("READ STATUS", game => {
                let agent: Dummy = game.state.mainAgent;
                do {
                    game.output.write(`${agent.name}'s health is ${agent.health}.`);
                    agent = agent["friend"];
                } while (agent);
    
                return noop;
            });
    
            const addFriend = (target: Dummy, friend: Dummy) =>
                on("ADD FRIEND", game => {
                    target["friend"] = friend;
    
                    game.output.write(`${target.name} has a new friend! (${friend.name})`);
                    return changeFriendsHealth(target, 11);
                });
    
            const start = on("START", game => {
                const lars = new Dummy("Lars", 10);
                const bill = new Dummy("Bill", 25);
                
                game.state.mainAgent = lars;
    
                return addFriend(lars, bill).thenq(readStatus);
            });
    
            const myGame = new GameInstance();
            start(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 3,
                    name: "READ STATUS",
                    causedBy: 1,
                    output: [
                        2,
                        3
                    ]
                },
                {
                    id: 4,
                    name: "CHANGE <Bill> HEALTH",
                    causedBy: 2,
                    changes: [
                        {
                            agentId: 2,
                            op: PropertyOperation.MODIFIED,
                            property: "health",
                            init: 25,
                            final: 36
                        }
                    ]
                },
                {
                    id: 2,
                    name: "ADD FRIEND",
                    output: [
                        1
                    ],
                    causedBy: 1,
                    caused: [
                        4
                    ],
                    changes: [
                        {
                            agentId: 2,
                            op: PropertyOperation.ADDED,
                            property: "_id",
                            init: undefined,
                            final: 2
                        },
                        {
                            agentId: 2,
                            op: PropertyOperation.ADDED,
                            property: "game",
                            init: undefined,
                            final: myGame
                        },
                        {
                            agentId: 2,
                            op: PropertyOperation.ADDED,
                            property: "name",
                            init: undefined,
                            final: "Bill"
                        },
                        {
                            agentId: 2,
                            op: PropertyOperation.ADDED,
                            property: "health",
                            init: undefined,
                            final: 25
                        },
                        {
                            agentId: 1,
                            op: PropertyOperation.ADDED,
                            property: "friend",
                            init: undefined,
                            final: {
                                refId: 2
                            }
                        }
                    ]
                },
                {
                    id: 1,
                    name: "START",
                    caused: [
                        2, 3
                    ],
                    changes: [
                        {
                            agentId: 1,
                            op: PropertyOperation.ADDED,
                            property: "_id",
                            init: undefined,
                            final: 1
                        },
                        {
                            agentId: 1,
                            op: PropertyOperation.ADDED,
                            property: "game",
                            init: undefined,
                            final: myGame
                        },
                        {
                            agentId: 1,
                            op: PropertyOperation.ADDED,
                            property: "name",
                            init: undefined,
                            final: "Lars"
                        },
                        {
                            agentId: 1,
                            op: PropertyOperation.ADDED,
                            property: "health",
                            init: undefined,
                            final: 10
                        },
                        {
                            agentId: 0,
                            op: PropertyOperation.ADDED,
                            property: "mainAgent",
                            init: undefined,
                            final: {
                                refId: 1
                            }
                        }
                    ]
                }
            ]);
            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "Lars has a new friend! (Bill)"
                },
                {
                    id: 2,
                    type: OutputLineType.NORMAL,
                    data: "Lars's health is 10."
                },
                {
                    id: 3,
                    type: OutputLineType.NORMAL,
                    data: "Bill's health is 36."
                }
            ]);
        });
    });

    describe("Other InstanceEvents Behavior", function() {

        it("InstanceEvents.lastEventId property getter works properly when startingEventId is not set", function() {
            const spam = on("SPAM", game => {
                game.output.write("Get spammed.");
                return noop;
            });

            const myGame = new GameInstance();

            expect(myGame.events.lastEventId).to.equal(0);

            myGame.events.invoke(spam.then(spam));

            expect(myGame.events.lastEventId).to.equal(2);
        });


        it("InstanceEvents.lastEventId property getter works properly when startingEventId is a custom value", function() {
            const spam = on("SPAM", game => {
                game.output.write("Get spammed.");
                return noop;
            });

            const myGame = new GameInstance();
            myGame.events = new InstanceEvents(myGame, 10);

            expect(myGame.events.lastEventId).to.equal(10);

            myGame.events.invoke(spam.then(spam, spam));

            expect(myGame.events.lastEventId).to.equal(13);
        });

        it("InstanceEvents.cycle creates a new InstanceEvents with the previous instance's lastEventId", function() {
            const spam = on("SPAM", game => {
                game.output.write("Get spammed.");
                return noop;
            });

            const game1 = new GameInstance();

            const game2 = new GameInstance();
            const events2 = game1.events.cycle(game2);

            expect(events2.lastEventId).to.equal(0);
            expect(events2.game).to.equal(game2);
            expect(events2.history).to.be.empty;

            events2.invoke(spam.then(spam).thenq(spam));

            const game3 = new GameInstance();
            const events3 = events2.cycle(game3);

            expect(events3.lastEventId).to.equal(3);
            expect(events3.game).to.equal(game3);
            expect(events3.history).to.be.empty;
        });
    });

});

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}