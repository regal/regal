// File for testing ideas

class GameInstance {
    public using<T>(resources: T) {
        return resources;
    }
}

type EventFunction = (game: GameInstance) => EventFunction;

const on: (name: string, eventFunc: EventFunction) => EventFunction = (
    name,
    eventFunc
) => {
    return (game: GameInstance) => eventFunc;
};

/** */

enum MoveDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

interface MoveableAgent {
    canMove: boolean;
}

const staticFoo = {};

const move = (dir: MoveDirection, _target: MoveableAgent) =>
    on("MOVE", game => {
        const target = game.using(_target);
        return undefined;
    });
