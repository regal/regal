import * as Api from "../../src/api";
import * as Fight from "./fight";

Fight.init(); // An init function like this won't actually be needed.
let response = Api.play({ type: Api.RequestType.START });

console.log(response);