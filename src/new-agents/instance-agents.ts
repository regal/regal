import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { AgentManager, isAgentManager } from "./agent-manager";
import { getNextStaticAgentId } from "./todo";

export interface InstanceAgents {
    game: GameInstance;
    reserveNewId(): number;
    getAgentProperty(id: number, property: PropertyKey): any;
    setAgentProperty(id: number, property: PropertyKey, value: any): boolean;
    hasAgentProperty(id: number, property: PropertyKey): boolean;
    deleteAgentProperty(id: number, property: PropertyKey): boolean;
}

class InstanceAgentsObjectImpl implements InstanceAgents {
    constructor(public game: GameInstance) {}

    public reserveNewId(): number {
        const id = getNextStaticAgentId() + 1;
        this[id] = new AgentManager();
        return id;
    }

    public getAgentProperty(id: number, property: PropertyKey) {
        const am = this._getAgentManager(id);

        if (!isAgentManager(am)) {
            throw new RegalError(
                `No agent with the id <${id}> exists in the game instance.`
            );
        }
    }

    public setAgentProperty(
        id: number,
        property: PropertyKey,
        value: any
    ): boolean {
        throw new Error("Method not implemented.");
    }

    public hasAgentProperty(id: number, property: PropertyKey): boolean {
        throw new Error("Method not implemented.");
    }

    public deleteAgentProperty(id: number, property: PropertyKey): boolean {
        throw new Error("Method not implemented.");
    }

    private _getAgentManager(id: number): AgentManager {
        const result = this[id];

        if (isAgentManager(result)) {
            return result;
        }

        return undefined;
    }
}
