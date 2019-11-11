import { expect } from "chai";
import "mocha";

import { OutputLineType, buildInstanceOutput } from "../../src/output";
import { getDemoMetadata, oPKs, getInitialOutputPK, log } from "../test-utils";
import { Game } from "../../src/api";
import { buildGameInstance } from "../../src/state";

describe("Output", function() {
    beforeEach(function() {
        Game.reset();
        Game.init(getDemoMetadata());
    });

    describe("Instance Output", function() {
        it("InstanceOutput.writeLine writes a normal line by default", function() {
            const myGame = buildGameInstance();

            myGame.output.writeLine("Hello, world!");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: getInitialOutputPK(),
                    type: OutputLineType.NORMAL,
                    data: "Hello, world!"
                }
            ]);
        });

        it("InstanceOutput.writeLine accepts an optional OutputLineType", function() {
            const myGame = buildGameInstance({ debug: true });

            myGame.output.writeLine("Hello, world!", OutputLineType.DEBUG);

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: getInitialOutputPK(),
                    type: OutputLineType.DEBUG,
                    data: "Hello, world!"
                }
            ]);
        });

        it("InstanceOutput.write writes NORMAL lines", function() {
            const myGame = buildGameInstance();
            const [opk0, opk1] = oPKs(1);

            myGame.output.write("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.NORMAL,
                    data: "Line 1"
                },
                {
                    id: opk1,
                    type: OutputLineType.NORMAL,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeNormal writes NORMAL lines", function() {
            const myGame = buildGameInstance();
            const [opk0, opk1] = oPKs(1);

            myGame.output.writeNormal("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.NORMAL,
                    data: "Line 1"
                },
                {
                    id: opk1,
                    type: OutputLineType.NORMAL,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeMajor writes MAJOR lines", function() {
            const myGame = buildGameInstance();
            const [opk0, opk1] = oPKs(1);

            myGame.output.writeMajor("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.MAJOR,
                    data: "Line 1"
                },
                {
                    id: opk1,
                    type: OutputLineType.MAJOR,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeMinor writes MINOR lines", function() {
            const myGame = buildGameInstance();
            const [opk0, opk1] = oPKs(1);

            myGame.output.writeMinor("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.MINOR,
                    data: "Line 1"
                },
                {
                    id: opk1,
                    type: OutputLineType.MINOR,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeDebug writes DEBUG lines", function() {
            const myGame = buildGameInstance({ debug: true });
            const [opk0, opk1] = oPKs(1);

            myGame.output.writeDebug("Line 1", "Line 2");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: opk0,
                    type: OutputLineType.DEBUG,
                    data: "Line 1"
                },
                {
                    id: opk1,
                    type: OutputLineType.DEBUG,
                    data: "Line 2"
                }
            ]);
        });

        it("InstanceOutput.writeTitle write a SECTION_TITLE line", function() {
            const myGame = buildGameInstance();

            myGame.output.writeTitle("Title");

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: getInitialOutputPK(),
                    type: OutputLineType.SECTION_TITLE,
                    data: "Title"
                }
            ]);
        });

        it("Multiple line types with InstanceOutput", function() {
            const myGame = buildGameInstance({ debug: true });

            myGame.output.writeDebug("Room loaded.");
            myGame.output.writeTitle("West of House");
            myGame.output.write(
                "You are west of a house.",
                "There are things here."
            );

            const [pk0, pk1, pk2, pk3] = oPKs(3);

            expect(myGame.output.lines).to.deep.equal([
                {
                    id: pk0,
                    type: OutputLineType.DEBUG,
                    data: "Room loaded."
                },
                {
                    id: pk1,
                    type: OutputLineType.SECTION_TITLE,
                    data: "West of House"
                },
                {
                    id: pk2,
                    type: OutputLineType.NORMAL,
                    data: "You are west of a house."
                },
                {
                    id: pk3,
                    type: OutputLineType.NORMAL,
                    data: "There are things here."
                }
            ]);
        });

        it("InstanceOutput.lineCount is equal to the number of lines generated", function() {
            const myGame = buildGameInstance();

            expect(myGame.output.lineCount).to.equal(0);

            myGame.output.write("Foo");

            expect(myGame.output.lineCount).to.equal(1);
        });

        it("InstanceOutput.recycle creates a new InstanceOutput with the previous instance's lineCount", function() {
            const game1 = buildGameInstance();

            const game2 = buildGameInstance();
            const output2 = game1.output.recycle(game2);

            expect(output2.lineCount).to.equal(0);
            expect(output2.game).to.equal(game2);
            expect(output2.lines).to.be.empty;

            output2.write("Foo", "Bar", "Baz");

            const game3 = buildGameInstance();
            const output3 = output2.recycle(game3);

            expect(output3.lineCount).to.equal(3);
            expect(output3.game).to.equal(game3);
            expect(output3.lines).to.be.empty;
        });

        it("InstanceOutput.recycle breaks the connection between OutputLine PK providers", function() {
            const baseGame = buildGameInstance();
            baseGame.output.write("Base");

            const newGame = baseGame.recycle();

            baseGame.output.write("2-Base");
            newGame.output.write("2-New");

            const basePKs = baseGame.output.lines.map(
                outputLine => outputLine.id
            );

            expect(basePKs[0].plus(1).equals(basePKs[1])).to.be.true;
            expect(basePKs[1].equals(newGame.output.lines[0].id)).to.be.true;
        });
    });
});
