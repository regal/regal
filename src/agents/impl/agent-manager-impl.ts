import { RegalError } from "../../error";
import { DEFAULT_EVENT_ID, EventRecord } from "../../events";
import GameInstance from "../../game-instance";
import { AgentManager } from "../agent-manager";
import {
    pcForAgentManager,
    pcForEventRecord,
    PropertyChange,
    PropertyOperation
} from "../agent-properties";
import { isAgentReference } from "../agent-reference";
import { StaticAgentRegistry } from "../static-agent-registry";

/** Builds an implementation of `AgentManager` for the given `Agent` id and `GameInstance`. */
export const buildAgentManager = (
    id: number,
    game: GameInstance
): AgentManager => new AgentManagerImpl(id, game);

/** Implementation of `AgentManager`. */
class AgentManagerImpl implements AgentManager {
    constructor(public id: number, public game: GameInstance) {}

    public hasPropertyRecord(property: PropertyKey): boolean {
        if (property === "constructor") {
            return false;
        }

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

        // If values are equal, don't record anything.
        if (
            initValue === value ||
            (isAgentReference(initValue) &&
                isAgentReference(value) &&
                initValue.refId === value.refId)
        ) {
            return;
        }

        const event = this.game.events.current;

        const propChange: PropertyChange = {
            agentId: this.id,
            eventId: event.id,
            eventName: event.name,
            final: value,
            init: initValue,
            op: opType,
            property: property.toString()
        };

        this.recordChange(event, propChange, history);
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

        const propChange: PropertyChange = {
            agentId: this.id,
            eventId: event.id,
            eventName: event.name,
            final: undefined,
            init: initValue,
            op: PropertyOperation.DELETED,
            property: property.toString()
        };

        this.recordChange(event, propChange, history);
    }

    /**
     * Internal helper method to record a change in the `AgentManager`'s property
     * history and the `EventRecord` appropriately, depending on the value of the
     * `trackAgentChanges` game option.
     *
     * @param event The `EventRecord` in which the change is tracked.
     * @param propChange The `PropertyChange` to record.
     * @param history The property history to modify.
     */
    private recordChange(
        event: EventRecord,
        propChange: PropertyChange,
        history: PropertyChange[]
    ): void {
        const trackAgentChanges = this.game.options.trackAgentChanges;

        // If trackAgentChanges is enabled, record it in the event record and the agent manager.
        if (trackAgentChanges) {
            event.trackChange(pcForEventRecord(propChange));
            history.unshift(pcForAgentManager(propChange));
        } else {
            if (history.length > 2) {
                throw new RegalError(
                    "Property history length cannot be greater than two when trackAgentChanges is disabled."
                );
            }

            // A change should be replaced if it happened during the same event,
            // or if the change happened after any potential recycling
            const shouldReplaceSingle = (pc: PropertyChange) =>
                pc.eventId === event.id || pc.eventId > DEFAULT_EVENT_ID;

            // If the property history has two changes, update the more recent one.
            // If property history has only change, check when the change happened.
            if (
                history.length === 2 ||
                (history.length === 1 && shouldReplaceSingle(history[0]))
            ) {
                history[0] = pcForAgentManager(propChange);
            } else {
                // If the change happened after the game cycle began, replace it with the new change.
                history.unshift(pcForAgentManager(propChange));
            }
        }
    }
}
