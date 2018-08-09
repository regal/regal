import { expect } from 'chai';
import 'mocha';

import { GameInstance, RegalError } from '../src/game';
import { on, noop, EventRecord, TrackedEvent } from '../src/event';
import { log } from '../src/utils';

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
                    "Hello, world!"
                ],
            }
        ]);
        expect(myGame.output.lines).to.deep.equal(["Hello, world!"]);
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
                    "Hello, Regal!"
                ],
            }
        ]);
        expect(myGame.output.lines).to.deep.equal(["Hello, Regal!"]);
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
                    "Have a great day!"
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
    });

    /* Queueing Tests
     * 1. return f1;
     *      f1 | .
     * 2. return f1.then(f2);
     *      f1 f2 | .
     * 3. return f1.then(f2, f3, f4);
     *      f1 f2 f3 f4 | .
     * 4. return f1.then(f2.then(f3), f4);
     *      f1 f2 f3 f4 | .
     * 5. return f1.then(f2, f3).then(f4);
     *      f1 f2 f3 f4 | .
     * 6. return f1.then(f2.then(f3), f4.then(f5, f6).then(f7)).then(f8, f9);
     *      f1 f2 f3 f4 f5 f6 f7 f8 f9 | .
     * 7. return nq(f1);
     *      . | f1
     * 8. return nq(f1, f2, f3);
     *      . | f1 f2 f3
     * 9. return nq(f1.then(f2), f3);
     *      . | f1 f2 f3
     * 10. return nq(f1, f2).nq(f3);
     *      . | f1 f2 f3
     * 11. return nq(f1, f2).then(f3);
     *      RegalError: Any enqueue instruction must happen at the end of the return statement.
     * 12. return f1.nq(f2, f3);
     *      TypeError: `nq` does not exist on `f1`.
     * 13. return f1.then(nq(f2, f3));
     *      f1 | f2 f3
     * 14. return f1.thenq(f2, f3);
     *      f1 | f2 f3
     * 15. return f1.then(nq(f2, f3)).then(f4);
     *      RegalError: Any enqueue instruction must happen at the end of the return statement.
     * 16. return f1.thenq(f2, f3).then(f4);
     *      RegalError: Any enqueue instruction must happen at the end of the return statement.
     * 17. return f1.thenq(f2.then(f3, f4), f5);
     *      f1 | f2 f3 f4 f5
     * 18. return f1.thenq(f2, f3).thenq(f4, f5);
     *      f1 | f2 f3 f4 f5
     * 19. return f1.thenq(nq(f2, f3));
     *      f1 | f2 f3
     * 20. return f1.thenq(f2.thenq(f3, f4));
     *      f1 | f2 f3 f4
     * 21. return f1.thenq(f2.then(f3, f4).then(nq(f5)), f6.thenq(f7, f8));
     *      f1 | f2 f3 f4 f5 f6 f7 f8
     * 22. return f1.then(f2, f3, nq(f4, f5));
     *      f1 f2 f3 | f4 f5
     * 23. return f1.then(f2, nq(f3, f4), f5);
     *      RegalError: Any enqueue instruction must happen at the end of the return statement.
     * 24. return f1.thenq(f2, nq(f3, f4), f5);
     *      f1 | f2 f3 f4 f5
    **/

    describe("Queuing", function() {

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
                        "Added Sword to King Arthur's inventory."
                    ]
                },
                {
                    id: 2,
                    causedBy: 1,
                    name: "LEARN SKILL <Blacksmithing>",
                    output: [
                        "King Arthur learned Blacksmithing!"
                    ]
                },
                {
                    id: 1,
                    name: "MAKE SWORD",
                    output: [
                        "King Arthur made a sword!"
                    ],
                    caused: [
                        2, 3
                    ]
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

        // Start utility functions

        const buildExpectedOutput = (cause: string, effects: string[]) => {
            const causeRecord: Partial<EventRecord> = {
                id: 1,
                name: cause,
                caused: []
            };

            let id = 1;

            const effectRecords = effects.map(name => {
                id++;
                causeRecord.caused.push(id);
                return {
                    id,
                    name,
                    causedBy: 1
                } as Partial<EventRecord>;
            });

            effectRecords.unshift(causeRecord);

            return effectRecords.reverse();
        }

        const f = (n: number) => on(`f${n}`, game => noop);

        const QueueTest = (q: () => TrackedEvent, expected: string[]) => 
            it(`QTest: ${q.toString().split("=> ")[1]} -> ${expected.join(', ')}`, function() {
                const init = on("INIT", game => {
                    return q();
                });
    
                const myGame = new GameInstance();
                init(myGame);

                expect(myGame.events.history).to.deep.equal(
                    buildExpectedOutput("INIT", expected)
                );
            });

        // End utility functions

        QueueTest(() => f(1), ["f1"]);

    });

});