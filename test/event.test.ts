import { expect } from 'chai';
import 'mocha';

import { GameInstance, RegalError } from '../src/game';
import { on, noop } from '../src/event';
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

    it("Immediate execution with `then`", function() {
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

});