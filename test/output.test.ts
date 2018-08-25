import { expect } from 'chai';
import 'mocha';

import GameInstance from '../src/game-instance';
import { OutputLineType } from '../src/output';

describe("Output", function() {

    describe("Instance Output", function() {

        it("InstanceOutput.writeLine writes a normal line by default", function() {
            const myGame = new GameInstance();

            myGame.output.writeLine("Hello, world!");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "Hello, world!"
                }
            ]);
        });

        it("InstanceOutput.writeLine accepts an optional OutputLineType", function() {
            const myGame = new GameInstance();

            myGame.output.writeLine("Hello, world!", OutputLineType.DEBUG);

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.DEBUG,
                    data: "Hello, world!"
                }
            ]);
        });

        it("InstanceOutput.write writes NORMAL lines", function() {
            const myGame = new GameInstance();

            myGame.output.write("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "Line 1"
                },
                {
                    id: 2,
                    type: OutputLineType.NORMAL,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeNormal writes NORMAL lines", function() {
            const myGame = new GameInstance();

            myGame.output.writeNormal("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.NORMAL,
                    data: "Line 1"
                },
                {
                    id: 2,
                    type: OutputLineType.NORMAL,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeMajor writes MAJOR lines", function() {
            const myGame = new GameInstance();

            myGame.output.writeMajor("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.MAJOR,
                    data: "Line 1"
                },
                {
                    id: 2,
                    type: OutputLineType.MAJOR,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeMinor writes MINOR lines", function() {
            const myGame = new GameInstance();

            myGame.output.writeMinor("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.MINOR,
                    data: "Line 1"
                },
                {
                    id: 2,
                    type: OutputLineType.MINOR,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeDebug writes DEBUG lines", function() {
            const myGame = new GameInstance();

            myGame.output.writeDebug("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.DEBUG,
                    data: "Line 1"
                },
                {
                    id: 2,
                    type: OutputLineType.DEBUG,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeTitle write a SECTION_TITLE line", function() {
            const myGame = new GameInstance();

            myGame.output.writeTitle("Title");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.SECTION_TITLE,
                    data: "Title"
                }
            ]);
        });

        it("Multiple line types with InstanceOutput", function() {
            const myGame = new GameInstance();

            myGame.output.writeDebug("Room loaded.");
            myGame.output.writeTitle("West of House");
            myGame.output.write("You are west of a house.", "There are things here.");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: 1,
                    type: OutputLineType.DEBUG,
                    data: "Room loaded."
                },
                {
                    id: 2,
                    type: OutputLineType.SECTION_TITLE,
                    data: "West of House"
                },
                {
                    id: 3,
                    type: OutputLineType.NORMAL,
                    data: "You are west of a house."
                },
                {
                    id: 4,
                    type: OutputLineType.NORMAL,
                    data: "There are things here."
                }
            ]);
        });

    });
});