# Agent Spec (OUTDATED)

To reduce the amount of duplicate data stored in the state of each GameInstance, Regal offers "prefabs." Prefabs are pre-defined objects that can be referenced to by GameInstances. By using prefabs, a game developer can generate game data without having to store it in the instance state. All Agent classes and subclasses can be converted to prefabs.

## Requirements
1. All agent state must be kept within the scope of the GameInstance and its EventFunction chain. Thus, there shall be no side effects to any objects in the global scope.
2. Changes to agent state are tracked within the GameInstance, along with the EventFunction in which they occurred, recorded as a series of commands that can be reversed.
3. The GameInstance state shall contain only the properties of agents that have changed from their original values. For example: if there is a complex Agent prefab with many properties, but only one of such properties is changed by the GameInstance, then only that property with its new value shall be stored in the GameInstance's state.
4. A reference to an Agent within an EventFunction shall first check the GameInstance's state for a modified property value before referring to the prefab. If a modified property exists, it shall be used instead of the prefab's property. This calculation shall be entirely hidden from the user.


## Code Example: Prefabs

### Agent class
```ts
class Agent {
    get [prefabId]() : number { /* ... */ } // Unique prefab Id
    get [instanceId]() : number { /* ... */ } // Instance uid. GameInstance-specific.
    prefab() : this { /* ... */ }
    register(game: GameInstance) : this { /* ... */ }
}
```

### Example user-defined Agent subclass
```ts
class Dummy extends Agent {
    constructor(public name: string, public description: string, public health: number) {}
}
```

### Creating a Prefab is simple instantiation
```ts
const lars = new Dummy('Lars', 'The coolest man.', 50).prefab(); // Type is still Dummy
```

### Attempting to set a Prefab's properties directly causes an error
```ts
lars.description = 'The average man.'; // throws RegalError
lars.health += 5; // throws RegalError
```

### However, EventFunctions can be written using the Prefab as regular objects
```ts
const heal = (target: Dummy, amount: number) => 
    event("HEAL", game => {
        target.health += amount;
        game.output.write(`Healed ${target.name} by ${amount}, Health is now ${target.health}.`);
        return game;
});
```

### Register a Prefab with the GameInstance in order to use it
```ts
const start = () =>
    event("START", game => {
        const myLars = lars.register(game); // Type is still Dummy. myLars now has an instance id
        return heal(myLars, 10) (game);
});

const game = new GameInstance();
start() (game);
game === {
    events: [ 
        { 
            name: "HEAL",
            changes: [
                {
                    target: 1, // Instance uid
                    property: "health",
                    action: "changed"
                    startValue: 50,
                    endValue: 60
                }
            ] 
        } 
    ],
    output: [ "Healed Lars by 10. Health is now 60." ],
    state: {
        1 : { // Instance id
            prefabId: 1, // Prefab id
            health: 60
        }
    }
}
```