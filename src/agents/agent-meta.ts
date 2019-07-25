import { PK } from "../common";
import { Agent } from "./agent";

// tslint:disable-next-line: no-empty-interface
export interface AgentProto {}

export interface AgentMeta {
    /** The agent's unique identifier in the context of the current game. */
    id: PK<Agent>;
    protoId: PK<AgentProto>;
}

export enum ReservedAgentProperty {
    META = "meta",
    GAME = "game",
    TEMP_VALUES = "tempValues"
}
