# Regal Changelog

## Pre-Initial Release

### v0.5.0

* Refactors the library structure

**Random**
* Adds the Random component (through `InstanceRandom`)

**Config**
* Adds `seed` config option for controlling the Random component

### v0.4.1

* Update dependencies

### v0.4.0

**Agents**
* Significantly refactored Agent component
    * Replaced `Agent.static()` with context-aware instantiation (see [#49](https://github.com/regal/regal/pull/49))
    * Replaced `Agent.register()` with `GameInstance.using()` (see [#49](https://github.com/regal/regal/pull/49) and [#50](https://github.com/regal/regal/pull/50))
* Made full event sourcing optional (see [#51](https://github.com/regal/regal/pull/51))
* Agent Arrays (see [#55](https://github.com/regal/regal/pull/55))
* All inaccessible data is scrubbed from `InstanceAgents` before each player command (see [#56](https://github.com/regal/regal/pull/56))

**Config**
* Added `trackAgentChanges` game option to control event sourcing (see [#51](https://github.com/regal/regal/pull/51))

**Events**
* Remove required return from `EventFunction`, eliminating so much need for `noop` (see [#57](https://github.com/regal/regal/pull/57))
* `EventQueue`s can now be invoked like any other `EventFunction` (see [#58](https://github.com/regal/regal/pull/58))

### v0.3.0

**First Testable Release**

* Added the following components:
    * Agents
    * Game Configuration
    * Events
    * API Hooks
    * Error
    * Game API
    * GameInstance
    * LoadConfig Script
    * Output

### v0.2.1

* Restructured declaration files
* Added null-checking to `Event.runQueue`
* Updated metadata

### v0.1.0

* Initial Version
