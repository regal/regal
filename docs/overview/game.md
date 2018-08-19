# Game

The Regal `Game` object is the API through which games are played. 

In a sense, any operation on a Regal game can be thought of as a pure function. A request (consisting of the player's command and the game state) is sent to the Game API, and a response (consisting of the game's output and the updated game state) is returned. The game's source is never modified.

Regal was structured like this so that a client's only responsibilties are:

* Accepting user input
* Reporting game output
* Storing the game state (although awareness of the data's structure isn't needed)
* Calling the Regal API

The idea is that a Regal game is deterministic; i.e. it will always return the same output when given the same input. This makes debugging easier and means that no user-specific game data ever needs to be stored on the game servers -- in fact, a Regal game can be serverless! All one needs is a client that can store data and call the Regal API. Multiple clients playing multiple games can call the same API, and they won't interfere with each other.