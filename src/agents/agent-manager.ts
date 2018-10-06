import GameInstance from "../game-instance";
import { PropertyChange, PropertyOperation } from "./agent-properties";
import { StaticAgentRegistry } from "./static-agent-registry";

export interface AgentManager {
    id: number;
    game: GameInstance;
    hasPropertyRecord(property: PropertyKey): boolean;
    getProperty(property: PropertyKey): any;
    getPropertyHistory(property: PropertyKey): PropertyChange[];
    propertyWasDeleted(property: PropertyKey): boolean;
    setProperty(property: PropertyKey, value: any): void;
    deleteProperty(property: PropertyKey): void;
}

export const isAgentManager = (o: any): o is AgentManager => {
    return (
        o !== undefined && (o as AgentManager).hasPropertyRecord !== undefined
    );
};

export const buildAgentManager = (
    id: number,
    game: GameInstance
): AgentManager => new AgentManagerImpl(id, game);

class AgentManagerImpl implements AgentManager {
    constructor(public id: number, public game: GameInstance) {}

    public hasPropertyRecord(property: PropertyKey): boolean {
        const history: PropertyChange[] = this[property];
        return history !== undefined && history.length !== undefined;
    }

    public getProperty(property: PropertyKey): any {
        const history = this.getPropertyHistory(property);
        let value: any;

        if (history.length > 0) {
            value = history[0].final;
        }

        return value;
    }

    public getPropertyHistory(property: PropertyKey): PropertyChange[] {
        return this.hasPropertyRecord(property) ? this[property] : [];
    }

    public propertyWasDeleted(property: PropertyKey): boolean {
        const history = this.getPropertyHistory(property);

        return (
            history.length > 0 && history[0].op === PropertyOperation.DELETED
        );
    }

    public setProperty(property: PropertyKey, value: any): void {
        let initValue;
        let opType: PropertyOperation;

        const history = this.getPropertyHistory(property);

        if (history.length === 0) {
            if (StaticAgentRegistry.hasAgentProperty(this.id, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    this.id,
                    property
                );
                opType = PropertyOperation.MODIFIED;
            } else {
                opType = PropertyOperation.ADDED;
            }

            if (initValue !== value) {
                this[property] = history;
            }
        } else {
            initValue = history[0].final;

            opType = this.propertyWasDeleted(property)
                ? PropertyOperation.ADDED
                : PropertyOperation.MODIFIED;
        }

        if (initValue === value) {
            return;
        }

        const event = this.game.events.current;
        event.trackChange(this.id, property, opType, initValue, value);

        history.unshift({
            eventId: event.id,
            eventName: event.name,
            final: value,
            init: initValue,
            op: opType
        });
    }

    public deleteProperty(property: PropertyKey): void {
        if (this.propertyWasDeleted(property)) {
            return;
        }

        let initValue;
        const history = this.getPropertyHistory(property);

        if (history.length === 0) {
            if (StaticAgentRegistry.hasAgentProperty(this.id, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    this.id,
                    property
                );
            } else {
                return;
            }

            this[property] = history;
        } else {
            initValue = history[0].final;
        }

        const event = this.game.events.current;
        event.trackChange(
            this.id,
            property,
            PropertyOperation.DELETED,
            initValue,
            undefined
        );

        history.unshift({
            eventId: event.id,
            eventName: event.name,
            final: undefined,
            init: initValue,
            op: PropertyOperation.DELETED
        });
    }
}
