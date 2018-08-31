import GameInstance from "../game-instance";
import { Agent } from "./agent-model";

export class InstanceState extends Agent {
    constructor(game: GameInstance) {
        super();
        return this.register(game, 0);
    }
}
