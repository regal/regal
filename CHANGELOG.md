# Regal Changelog

## v2.0.0 - "Dakota" (2019-11-11)

**BREAKING CHANGES**
* Fix Agents' ability to have methods by building a prototype registry, including changes to the way indexed classes are managed ([#104](https://github.com/regal/regal/pull/104)), ([#82](https://github.com/regal/regal/pull/82)), ([#119](https://github.com/regal/regal/pull/119))

**Features**
* Metadata property for gameVersion ([#97](https://github.com/regal/regal/pull/97))

**Bug Fixes**
* Fix infinite loop when an event queue is created ([#83](https://github.com/regal/regal/pull/83))

**Documentation**
* Update API reference to reflect prototype registry changes ([#105](https://github.com/regal/regal/pull/105))
* Update documentation to use Regal CLI ([#101](https://github.com/regal/regal/pull/101))

## v1.0.0 - "Beacon" (2019-02-01)

*First Stable Release* :tada:

**Documentation**
* Add comprehensive project documentation ([#98](https://github.com/regal/regal/pull/98)), resolves [#19](https://github.com/regal/regal/issues/19)
* Add `CONTRIBUTING.md` ([ee051ee](https://github.com/regal/regal/pull/98/commits/ee051ee5e092b1a5487ed1556f874a5db5427e61))
* Remove year from copyright notices ([4d5c301](https://github.com/regal/regal/pull/98/commits/4d5c301c056fbe783d68be20fa6f8be7c2ac3e1e))


## Pre-Initial Release

### v0.7.1 (2018-12-15)

**Bug Fixes**
* **api:** Resolve circular import issue with HookManager ([96c9de4](https://github.com/regal/regal/commit/96c9de449cd3aa5c4df0b7f51eda376253fee28e))

### v0.7.0 (2018-12-15)

**Bug Fixes**
* **api:** Split Game into `GameApi` and `GameApiExtended` interfaces, which are implemented by an object ([#93](https://github.com/regal/regal/issues/93)), fixes [#92](https://github.com/regal/regal/issues/92)

**Features**
* **config:** Make `GameMetadata` more robust ([#84](https://github.com/regal/regal/issues/84)), closes [#70](https://github.com/regal/regal/issues/70)
* **config:** Make `GameMetadata.options` optional, defaults to `{}` in `MetadataManager.setMetadata` ([#91](https://github.com/regal/regal/issues/91)), closes [#90](https://github.com/regal/regal/issues/90)

**Code Refactors**
* **api:** Move api-hooks.ts from api to api/impl ([#93](https://github.com/regal/regal/issues/93))

### v0.6.1

* Fix output location of declaration files ([#81](https://github.com/regal/regal/pull/81))

### v0.6.0

* Abstract `GameInstance` and `InstanceX` interfaces into public and internal interfaces ([#72](https://github.com/regal/regal/pull/72))
* Add optional type parameter for `GameInstance.state` to instance interfaces and event types and functions ([#79](https://github.com/regal/regal/pull/79))

**Config**
* Decouple `load-config` and its dependencies from the game library ([#73](https://github.com/regal/regal/pull/73))
* Add `libraryVersion` metadata property ([#74](https://github.com/regal/regal/pull/74))

**Random**
* Fix `InstanceRandom` bug where reverting the instance wouldn't rollback the random value stream ([#78](https://github.com/regal/regal/pull/78))

**Build**
* Improve distribution file structure ([#67](https://github.com/regal/regal/pull/67))

### v0.5.0

* Refactor the library structure

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
