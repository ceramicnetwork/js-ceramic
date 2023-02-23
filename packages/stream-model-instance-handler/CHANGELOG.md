# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@1.2.0...@ceramicnetwork/stream-model-instance-handler@1.3.0-rc.0) (2023-02-23)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [1.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@1.2.0-rc.0...@ceramicnetwork/stream-model-instance-handler@1.2.0) (2023-02-22)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [1.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@1.1.0-rc.0...@ceramicnetwork/stream-model-instance-handler@1.2.0-rc.0) (2023-02-16)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [1.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.18.0...@ceramicnetwork/stream-model-instance-handler@1.1.0-rc.0) (2023-02-13)


### Features

* **stream-model,stream-model-handler:** model definition versioning ([#2660](https://github.com/ceramicnetwork/js-ceramic/issues/2660)) ([6ccbbdd](https://github.com/ceramicnetwork/js-ceramic/commit/6ccbbdd4d9e028394c14c2c1ac755236a6c80008))





# [0.18.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.18.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.18.0) (2023-01-23)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.18.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.18.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.18.0-rc.1) (2023-01-20)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.18.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.17.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.18.0-rc.0) (2023-01-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.17.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.16.0...@ceramicnetwork/stream-model-instance-handler@0.17.0-rc.0) (2023-01-11)


### Bug Fixes

* **stream-tile, stream-model-instance:** Enforce controller must be a string ([#2647](https://github.com/ceramicnetwork/js-ceramic/issues/2647)) ([7ad3e90](https://github.com/ceramicnetwork/js-ceramic/commit/7ad3e90ce0176abf19041bebdd67d90733ba2511))


### Features

* Add sep key to model stream types ([#2633](https://github.com/ceramicnetwork/js-ceramic/issues/2633)) ([36c6d5e](https://github.com/ceramicnetwork/js-ceramic/commit/36c6d5e9244cd73803ff34a512958a91242373eb))





# [0.16.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.16.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.16.0) (2023-01-05)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.16.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.15.1...@ceramicnetwork/stream-model-instance-handler@0.16.0-rc.0) (2022-12-29)


### Bug Fixes

* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([d40a19a](https://github.com/ceramicnetwork/js-ceramic/commit/d40a19acac88b45d6539d94b8039363e0c650b92))
* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([8c7f239](https://github.com/ceramicnetwork/js-ceramic/commit/8c7f2398136f799feac9a3ba875d23063793ee9b))
* **stream-tile-handler,stream-model-handler,stream-model-instance-handler:** Don't cache schemas ([#2267](https://github.com/ceramicnetwork/js-ceramic/issues/2267)) ([1744d84](https://github.com/ceramicnetwork/js-ceramic/commit/1744d849568ae8e630345677446374e39fc04055))
* Wrap AJV instances in LRU cache ([#2488](https://github.com/ceramicnetwork/js-ceramic/issues/2488)) ([3a6e31a](https://github.com/ceramicnetwork/js-ceramic/commit/3a6e31a58d100a353ca4014f3bcdaa197aade6d4))


### Features

* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **model, model-instance-document:** Encode 'unique' as Uint8Array ([#2212](https://github.com/ceramicnetwork/js-ceramic/issues/2212)) ([f6eb92b](https://github.com/ceramicnetwork/js-ceramic/commit/f6eb92b05f373746da404694288e7e53053e641b))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-handler,stream-model-instance-handler:** Remove state.next from Model and MID StreamState ([#2306](https://github.com/ceramicnetwork/js-ceramic/issues/2306)) ([3e06b21](https://github.com/ceramicnetwork/js-ceramic/commit/3e06b21dee82417f2911a198058ee5fca9e269e4))
* **stream-model-instance-handler:** Validate relations in MID handler ([#2587](https://github.com/ceramicnetwork/js-ceramic/issues/2587)) ([064e694](https://github.com/ceramicnetwork/js-ceramic/commit/064e694fdd6ed445cf7579806e39b9891a6c341d))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))
* **stream-model-instance:** Enforce that model field must refer to a Model StreamID ([#2243](https://github.com/ceramicnetwork/js-ceramic/issues/2243)) ([6957a71](https://github.com/ceramicnetwork/js-ceramic/commit/6957a7142292a86b267d42a5e52c25ba3df5d101))
* **stream-model, stream-model-handler:** Core APIs for Model streamtype ([#2182](https://github.com/ceramicnetwork/js-ceramic/issues/2182)) ([65383af](https://github.com/ceramicnetwork/js-ceramic/commit/65383af69f69b730b0c54fe9d19569bfcace4f0c))
* Track cacao expiration times in StreamState ([#2563](https://github.com/ceramicnetwork/js-ceramic/issues/2563)) ([09f17c8](https://github.com/ceramicnetwork/js-ceramic/commit/09f17c82eb9d8b313185d028c01445b7d312517b))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))





## [0.15.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.15.0...@ceramicnetwork/stream-model-instance-handler@0.15.1) (2022-12-29)


### Reverts

* Revert "chore: Make memoization slightly faster and more reliable (#2235)" ([5c64483](https://github.com/ceramicnetwork/js-ceramic/commit/5c644838da2e7e0b0d5a1a696576dd3d188f9a67)), closes [#2235](https://github.com/ceramicnetwork/js-ceramic/issues/2235)





# [0.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.15.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.15.0) (2022-12-21)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.15.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.14.0...@ceramicnetwork/stream-model-instance-handler@0.15.0-rc.0) (2022-12-15)


### Bug Fixes

* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([d40a19a](https://github.com/ceramicnetwork/js-ceramic/commit/d40a19acac88b45d6539d94b8039363e0c650b92))
* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([8c7f239](https://github.com/ceramicnetwork/js-ceramic/commit/8c7f2398136f799feac9a3ba875d23063793ee9b))
* **stream-tile-handler,stream-model-handler,stream-model-instance-handler:** Don't cache schemas ([#2267](https://github.com/ceramicnetwork/js-ceramic/issues/2267)) ([1744d84](https://github.com/ceramicnetwork/js-ceramic/commit/1744d849568ae8e630345677446374e39fc04055))
* Wrap AJV instances in LRU cache ([#2488](https://github.com/ceramicnetwork/js-ceramic/issues/2488)) ([3a6e31a](https://github.com/ceramicnetwork/js-ceramic/commit/3a6e31a58d100a353ca4014f3bcdaa197aade6d4))


### Features

* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **model, model-instance-document:** Encode 'unique' as Uint8Array ([#2212](https://github.com/ceramicnetwork/js-ceramic/issues/2212)) ([f6eb92b](https://github.com/ceramicnetwork/js-ceramic/commit/f6eb92b05f373746da404694288e7e53053e641b))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-handler,stream-model-instance-handler:** Remove state.next from Model and MID StreamState ([#2306](https://github.com/ceramicnetwork/js-ceramic/issues/2306)) ([3e06b21](https://github.com/ceramicnetwork/js-ceramic/commit/3e06b21dee82417f2911a198058ee5fca9e269e4))
* **stream-model-instance-handler:** Validate relations in MID handler ([#2587](https://github.com/ceramicnetwork/js-ceramic/issues/2587)) ([064e694](https://github.com/ceramicnetwork/js-ceramic/commit/064e694fdd6ed445cf7579806e39b9891a6c341d))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))
* **stream-model-instance:** Enforce that model field must refer to a Model StreamID ([#2243](https://github.com/ceramicnetwork/js-ceramic/issues/2243)) ([6957a71](https://github.com/ceramicnetwork/js-ceramic/commit/6957a7142292a86b267d42a5e52c25ba3df5d101))
* **stream-model, stream-model-handler:** Core APIs for Model streamtype ([#2182](https://github.com/ceramicnetwork/js-ceramic/issues/2182)) ([65383af](https://github.com/ceramicnetwork/js-ceramic/commit/65383af69f69b730b0c54fe9d19569bfcace4f0c))
* Track cacao expiration times in StreamState ([#2563](https://github.com/ceramicnetwork/js-ceramic/issues/2563)) ([09f17c8](https://github.com/ceramicnetwork/js-ceramic/commit/09f17c82eb9d8b313185d028c01445b7d312517b))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))





# [0.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.14.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.14.0) (2022-12-08)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.14.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.13.0...@ceramicnetwork/stream-model-instance-handler@0.14.0-rc.0) (2022-11-28)


### Features

* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* Track cacao expiration times in StreamState ([#2563](https://github.com/ceramicnetwork/js-ceramic/issues/2563)) ([09f17c8](https://github.com/ceramicnetwork/js-ceramic/commit/09f17c82eb9d8b313185d028c01445b7d312517b))





# [0.13.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.13.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.13.0) (2022-11-09)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.13.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.12.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.13.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.12.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.11.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.12.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.11.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.10.0...@ceramicnetwork/stream-model-instance-handler@0.11.0-rc.0) (2022-11-03)


### Bug Fixes

* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))





# [0.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.10.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.10.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.10.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.8.1-rc.0...@ceramicnetwork/stream-model-instance-handler@0.10.0-rc.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# 0.9.0-rc.0 (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.8.1-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.8.0...@ceramicnetwork/stream-model-instance-handler@0.8.1-rc.0) (2022-10-19)


### Bug Fixes

* Wrap AJV instances in LRU cache (#2488) 3a6e31a, closes #2488





# [0.8.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.8.0) (2022-10-05)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.8.0-rc.2](/compare/@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.2) (2022-10-04)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.8.0-rc.1](/compare/@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.1) (2022-09-30)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.8.0-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.7.0...@ceramicnetwork/stream-model-instance-handler@0.8.0-rc.0) (2022-09-28)


### Features

* update dids, add/register cacao verifiers (#2452) d93fedb, closes #2452





# [0.7.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.7.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.7.0) (2022-09-21)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.7.0-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.2...@ceramicnetwork/stream-model-instance-handler@0.7.0-rc.0) (2022-09-20)


### Features

* **common:** Update type definitions to support simple relations (#2421) a4c4ce3, closes #2421





## [0.6.1-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.1...@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.2) (2022-09-15)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.6.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.0...@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.1) (2022-09-14)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.6.1-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.6.0...@ceramicnetwork/stream-model-instance-handler@0.6.1-rc.0) (2022-09-13)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.6.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.6.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.6.0) (2022-09-08)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.6.0-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.5.1-rc.0...@ceramicnetwork/stream-model-instance-handler@0.6.0-rc.0) (2022-09-06)


### Bug Fixes

* evaluate string value of env vars as booleans (#2382) 2837112, closes #2382


### Features

* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features (#2405) f0435ac, closes #2405





## [0.5.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.5.0...@ceramicnetwork/stream-model-instance-handler@0.5.1-rc.0) (2022-08-22)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.5.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.5.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.5.0) (2022-08-22)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.5.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.4.1...@ceramicnetwork/stream-model-instance-handler@0.5.0-rc.1) (2022-08-20)


### Bug Fixes

* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([8c7f239](https://github.com/ceramicnetwork/js-ceramic/commit/8c7f2398136f799feac9a3ba875d23063793ee9b))


### Features

* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))






## [0.4.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.4.0...@ceramicnetwork/stream-model-instance-handler@0.4.1) (2022-08-19)


### Bug Fixes

* **stream-model-instance-handler,streamid:** Fix test snapshots with new Uint8Array format ([#2349](https://github.com/ceramicnetwork/js-ceramic/issues/2349)) ([d40a19a](https://github.com/ceramicnetwork/js-ceramic/commit/d40a19acac88b45d6539d94b8039363e0c650b92))






# [0.4.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.2...@ceramicnetwork/stream-model-instance-handler@0.4.0) (2022-08-08)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.4.0-rc.2](/compare/@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.2) (2022-07-26)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.4.0-rc.1](/compare/@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.1) (2022-07-14)


### Bug Fixes

* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams (#2307) 5b9773a, closes #2307


### Features

* **stream-model-handler,stream-model-instance-handler:** Remove state.next from Model and MID StreamState (#2306) 3e06b21, closes #2306





# [0.4.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.3.0...@ceramicnetwork/stream-model-instance-handler@0.4.0-rc.0) (2022-07-06)


### Features

* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.3.0-rc.1...@ceramicnetwork/stream-model-instance-handler@0.3.0) (2022-07-06)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.3.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-model-instance-handler@0.3.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.3.0-rc.1) (2022-06-30)


### Features

* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))





# [0.3.0-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.1...@ceramicnetwork/stream-model-instance-handler@0.3.0-rc.0) (2022-06-27)


### Bug Fixes

* **stream-tile-handler,stream-model-handler,stream-model-instance-handler:** Don't cache schemas (#2267) 1744d84, closes #2267


### Features

* **stream-model-instance:** Enforce that model field must refer to a Model StreamID (#2243) 6957a71, closes #2243





## [0.2.1](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.1-rc.0...@ceramicnetwork/stream-model-instance-handler@0.2.1) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.2.1-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.0...@ceramicnetwork/stream-model-instance-handler@0.2.1-rc.0) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.2.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.3...@ceramicnetwork/stream-model-instance-handler@0.2.0) (2022-06-17)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.2.0-rc.3](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.2...@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.3) (2022-06-17)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.2.0-rc.2](/compare/@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.0...@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.2) (2022-06-13)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





# [0.2.0-rc.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.1.0...@ceramicnetwork/stream-model-instance-handler@0.2.0-rc.0) (2022-06-13)


### Features

* **model, model-instance-document:** Encode 'unique' as Uint8Array (#2212) f6eb92b, closes #2212





# [0.1.0](/compare/@ceramicnetwork/stream-model-instance-handler@0.0.2...@ceramicnetwork/stream-model-instance-handler@0.1.0) (2022-06-06)


### Features

* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API (#2196) 3ecf9fd, closes #2196
* **stream-model, stream-model-handler:** Core APIs for Model streamtype (#2182) 65383af, closes #2182





## [0.0.2](/compare/@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.4...@ceramicnetwork/stream-model-instance-handler@0.0.2) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.0.2-rc.4](/compare/@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.3...@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.4) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.0.2-rc.3](/compare/@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.1...@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.3) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## [0.0.2-rc.1](/compare/@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.0...@ceramicnetwork/stream-model-instance-handler@0.0.2-rc.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler





## 0.0.2-rc.0 (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/stream-model-instance-handler
