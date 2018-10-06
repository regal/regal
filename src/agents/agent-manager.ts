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
        const changes: PropertyChange[] = this[property];
        return changes !== undefined && changes.length > 0;
    }

    public getProperty(property: PropertyKey): any {
        const changes: PropertyChange[] = this[property];
        let value: any;

        if (changes !== undefined && changes.length > 0) {
            value = changes[0].final;
        }

        return value;
    }

    public getPropertyHistory(property: PropertyKey): PropertyChange[] {
        return this.hasPropertyRecord(property) ? this[property] : [];
    }

    public propertyWasDeleted(property: PropertyKey): boolean {
        const changes: PropertyChange[] = this[property];

        return (
            changes &&
            changes.length > 0 &&
            changes[0].op === PropertyOperation.DELETED
        );
    }

    public setProperty(property: PropertyKey, value: any): void {
        let initValue;
        let opType: PropertyOperation;
        let changes: PropertyChange[] = this[property];

        if (!changes) {
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
                changes = [];
                this[property] = changes;
            }
        } else {
            initValue = changes[0].final;

            opType = this.propertyWasDeleted(property)
                ? PropertyOperation.ADDED
                : PropertyOperation.MODIFIED;
        }

        if (initValue === value) {
            return;
        }

        const event = this.game.events.current;
        event.trackChange(this.id, property, opType, initValue, value);

        changes.unshift({
            eventId: event.id,
            eventName: event.name,
            final: value,
            init: initValue,
            op: opType
        });
    }

    public deleteProperty(property: PropertyKey): void {
        if (
            this.propertyWasDeleted(property) ||
            (!this.hasPropertyRecord(property) &&
                !StaticAgentRegistry.hasAgentProperty(this.id, property))
        ) {
            return;
        }

        let initValue;
        let changes: PropertyChange[] = this[property];

        if (!changes) {
            if (StaticAgentRegistry.hasAgentProperty(this.id, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    this.id,
                    property
                );
            }

            changes = [];
            this[property] = changes;
        } else {
            initValue = changes[0].final;
        }

        const event = this.game.events.current;
        event.trackChange(
            this.id,
            property,
            PropertyOperation.DELETED,
            initValue,
            undefined
        );

        changes.unshift({
            eventId: event.id,
            eventName: event.name,
            final: undefined,
            init: initValue,
            op: PropertyOperation.DELETED
        });
    }
}
