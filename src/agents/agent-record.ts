import { EventRecord } from "../events";
import { StaticAgentRegistry } from "./static-agent";

export enum PropertyOperation {
    ADDED = "ADDED",
    MODIFIED = "MODIFIED",
    DELETED = "DELETED"
}

export interface PropertyChange {
    eventId?: number;
    eventName?: string;
    agentId?: number;
    op: PropertyOperation;
    init?: any;
    final?: any;
    property?: string;
}

export class AgentRecord {
    public getProperty(propertyKey: PropertyKey): any {
        const changes: PropertyChange[] = this[propertyKey];
        let property: any;

        if (changes !== undefined && changes.length > 0) {
            property = changes[0].final;
        }

        return property;
    }

    public setProperty<T>(
        event: EventRecord,
        agentId: number,
        property: PropertyKey,
        value: T
    ): void {
        let initValue = this.getProperty(property);

        if (
            initValue === undefined &&
            StaticAgentRegistry.hasAgentProperty(agentId, property)
        ) {
            initValue = StaticAgentRegistry.getAgentProperty(agentId, property);
        }

        const op =
            initValue === undefined
                ? PropertyOperation.ADDED
                : PropertyOperation.MODIFIED;

        this._addRecord(event, property, op, initValue, value);
        event.trackChange(agentId, property, op, initValue, value);
    }

    public deleteProperty(
        event: EventRecord,
        agentId: number,
        property: PropertyKey
    ): boolean {
        let initValue = this.getProperty(property);

        if (!this.hasOwnProperty(property)) {
            if (StaticAgentRegistry.hasAgentProperty(agentId, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    agentId,
                    property
                );
            } else {
                return false;
            }
        }

        this._addRecord(event, property, PropertyOperation.DELETED, initValue);
        event.trackChange(
            agentId,
            property,
            PropertyOperation.DELETED,
            initValue
        );

        return true;
    }

    public propertyWasDeleted(propertyKey: PropertyKey): boolean {
        if (this.hasOwnProperty(propertyKey)) {
            const lastChange: PropertyChange = this[propertyKey][0];

            if (lastChange.op === PropertyOperation.DELETED) {
                return true;
            }
        }

        return false;
    }

    private _addRecord<T>(
        event: EventRecord,
        property: PropertyKey,
        op: PropertyOperation,
        init?: T,
        final?: T
    ): void {
        if (!(property in this)) {
            this[property] = new Array<PropertyChange>();
        }

        const change: PropertyChange = {
            eventId: event.id,
            eventName: event.name,
            final,
            init,
            op
        };

        (this[property] as PropertyChange[]).unshift(change);
    }
}
