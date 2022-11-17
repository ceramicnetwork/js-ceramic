# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.14.0...@ceramicnetwork/stream-tests@2.15.0) (2022-11-16)


### Bug Fixes

* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))


### Features

* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))
* **stream-model:** Change Model model for indexing to use UNLOADABLE streamtype ([#2326](https://github.com/ceramicnetwork/js-ceramic/issues/2326)) ([cac8010](https://github.com/ceramicnetwork/js-ceramic/commit/cac8010afd6735af190c95025c223abe9f938f1a))
* **stream-model:** Only allow genesis commit ([#2383](https://github.com/ceramicnetwork/js-ceramic/issues/2383)) ([f269217](https://github.com/ceramicnetwork/js-ceramic/commit/f269217b45868acb19d89a0bd62d44babc895b71))
* **stream-model:** Remove 'unique' from Model metadata ([#2396](https://github.com/ceramicnetwork/js-ceramic/issues/2396)) ([1f0c820](https://github.com/ceramicnetwork/js-ceramic/commit/1f0c8208da8ac880168de7d47f58216c4a23223e))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))





# [2.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.14.0-rc.0...@ceramicnetwork/stream-tests@2.14.0) (2022-11-09)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.14.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.13.0-rc.0...@ceramicnetwork/stream-tests@2.14.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.13.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.12.0-rc.0...@ceramicnetwork/stream-tests@2.13.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.12.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.11.0...@ceramicnetwork/stream-tests@2.12.0-rc.0) (2022-11-03)


### Bug Fixes

* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))





# [2.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.11.0-rc.0...@ceramicnetwork/stream-tests@2.11.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.11.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.9.1-rc.1...@ceramicnetwork/stream-tests@2.11.0-rc.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.10.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.9.1-rc.1...@ceramicnetwork/stream-tests@2.10.0-rc.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





## [2.9.1-rc.1](/compare/@ceramicnetwork/stream-tests@2.9.1-rc.0...@ceramicnetwork/stream-tests@2.9.1-rc.1) (2022-10-19)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





## [2.9.1-rc.0](/compare/@ceramicnetwork/stream-tests@2.9.0...@ceramicnetwork/stream-tests@2.9.1-rc.0) (2022-10-19)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.9.0](/compare/@ceramicnetwork/stream-tests@2.9.0-rc.1...@ceramicnetwork/stream-tests@2.9.0) (2022-10-05)


### Features

* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. (#2481) 52a8c50, closes #2481





# [2.9.0-rc.2](/compare/@ceramicnetwork/stream-tests@2.9.0-rc.1...@ceramicnetwork/stream-tests@2.9.0-rc.2) (2022-10-04)


### Features

* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. (#2481) 52a8c50, closes #2481





# [2.9.0-rc.1](/compare/@ceramicnetwork/stream-tests@2.9.0-rc.0...@ceramicnetwork/stream-tests@2.9.0-rc.1) (2022-09-30)


### Features

* **core:** Throw clear error and log warning when querying a model that isn't indexed (#2467) e79f157, closes #2467





# [2.9.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.8.0...@ceramicnetwork/stream-tests@2.9.0-rc.0) (2022-09-28)


### Features

* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries (#2455) fbe04b5, closes #2455
* **core:** Load Model relations when indexing a new Model (#2447) 3c87ea7, closes #2447
* update dids, add/register cacao verifiers (#2452) d93fedb, closes #2452





# [2.8.0](/compare/@ceramicnetwork/stream-tests@2.8.0-rc.0...@ceramicnetwork/stream-tests@2.8.0) (2022-09-21)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.8.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.7.1-rc.2...@ceramicnetwork/stream-tests@2.8.0-rc.0) (2022-09-20)


### Features

* **common:** Update type definitions to support simple relations (#2421) a4c4ce3, closes #2421





## [2.7.1-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.7.1-rc.1...@ceramicnetwork/stream-tests@2.7.1-rc.2) (2022-09-15)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





## [2.7.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.7.1-rc.0...@ceramicnetwork/stream-tests@2.7.1-rc.1) (2022-09-14)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





## [2.7.1-rc.0](/compare/@ceramicnetwork/stream-tests@2.7.0...@ceramicnetwork/stream-tests@2.7.1-rc.0) (2022-09-13)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.7.0](/compare/@ceramicnetwork/stream-tests@2.7.0-rc.1...@ceramicnetwork/stream-tests@2.7.0) (2022-09-08)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.7.0-rc.1](/compare/@ceramicnetwork/stream-tests@2.7.0-rc.0...@ceramicnetwork/stream-tests@2.7.0-rc.1) (2022-09-06)


### Features

* Make SYNC_ALWAYS rewrite and revalidate local state (#2410) 24caa20, closes #2410





# [2.7.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.6.1-rc.0...@ceramicnetwork/stream-tests@2.7.0-rc.0) (2022-09-06)


### Features

* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features (#2405) f0435ac, closes #2405
* **stream-model:** Only allow genesis commit (#2383) f269217, closes #2383
* **stream-model:** Remove 'unique' from Model metadata (#2396) 1f0c820, closes #2396





## [2.6.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.6.0...@ceramicnetwork/stream-tests@2.6.1-rc.0) (2022-08-22)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.5.2...@ceramicnetwork/stream-tests@2.6.0) (2022-08-22)


### Features

* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))





# [2.6.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.5.2...@ceramicnetwork/stream-tests@2.6.0-rc.0) (2022-08-20)


### Features

* **stream-model-instance,stream-model-instance-handler:** Enable deterministic MIDs for models with SINGLE accountRelations ([#2356](https://github.com/ceramicnetwork/js-ceramic/issues/2356)) ([a39d5e2](https://github.com/ceramicnetwork/js-ceramic/commit/a39d5e2dc4131c7821a458861393029f45199be6))






## [2.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/stream-tests@2.5.1...@ceramicnetwork/stream-tests@2.5.2) (2022-08-19)

**Note:** Version bump only for package @ceramicnetwork/stream-tests






## [2.5.1](/compare/@ceramicnetwork/stream-tests@2.5.0...@ceramicnetwork/stream-tests@2.5.1) (2022-08-11)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.5.0](/compare/@ceramicnetwork/stream-tests@2.5.0-rc.0...@ceramicnetwork/stream-tests@2.5.0) (2022-08-08)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





# [2.5.0-rc.0](/compare/@ceramicnetwork/stream-tests@2.4.1-rc.1...@ceramicnetwork/stream-tests@2.5.0-rc.0) (2022-07-26)


### Features

* **core:** Pinning a ModelInstanceDocument should also pin its Model (#2319) 6df9ae9, closes #2319
* **stream-model:** Change Model model for indexing to use UNLOADABLE streamtype (#2326) cac8010, closes #2326





## 2.4.1-rc.1 (2022-07-14)

**Note:** Version bump only for package @ceramicnetwork/stream-tests





## [2.4.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.4.0...@ceramicnetwork/canary-integration@2.4.1-rc.0) (2022-07-06)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.4.0-rc.1...@ceramicnetwork/canary-integration@2.4.0) (2022-07-06)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.4.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.4.0-rc.0...@ceramicnetwork/canary-integration@2.4.0-rc.1) (2022-06-30)


### Features

* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))





# [2.4.0-rc.0](/compare/@ceramicnetwork/canary-integration@2.3.1...@ceramicnetwork/canary-integration@2.4.0-rc.0) (2022-06-27)


### Bug Fixes

* **blockchain-utils-linking,blockchain-utils-validation,canary-integration:** Disable flaky polkadot tests (#2250) 2047ab4, closes #2250


### Features

* **stream-model-instance:** Enforce that model field must refer to a Model StreamID (#2243) 6957a71, closes #2243





## [2.3.1](/compare/@ceramicnetwork/canary-integration@2.3.1-rc.0...@ceramicnetwork/canary-integration@2.3.1) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.3.1-rc.0](/compare/@ceramicnetwork/canary-integration@2.3.0...@ceramicnetwork/canary-integration@2.3.1-rc.0) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0](/compare/@ceramicnetwork/canary-integration@2.3.0-rc.5...@ceramicnetwork/canary-integration@2.3.0) (2022-06-17)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0-rc.5](/compare/@ceramicnetwork/canary-integration@2.3.0-rc.4...@ceramicnetwork/canary-integration@2.3.0-rc.5) (2022-06-17)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0-rc.4](/compare/@ceramicnetwork/canary-integration@2.3.0-rc.3...@ceramicnetwork/canary-integration@2.3.0-rc.4) (2022-06-14)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0-rc.3](/compare/@ceramicnetwork/canary-integration@2.3.0-rc.2...@ceramicnetwork/canary-integration@2.3.0-rc.3) (2022-06-13)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0-rc.2](/compare/@ceramicnetwork/canary-integration@2.3.0-rc.0...@ceramicnetwork/canary-integration@2.3.0-rc.2) (2022-06-13)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.3.0-rc.0](/compare/@ceramicnetwork/canary-integration@2.2.0...@ceramicnetwork/canary-integration@2.3.0-rc.0) (2022-06-13)


### Features

* **model, model-instance-document:** Encode 'unique' as Uint8Array (#2212) f6eb92b, closes #2212





# [2.2.0](/compare/@ceramicnetwork/canary-integration@2.1.3...@ceramicnetwork/canary-integration@2.2.0) (2022-06-06)


### Features

* **core:** Setup database connection for indexing, SQLite only (#2167) 3d63ccc, closes #2167
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API (#2196) 3ecf9fd, closes #2196
* **stream-model, stream-model-handler:** Core APIs for Model streamtype (#2182) 65383af, closes #2182





## [2.1.3](/compare/@ceramicnetwork/canary-integration@2.1.3-rc.2...@ceramicnetwork/canary-integration@2.1.3) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.1.3-rc.2](/compare/@ceramicnetwork/canary-integration@2.1.3-rc.1...@ceramicnetwork/canary-integration@2.1.3-rc.2) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.1.3-rc.1](/compare/@ceramicnetwork/canary-integration@2.1.2...@ceramicnetwork/canary-integration@2.1.3-rc.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.1.2](/compare/@ceramicnetwork/canary-integration@2.1.1...@ceramicnetwork/canary-integration@2.1.2) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.1.1](/compare/@ceramicnetwork/canary-integration@2.1.0-rc.4...@ceramicnetwork/canary-integration@2.1.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.1.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.1.0-rc.3...@ceramicnetwork/canary-integration@2.1.0-rc.4) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.1.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.1.0-rc.1...@ceramicnetwork/canary-integration@2.1.0-rc.3) (2022-05-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# 2.1.0-rc.2 (2022-05-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.1.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.1.0-rc.0...@ceramicnetwork/canary-integration@2.1.0-rc.1) (2022-05-11)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.3-rc.1...@ceramicnetwork/canary-integration@2.1.0-rc.0) (2022-05-11)


### Bug Fixes

* **canary-integration:** Increase test fixture cleanup timeout ([#2145](https://github.com/ceramicnetwork/js-ceramic/issues/2145)) ([e48ddef](https://github.com/ceramicnetwork/js-ceramic/commit/e48ddef765e68e01b79d33e83ca77364643b3bcc))


### Features

* **stream-tile-handler:** add cacao wildcard resource support ([#2137](https://github.com/ceramicnetwork/js-ceramic/issues/2137)) ([5ffb298](https://github.com/ceramicnetwork/js-ceramic/commit/5ffb2984340e298c72388bbbb88cdf251bf38aec))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))





## [2.0.3-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.3-rc.0...@ceramicnetwork/canary-integration@2.0.3-rc.1) (2022-04-27)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.0.3-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.2...@ceramicnetwork/canary-integration@2.0.3-rc.0) (2022-04-26)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.0.2](/compare/@ceramicnetwork/canary-integration@2.0.2-rc.0...@ceramicnetwork/canary-integration@2.0.2) (2022-04-20)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.0.2-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.1...@ceramicnetwork/canary-integration@2.0.2-rc.0) (2022-04-20)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.0.1](/compare/@ceramicnetwork/canary-integration@2.0.1-rc.0...@ceramicnetwork/canary-integration@2.0.1) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [2.0.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0...@ceramicnetwork/canary-integration@2.0.1-rc.0) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0](/compare/@ceramicnetwork/canary-integration@2.0.0-rc.5...@ceramicnetwork/canary-integration@2.0.0) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-rc.5](/compare/@ceramicnetwork/canary-integration@2.0.0-rc.4...@ceramicnetwork/canary-integration@2.0.0-rc.5) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-rc.3...@ceramicnetwork/canary-integration@2.0.0-rc.4) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-rc.2...@ceramicnetwork/canary-integration@2.0.0-rc.3) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-rc.1...@ceramicnetwork/canary-integration@2.0.0-rc.2) (2022-04-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-rc.0...@ceramicnetwork/canary-integration@2.0.0-rc.1) (2022-04-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# 2.0.0-rc.0 (2022-03-31)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [2.0.0-alpha.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-alpha.3...@ceramicnetwork/canary-integration@2.0.0-alpha.4) (2022-03-24)


### Features

* Add support for specifying resources by family ([#2070](https://github.com/ceramicnetwork/js-ceramic/issues/2070)) ([2a17f16](https://github.com/ceramicnetwork/js-ceramic/commit/2a17f16937702225d402ce13569e7ea0c3248990))





# [2.0.0-alpha.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-alpha.2...@ceramicnetwork/canary-integration@2.0.0-alpha.3) (2022-03-03)


### Features

* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))





# [2.0.0-alpha.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@2.0.0-alpha.1...@ceramicnetwork/canary-integration@2.0.0-alpha.2) (2022-02-10)


### Features

* Cache chainId requests to providers ([#2003](https://github.com/ceramicnetwork/js-ceramic/issues/2003)) ([892d6af](https://github.com/ceramicnetwork/js-ceramic/commit/892d6af6708b32690e9eb0ae5dab6cfad3f822f6))
* Restore mocked ethereum tests ([#2026](https://github.com/ceramicnetwork/js-ceramic/issues/2026)) ([019ec64](https://github.com/ceramicnetwork/js-ceramic/commit/019ec6427dcc81126a96e01cf8ed88abcb3afa4c))
* Restore tezos tests that require mocks ([#2027](https://github.com/ceramicnetwork/js-ceramic/issues/2027)) ([8ab174d](https://github.com/ceramicnetwork/js-ceramic/commit/8ab174d201cb9387d3896438545ffc5f5ab31fad))





# [2.0.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3-rc.10...@ceramicnetwork/canary-integration@2.0.0-alpha.1) (2022-01-14)


### Features

* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Only allow valid CBOR in deterministic streams ([#1925](https://github.com/ceramicnetwork/js-ceramic/issues/1925)) ([7031283](https://github.com/ceramicnetwork/js-ceramic/commit/7031283637f93192e0be258eaa00dc2be33a746f))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))





# [2.0.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3-rc.10...@ceramicnetwork/canary-integration@2.0.0-alpha.0) (2021-12-07)


### Features

* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))





## [1.4.10-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.9...@ceramicnetwork/canary-integration@1.4.10-rc.0) (2022-01-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.8...@ceramicnetwork/canary-integration@1.4.9) (2022-01-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.7...@ceramicnetwork/canary-integration@1.4.8) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.6...@ceramicnetwork/canary-integration@1.4.7) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.5...@ceramicnetwork/canary-integration@1.4.6) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/canary-integration






## [1.4.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.5-rc.0...@ceramicnetwork/canary-integration@1.4.5) (2021-12-23)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.5-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.4...@ceramicnetwork/canary-integration@1.4.5-rc.0) (2021-12-23)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.4-rc.2...@ceramicnetwork/canary-integration@1.4.4) (2021-12-08)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.4-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.4-rc.1...@ceramicnetwork/canary-integration@1.4.4-rc.2) (2021-12-08)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.4-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.4-rc.0...@ceramicnetwork/canary-integration@1.4.4-rc.1) (2021-12-08)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.4-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3...@ceramicnetwork/canary-integration@1.4.4-rc.0) (2021-12-06)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3-rc.10...@ceramicnetwork/canary-integration@1.4.3) (2021-12-06)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3-rc.9...@ceramicnetwork/canary-integration@1.4.3-rc.10) (2021-12-06)


### Bug Fixes

* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))





## [1.4.3-rc.9](/compare/@ceramicnetwork/canary-integration@1.4.3-rc.8...@ceramicnetwork/canary-integration@1.4.3-rc.9) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.8](/compare/@ceramicnetwork/canary-integration@1.4.3-rc.6...@ceramicnetwork/canary-integration@1.4.3-rc.8) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.6](/compare/@ceramicnetwork/canary-integration@1.4.3-rc.4...@ceramicnetwork/canary-integration@1.4.3-rc.6) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.4](/compare/@ceramicnetwork/canary-integration@1.4.3-rc.2...@ceramicnetwork/canary-integration@1.4.3-rc.4) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.2](/compare/@ceramicnetwork/canary-integration@1.4.3-rc.1...@ceramicnetwork/canary-integration@1.4.3-rc.2) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.3-rc.0...@ceramicnetwork/canary-integration@1.4.3-rc.1) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.3-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.2...@ceramicnetwork/canary-integration@1.4.3-rc.0) (2021-11-17)


### Bug Fixes

* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))





## [1.4.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.2-rc.0...@ceramicnetwork/canary-integration@1.4.2) (2021-11-17)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.2-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.1...@ceramicnetwork/canary-integration@1.4.2-rc.0) (2021-11-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.1-rc.0...@ceramicnetwork/canary-integration@1.4.1) (2021-11-12)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.4.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.0...@ceramicnetwork/canary-integration@1.4.1-rc.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.4.0-rc.0...@ceramicnetwork/canary-integration@1.4.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.4.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.3.2-rc.0...@ceramicnetwork/canary-integration@1.4.0-rc.0) (2021-10-28)


### Features

* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* caip10 ethereum+eos integration test ([#1668](https://github.com/ceramicnetwork/js-ceramic/issues/1668)) ([4267d8b](https://github.com/ceramicnetwork/js-ceramic/commit/4267d8b31fca38a163bb009198a49e1de22b2a58)), closes [#1678](https://github.com/ceramicnetwork/js-ceramic/issues/1678)
* deprecate deterministic tile metadata arg, add deterministic function ([#1771](https://github.com/ceramicnetwork/js-ceramic/issues/1771)) ([1307ceb](https://github.com/ceramicnetwork/js-ceramic/commit/1307ceb3963465b973a13be82b1229b59f563544))
* Transplant Near support ([#1739](https://github.com/ceramicnetwork/js-ceramic/issues/1739)) ([d82249a](https://github.com/ceramicnetwork/js-ceramic/commit/d82249aa4fb98257fdfe82e7d19c74902c2732cb))





## [1.3.2-rc.0](/compare/@ceramicnetwork/canary-integration@1.3.1...@ceramicnetwork/canary-integration@1.3.2-rc.0) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





## [1.3.1](/compare/@ceramicnetwork/canary-integration@1.3.0...@ceramicnetwork/canary-integration@1.3.1) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.3.0-rc.0...@ceramicnetwork/canary-integration@1.3.0) (2021-10-20)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.3.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.2.0...@ceramicnetwork/canary-integration@1.3.0-rc.0) (2021-10-14)


### Features

* caip10 ethereum+eos integration test ([#1668](https://github.com/ceramicnetwork/js-ceramic/issues/1668)) ([4267d8b](https://github.com/ceramicnetwork/js-ceramic/commit/4267d8b31fca38a163bb009198a49e1de22b2a58)), closes [#1678](https://github.com/ceramicnetwork/js-ceramic/issues/1678)
* Transplant Near support ([#1739](https://github.com/ceramicnetwork/js-ceramic/issues/1739)) ([d82249a](https://github.com/ceramicnetwork/js-ceramic/commit/d82249aa4fb98257fdfe82e7d19c74902c2732cb))





# [1.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.2.0-rc.2...@ceramicnetwork/canary-integration@1.2.0) (2021-10-14)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.2.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.2.0-rc.1...@ceramicnetwork/canary-integration@1.2.0-rc.2) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.2.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.2.0-rc.0...@ceramicnetwork/canary-integration@1.2.0-rc.1) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/canary-integration@1.1.0...@ceramicnetwork/canary-integration@1.2.0-rc.0) (2021-09-17)


### Features

* caip10 ethereum+eos integration test ([#1668](https://github.com/ceramicnetwork/js-ceramic/issues/1668)) ([4267d8b](https://github.com/ceramicnetwork/js-ceramic/commit/4267d8b31fca38a163bb009198a49e1de22b2a58)), closes [#1678](https://github.com/ceramicnetwork/js-ceramic/issues/1678)





# [1.1.0](/compare/@ceramicnetwork/canary-integration@1.1.0-rc.2...@ceramicnetwork/canary-integration@1.1.0) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.1.0-rc.2](/compare/@ceramicnetwork/canary-integration@1.1.0-rc.0...@ceramicnetwork/canary-integration@1.1.0-rc.2) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# [1.1.0-rc.1](/compare/@ceramicnetwork/canary-integration@1.1.0-rc.0...@ceramicnetwork/canary-integration@1.1.0-rc.1) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/canary-integration





# 1.1.0-rc.0 (2021-09-13)


### Features

* caip10 ethereum+eos integration test ([#1668](https://github.com/ceramicnetwork/js-ceramic/issues/1668)) ([4267d8b](https://github.com/ceramicnetwork/js-ceramic/commit/4267d8b31fca38a163bb009198a49e1de22b2a58)), closes [#1678](https://github.com/ceramicnetwork/js-ceramic/issues/1678)
