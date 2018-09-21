import { expect } from "chai";
import "mocha";

import { resolve } from "path";
import { readConfigFile, loadConfig } from "../../src/load-config";
import { MetadataManager } from "../../src/config";
import { RegalError } from "../../src/error";
import { expectedPromiseFailure } from "../test-utils";

const dummyConfigPath = (end: any) =>
    resolve(`./test/resources/dummy-config-${end}`);

describe("Load Config Utility", function() {
    it("Constructing a metadata object from a valid regal.json", function() {
        return readConfigFile(dummyConfigPath(1)).then(metadata => {
            expect(metadata).to.deep.equal({
                name: "My Awesome Game",
                author: "Joe Cowman",
                headline: "Play my awesome game",
                description: "This is the description of my awesome game.",
                homepage: "https://github.com/regal/about",
                repository: "https://github.com/regal/regal",
                options: {
                    allowOverrides: ["debug"],
                    showMinor: false
                }
            });
        });
    });

    it("Loading metadata into the game from a valid regal.json", function() {
        return loadConfig(dummyConfigPath(1)).then(() =>
            expect(MetadataManager.getMetadata()).to.deep.equal({
                name: "My Awesome Game",
                author: "Joe Cowman",
                headline: "Play my awesome game",
                description: "This is the description of my awesome game.",
                homepage: "https://github.com/regal/about",
                repository: "https://github.com/regal/regal",
                options: {
                    allowOverrides: ["debug"],
                    showMinor: false
                }
            })
        );
    });

    it("Constructing a metadata object from a valid package.json", function() {
        return readConfigFile(dummyConfigPath(2)).then(metadata => {
            expect(metadata).to.deep.equal({
                name: "Test game 2",
                author: "Bob Developer",
                headline: "Test game 2 headline",
                description: "Test game 2 description.",
                homepage: "Test game homepage 2",
                repository: "Test game repo 2",
                options: {
                    debug: true,
                    allowOverrides: false
                }
            });
        });
    });

    it("Loading metadata into the game from a valid package.json", function() {
        return loadConfig(dummyConfigPath(2)).then(() =>
            expect(MetadataManager.getMetadata()).to.deep.equal({
                name: "Test game 2",
                author: "Bob Developer",
                headline: "Test game 2 headline",
                description: "Test game 2 description.",
                homepage: "Test game homepage 2",
                repository: "Test game repo 2",
                options: {
                    debug: true,
                    allowOverrides: false
                }
            })
        );
    });

    it("Throw an error if no name is configured", function() {
        return readConfigFile(dummyConfigPath(3)).then(
            expectedPromiseFailure,
            (err: RegalError) => {
                expect(err.message).to.equal(
                    "RegalError: The project's name must be defined."
                );
            }
        );
    });

    it("If no options are configured, set an empty object", function() {
        return readConfigFile(dummyConfigPath(4)).then(metadata =>
            expect(metadata).to.deep.equal({
                name: "Fake Game 4",
                author: "Bob Diggity",
                options: {}
            })
        );
    });

    it("Throw an error if no metadata can be found", function() {
        return readConfigFile(dummyConfigPath("foo")).then(
            expectedPromiseFailure,
            (err: RegalError) => {
                expect(err.message).to.equal(
                    "RegalError: No metadata could be found for the game."
                );
            }
        );
    });

    it("Wrap any internal errors caused by cosmiconfig", function() {
        return readConfigFile(<any>{ foo: "breakthis" }).then(
            expectedPromiseFailure,
            (err: RegalError) => {
                expect(err.message).to.equal(
                    "RegalError: An error occurred while attempting to read the config file: <Error: expected filepath to be a string>."
                );
            }
        );
    });

    it("Wrap errors caused by readConfigFile in loadConfig", function() {
        return loadConfig(dummyConfigPath(3)).then(
            expectedPromiseFailure,
            (err: RegalError) => {
                expect(err.message).to.equal(
                    "RegalError: An error occurred while attempting to load the config file: <Error: RegalError: The project's name must be defined.>."
                );
            }
        );
    });
});
