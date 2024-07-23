# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@6.2.0-rc.0...@ceramicnetwork/core@6.2.0) (2024-07-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [6.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@6.1.0...@ceramicnetwork/core@6.2.0-rc.0) (2024-07-22)


### Bug Fixes

* pin multiformats to patches of v13.1.x ([#3267](https://github.com/ceramicnetwork/js-ceramic/issues/3267)) ([da64078](https://github.com/ceramicnetwork/js-ceramic/commit/da6407810961b94105fd9b54eba4f3500b4a4bc5))


### Features

* more observability for import CAR and CAS polling ([#3266](https://github.com/ceramicnetwork/js-ceramic/issues/3266)) ([e12bd61](https://github.com/ceramicnetwork/js-ceramic/commit/e12bd6116c5c329f8894f1f4642a514fbb2f9c51))
* recon resubscribes to interests on startup ([#3262](https://github.com/ceramicnetwork/js-ceramic/issues/3262)) ([0682179](https://github.com/ceramicnetwork/js-ceramic/commit/06821791617872b6cec58ab5a74135c63159211b))





# [6.1.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@6.0.1-rc.1...@ceramicnetwork/core@6.1.0) (2024-07-15)

**Note:** Version bump only for package @ceramicnetwork/core





## [6.0.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@6.0.1-rc.0...@ceramicnetwork/core@6.0.1-rc.1) (2024-07-12)

**Note:** Version bump only for package @ceramicnetwork/core





## [6.0.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@6.0.0-rc.0...@ceramicnetwork/core@6.0.1-rc.0) (2024-07-10)

**Note:** Version bump only for package @ceramicnetwork/core





# [6.0.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.16.0...@ceramicnetwork/core@6.0.0-rc.0) (2024-07-10)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.16.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.16.0-rc.0...@ceramicnetwork/core@5.16.0) (2024-07-01)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.16.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.15.0...@ceramicnetwork/core@5.16.0-rc.0) (2024-06-24)


### Bug Fixes

* add offline mode to ipfs dag retrievals in pin store ([#3242](https://github.com/ceramicnetwork/js-ceramic/issues/3242)) ([db89e31](https://github.com/ceramicnetwork/js-ceramic/commit/db89e311fb067ece2a3481806fee8be942c2e424))
* bump to node-metrics with better non-string handling ([#3247](https://github.com/ceramicnetwork/js-ceramic/issues/3247)) ([f612756](https://github.com/ceramicnetwork/js-ceramic/commit/f612756b6c16e7294190887a1e3a801511f2121e))
* switch package name to node-metrics / NodeMetrics from model-metrics ([#3243](https://github.com/ceramicnetwork/js-ceramic/issues/3243)) ([ccfb342](https://github.com/ceramicnetwork/js-ceramic/commit/ccfb34203e6218926e213970c9d379b7680f2cea))


### Features

* Do not send CAR files when creating anchor requests against the CAS ([#3234](https://github.com/ceramicnetwork/js-ceramic/issues/3234)) ([48c7100](https://github.com/ceramicnetwork/js-ceramic/commit/48c7100619754a46b8d8fa21c5a514dbe34cc5c4))
* Publish js-ceramic and C1 versions as a metric once per hour ([#3245](https://github.com/ceramicnetwork/js-ceramic/issues/3245)) ([6124192](https://github.com/ceramicnetwork/js-ceramic/commit/6124192e8a1426e75a4169ed6da405bd79f40adc))
* send js-ceramic and ceramic-one versions to CAS when creating requests ([#3246](https://github.com/ceramicnetwork/js-ceramic/issues/3246)) ([bd90887](https://github.com/ceramicnetwork/js-ceramic/commit/bd9088727863f2da847f40aa739d25281a05ffae))





# [5.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.15.0-rc.1...@ceramicnetwork/core@5.15.0) (2024-06-17)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.15.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.15.0-rc.0...@ceramicnetwork/core@5.15.0-rc.1) (2024-06-13)


### Features

* allow custom anchor service urls on mainnet ([#3240](https://github.com/ceramicnetwork/js-ceramic/issues/3240)) ([8d7306a](https://github.com/ceramicnetwork/js-ceramic/commit/8d7306aa7e1db7be38cace1b3ceb76dbad1bc627))





# [5.15.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.14.0...@ceramicnetwork/core@5.15.0-rc.0) (2024-06-10)


### Bug Fixes

* sleep if loop duration is a special 0 ([#3238](https://github.com/ceramicnetwork/js-ceramic/issues/3238)) ([e2638b1](https://github.com/ceramicnetwork/js-ceramic/commit/e2638b10d66981d1554211bbfa91af5f0d187ba8))





# [5.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.14.0-rc.0...@ceramicnetwork/core@5.14.0) (2024-06-10)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.14.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.13.0...@ceramicnetwork/core@5.14.0-rc.0) (2024-06-03)


### Bug Fixes

* stabilize unit test by no longer emitting an entry after it has been processed ([#3230](https://github.com/ceramicnetwork/js-ceramic/issues/3230)) ([52c1414](https://github.com/ceramicnetwork/js-ceramic/commit/52c1414dd44c81f09d53bea03a5741a6e6fb8aa3))





# [5.13.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.13.0-rc.0...@ceramicnetwork/core@5.13.0) (2024-06-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.13.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.12.0...@ceramicnetwork/core@5.13.0-rc.0) (2024-05-20)


### Bug Fixes

* Do not transfer 0 to a next ms after initialization ([#3229](https://github.com/ceramicnetwork/js-ceramic/issues/3229)) ([367f3a8](https://github.com/ceramicnetwork/js-ceramic/commit/367f3a8c83b8410e2ee9d6c9ea752d838a59fd0e))





# [5.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.12.0-rc.1...@ceramicnetwork/core@5.12.0) (2024-05-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.12.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.12.0-rc.0...@ceramicnetwork/core@5.12.0-rc.1) (2024-05-13)


### Bug Fixes

* rate limit how fast anchor polling loops on small data sets ([#3218](https://github.com/ceramicnetwork/js-ceramic/issues/3218)) ([41ad653](https://github.com/ceramicnetwork/js-ceramic/commit/41ad65374d73104527d9c551183e621532b5c5f8))





# [5.12.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.11.0...@ceramicnetwork/core@5.12.0-rc.0) (2024-05-13)


### Features

* add anchor metrics ([#3223](https://github.com/ceramicnetwork/js-ceramic/issues/3223)) ([6d93db2](https://github.com/ceramicnetwork/js-ceramic/commit/6d93db2b2be269083599705fc7b5b1b4649b1c5d))
* remove event id ([#3203](https://github.com/ceramicnetwork/js-ceramic/issues/3203)) ([e21c53c](https://github.com/ceramicnetwork/js-ceramic/commit/e21c53ca914a08db21eda77d5704dc4a12e2ecff))





# [5.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.11.0-rc.0...@ceramicnetwork/core@5.11.0) (2024-05-13)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.11.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.10.0...@ceramicnetwork/core@5.11.0-rc.0) (2024-05-07)


### Features

* FeedStream ([#3216](https://github.com/ceramicnetwork/js-ceramic/issues/3216)) ([0b6ff7c](https://github.com/ceramicnetwork/js-ceramic/commit/0b6ff7c825ef915cd24aea4591904f710cae253f))





# [5.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.10.0-rc.0...@ceramicnetwork/core@5.10.0) (2024-05-06)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.10.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.9.0...@ceramicnetwork/core@5.10.0-rc.0) (2024-04-29)


### Bug Fixes

* Don't import observability package into common, which is used in the http-client ([#3217](https://github.com/ceramicnetwork/js-ceramic/issues/3217)) ([2f9f23f](https://github.com/ceramicnetwork/js-ceramic/commit/2f9f23fb11ffc2b46728e8bc8be876242f5fc005))





# [5.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.9.0-rc.0...@ceramicnetwork/core@5.9.0) (2024-04-29)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.9.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.8.0...@ceramicnetwork/core@5.9.0-rc.0) (2024-04-22)


### Features

* Additional metrics on read and write failures ([#3210](https://github.com/ceramicnetwork/js-ceramic/issues/3210)) ([d8f3551](https://github.com/ceramicnetwork/js-ceramic/commit/d8f355132dad06a3ba9f1e3432b341287c4145d0))
* Record important errors to ModelMetrics ([#3211](https://github.com/ceramicnetwork/js-ceramic/issues/3211)) ([18a397f](https://github.com/ceramicnetwork/js-ceramic/commit/18a397fdd90f355871c15b8d62e2cf8aa038e644))





# [5.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.8.0-rc.0...@ceramicnetwork/core@5.8.0) (2024-04-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.8.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.7.0...@ceramicnetwork/core@5.8.0-rc.0) (2024-04-15)


### Bug Fixes

* disable recon feed in test where it is causing flaky behavior ([#3206](https://github.com/ceramicnetwork/js-ceramic/issues/3206)) ([4b15ada](https://github.com/ceramicnetwork/js-ceramic/commit/4b15ada431b6cb2b5d000d4e72ab977b404578d3))


### Features

* add an entry to the feedstore, when adding to the state store ([#3201](https://github.com/ceramicnetwork/js-ceramic/issues/3201)) ([271bf8b](https://github.com/ceramicnetwork/js-ceramic/commit/271bf8b4e566c12e6a8db0fd1af790d279b8fc2a))
* Add CERAMIC_AUDIT_EVENT_PERSISTENCE that crashes process if data loss detected ([#3204](https://github.com/ceramicnetwork/js-ceramic/issues/3204)) ([e7f1464](https://github.com/ceramicnetwork/js-ceramic/commit/e7f1464de61aaf30a00dc800b69f7c329cd5ab26))
* Add metrics for CACAO expirations ([#3198](https://github.com/ceramicnetwork/js-ceramic/issues/3198)) ([69204e0](https://github.com/ceramicnetwork/js-ceramic/commit/69204e0f64ee24e90d26581acac2b31132ece7c4))





# [5.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.7.0-rc.0...@ceramicnetwork/core@5.7.0) (2024-04-15)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.7.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.6.0...@ceramicnetwork/core@5.7.0-rc.0) (2024-04-03)


### Features

* FeedAggregationStore ([#3191](https://github.com/ceramicnetwork/js-ceramic/issues/3191)) ([db38970](https://github.com/ceramicnetwork/js-ceramic/commit/db38970ab8a632ebe189864591226637a53ba362))
* metrics for counting state of cas requests ([#3193](https://github.com/ceramicnetwork/js-ceramic/issues/3193)) ([e584a66](https://github.com/ceramicnetwork/js-ceramic/commit/e584a66093b51490eec7255395358e57d7c3445b))





# [5.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.6.0-rc.1...@ceramicnetwork/core@5.6.0) (2024-04-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.6.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.6.0-rc.0...@ceramicnetwork/core@5.6.0-rc.1) (2024-03-28)


### Features

* add ability to publish metrics as ceramic model instance documents (rebased) ([#3190](https://github.com/ceramicnetwork/js-ceramic/issues/3190)) ([781fe82](https://github.com/ceramicnetwork/js-ceramic/commit/781fe82a5b3428cd9faa50b82800727df73064df))


### Reverts

* Revert "chore: Use "level" instead of "level-ts" (#3189)" ([ed54626](https://github.com/ceramicnetwork/js-ceramic/commit/ed546268c0ab861a7868fe71130cb23c9d320d77)), closes [#3189](https://github.com/ceramicnetwork/js-ceramic/issues/3189)





# [5.6.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.5.0...@ceramicnetwork/core@5.6.0-rc.0) (2024-03-27)


### Bug Fixes

* Fix race condition in anchor-processing-loop.test.ts ([#3192](https://github.com/ceramicnetwork/js-ceramic/issues/3192)) ([8bda8a8](https://github.com/ceramicnetwork/js-ceramic/commit/8bda8a8acbe53c836ec00a7d3677dfb87f0793bc))





# [5.5.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.5.0-rc.0...@ceramicnetwork/core@5.5.0) (2024-03-27)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.5.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.4.0...@ceramicnetwork/core@5.5.0-rc.0) (2024-03-20)


### Bug Fixes

* remove parsing of resume token and add unit tests for recon ([#3179](https://github.com/ceramicnetwork/js-ceramic/issues/3179)) ([e094c48](https://github.com/ceramicnetwork/js-ceramic/commit/e094c481e14c5a10d78284dc21384f6e6049830e))


### Features

* add sepolia to allow chain for dev-unstable ([#3187](https://github.com/ceramicnetwork/js-ceramic/issues/3187)) ([daa4bef](https://github.com/ceramicnetwork/js-ceramic/commit/daa4befff7d639fb0322d6ca06902cf0f5a94c9d))





# [5.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.4.0-rc.0...@ceramicnetwork/core@5.4.0) (2024-03-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.4.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.3.0...@ceramicnetwork/core@5.4.0-rc.0) (2024-03-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.3.0-rc.1...@ceramicnetwork/core@5.3.0) (2024-03-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.3.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.3.0-rc.0...@ceramicnetwork/core@5.3.0-rc.1) (2024-03-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.3.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.2.0...@ceramicnetwork/core@5.3.0-rc.0) (2024-03-07)


### Bug Fixes

* Include revocation phase out when checking for CACAO expirations ([#3174](https://github.com/ceramicnetwork/js-ceramic/issues/3174)) ([0ab5baf](https://github.com/ceramicnetwork/js-ceramic/commit/0ab5bafec84098d703df9c05f154ca5b280c80c0))





# [5.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.2.0-rc.0...@ceramicnetwork/core@5.2.0) (2024-02-27)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.1.0...@ceramicnetwork/core@5.2.0-rc.0) (2024-02-26)


### Features

* turn syncing tests on in recon mode  ([#3169](https://github.com/ceramicnetwork/js-ceramic/issues/3169)) ([394eebe](https://github.com/ceramicnetwork/js-ceramic/commit/394eebe5e5ebf6c9e866fe93bd9c6e12f44a6175))





# [5.1.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.1.0-rc.1...@ceramicnetwork/core@5.1.0) (2024-02-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.1.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.1.0-rc.0...@ceramicnetwork/core@5.1.0-rc.1) (2024-02-21)


### Bug Fixes

* AnchorProcessingLoop can process the same stream concurrently ([#3163](https://github.com/ceramicnetwork/js-ceramic/issues/3163)) ([ceee8a3](https://github.com/ceramicnetwork/js-ceramic/commit/ceee8a3e1b98293472b6a01220c45981df84ad9d))


### Features

* automatically register interest in the metamodel when using recon ([#3157](https://github.com/ceramicnetwork/js-ceramic/issues/3157)) ([242c833](https://github.com/ceramicnetwork/js-ceramic/commit/242c833541c1c6a530dcf39bd2b70fe2f0c4bc2d))
* create recon feed and consume events ([#3161](https://github.com/ceramicnetwork/js-ceramic/issues/3161)) ([0317921](https://github.com/ceramicnetwork/js-ceramic/commit/0317921e0ee52408bd3d303c4b5dbb53f70d483c))
* Keep ProcessingLoop full up to the concurrency limit ([#3167](https://github.com/ceramicnetwork/js-ceramic/issues/3167)) ([e486762](https://github.com/ceramicnetwork/js-ceramic/commit/e486762b504a7a38d7b17b10d506cb99ee7ad935))
* recon put events ([#3143](https://github.com/ceramicnetwork/js-ceramic/issues/3143)) ([7cd8dea](https://github.com/ceramicnetwork/js-ceramic/commit/7cd8deab4d4426a28a8b20504ac7709865e1be3b))
* turn on cross-node sync test in recon mode ([#3165](https://github.com/ceramicnetwork/js-ceramic/issues/3165)) ([e65c8b7](https://github.com/ceramicnetwork/js-ceramic/commit/e65c8b7af2ebaebe5a97fdec58f1ed3654691aba))





# [5.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.0.1-rc.0...@ceramicnetwork/core@5.1.0-rc.0) (2024-02-13)


### Bug Fixes

* Block ProcessingLoop when we've hit the concurrency limit of running tasks. ([#3158](https://github.com/ceramicnetwork/js-ceramic/issues/3158)) ([a64e8c5](https://github.com/ceramicnetwork/js-ceramic/commit/a64e8c5174a6f43744a4b23096bf827829435777))


### Features

* Disable anchoring when CERAMIC_RECON_MODE env var is set ([#3154](https://github.com/ceramicnetwork/js-ceramic/issues/3154)) ([0baa9dc](https://github.com/ceramicnetwork/js-ceramic/commit/0baa9dc1b9f9ab4ffe7312b77ae46f5bcf150a53))





## [5.0.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@5.0.0...@ceramicnetwork/core@5.0.1-rc.0) (2024-02-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [5.0.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@4.1.0...@ceramicnetwork/core@5.0.0) (2024-02-08)


### Bug Fixes

* Respect opts in multiquery with explicit genesis commit contents ([#3150](https://github.com/ceramicnetwork/js-ceramic/issues/3150)) ([91f2002](https://github.com/ceramicnetwork/js-ceramic/commit/91f2002f8c62a176ddb8346c4525dee7b4a8e9b7))


### Features

* Add CERAMIC_RECON_MODE env var that disables specific features ([#3121](https://github.com/ceramicnetwork/js-ceramic/issues/3121)) ([e1885de](https://github.com/ceramicnetwork/js-ceramic/commit/e1885deea27f96758d885a03d93d6b0de201d1e0))
* Add concurrency to ProcessingLoop ([#3153](https://github.com/ceramicnetwork/js-ceramic/issues/3153)) ([1a8fee2](https://github.com/ceramicnetwork/js-ceramic/commit/1a8fee2ac591267d25f5158b6aafce6e23170264))
* Add shouldIndex metadata flag ([#3146](https://github.com/ceramicnetwork/js-ceramic/issues/3146)) ([0ce377a](https://github.com/ceramicnetwork/js-ceramic/commit/0ce377af46a49d1fb3391b6fd2b4d2f72a93e58a))
* Fail incoming writes if the CAS has been consistently unavailable ([#3080](https://github.com/ceramicnetwork/js-ceramic/issues/3080)) ([2032f42](https://github.com/ceramicnetwork/js-ceramic/commit/2032f421597d2b8b61a96d561f312d5b25c4e44f))





# [4.1.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@4.1.0-rc.0...@ceramicnetwork/core@4.1.0) (2024-02-02)

**Note:** Version bump only for package @ceramicnetwork/core





# [4.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@4.0.0...@ceramicnetwork/core@4.1.0-rc.0) (2024-02-01)


### Features

* Bump major verison on all packages except common, core, and http-client ([#3139](https://github.com/ceramicnetwork/js-ceramic/issues/3139)) ([aafe0ef](https://github.com/ceramicnetwork/js-ceramic/commit/aafe0ef4187935ac7f842b3ed8c8a481e8d418bf))
* change all commitType name and values ([#3138](https://github.com/ceramicnetwork/js-ceramic/issues/3138)) ([39d521a](https://github.com/ceramicnetwork/js-ceramic/commit/39d521a9a671964f10b8aff5585a22218c39a0d6))





# [5.0.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@4.0.0...@ceramicnetwork/core@5.0.0) (2024-02-01)

**Note:** Version bump only for package @ceramicnetwork/core





# [4.0.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@4.0.0-rc.1...@ceramicnetwork/core@4.0.0) (2024-01-31)

**Note:** Version bump only for package @ceramicnetwork/core





# [4.0.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.4.0-rc.0...@ceramicnetwork/core@4.0.0-rc.1) (2024-01-30)


### Bug Fixes

* Don't attempt to close Ceramic if it never finished initializing ([#3118](https://github.com/ceramicnetwork/js-ceramic/issues/3118)) ([6147879](https://github.com/ceramicnetwork/js-ceramic/commit/61478793d2291f85f9ec7c4c4dc222b99e77cab4))





# [3.4.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.2.0...@ceramicnetwork/core@3.4.0-rc.0) (2024-01-25)


### Bug Fixes

* Always update the StateStore from within the ExecutionQueue ([#3073](https://github.com/ceramicnetwork/js-ceramic/issues/3073)) ([17d77ca](https://github.com/ceramicnetwork/js-ceramic/commit/17d77ca29b8c52e24750b5906107ccb9375438e7))
* await stop ([#3106](https://github.com/ceramicnetwork/js-ceramic/issues/3106)) ([2d7d354](https://github.com/ceramicnetwork/js-ceramic/commit/2d7d354cf9a3147ab9e2432653e03a69610cdc51))
* **core:** Use the anchor proof chain id to verify the anchor proof ([#3098](https://github.com/ceramicnetwork/js-ceramic/issues/3098)) ([55b8dff](https://github.com/ceramicnetwork/js-ceramic/commit/55b8dffe52cd475799b37da9fc439b2823a591ca))
* Limit scope of what's in a queue ([#3102](https://github.com/ceramicnetwork/js-ceramic/issues/3102)) ([83320f8](https://github.com/ceramicnetwork/js-ceramic/commit/83320f8911a1697bec6733017af7ff9f07469a51))
* Make AnchorRequestStore processing loop more robust ([#3066](https://github.com/ceramicnetwork/js-ceramic/issues/3066)) ([a864739](https://github.com/ceramicnetwork/js-ceramic/commit/a8647395579eb9ca57e0239999191b21f5a1a9fc))
* make Repository.fromMemoryOrStore safe by default ([#3072](https://github.com/ceramicnetwork/js-ceramic/issues/3072)) ([a444125](https://github.com/ceramicnetwork/js-ceramic/commit/a4441253d6dd874f92b4eed8c19a672cc5e16990))
* register new running state ([#3074](https://github.com/ceramicnetwork/js-ceramic/issues/3074)) ([e4fe604](https://github.com/ceramicnetwork/js-ceramic/commit/e4fe6048c2875a9809488217c113e4823c294df8))
* Update state store if loading at a commit that is ahead of what we currently have ([#3097](https://github.com/ceramicnetwork/js-ceramic/issues/3097)) ([8804c99](https://github.com/ceramicnetwork/js-ceramic/commit/8804c99c02e9872cfcd5d5a24507f39b43868c3f))


### Features

* Timeout fetching batches from the AnchorRequestStore ([#3083](https://github.com/ceramicnetwork/js-ceramic/issues/3083)) ([e7706df](https://github.com/ceramicnetwork/js-ceramic/commit/e7706df2a57e8bc5f1fbdd3b17a898edd7b93d63))





# [3.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.2.0...@ceramicnetwork/core@3.3.0) (2024-01-25)


### Bug Fixes

* Always update the StateStore from within the ExecutionQueue ([#3073](https://github.com/ceramicnetwork/js-ceramic/issues/3073)) ([17d77ca](https://github.com/ceramicnetwork/js-ceramic/commit/17d77ca29b8c52e24750b5906107ccb9375438e7))
* await stop ([#3106](https://github.com/ceramicnetwork/js-ceramic/issues/3106)) ([2d7d354](https://github.com/ceramicnetwork/js-ceramic/commit/2d7d354cf9a3147ab9e2432653e03a69610cdc51))
* **core:** Use the anchor proof chain id to verify the anchor proof ([#3098](https://github.com/ceramicnetwork/js-ceramic/issues/3098)) ([55b8dff](https://github.com/ceramicnetwork/js-ceramic/commit/55b8dffe52cd475799b37da9fc439b2823a591ca))
* Limit scope of what's in a queue ([#3102](https://github.com/ceramicnetwork/js-ceramic/issues/3102)) ([83320f8](https://github.com/ceramicnetwork/js-ceramic/commit/83320f8911a1697bec6733017af7ff9f07469a51))
* Make AnchorRequestStore processing loop more robust ([#3066](https://github.com/ceramicnetwork/js-ceramic/issues/3066)) ([a864739](https://github.com/ceramicnetwork/js-ceramic/commit/a8647395579eb9ca57e0239999191b21f5a1a9fc))
* make Repository.fromMemoryOrStore safe by default ([#3072](https://github.com/ceramicnetwork/js-ceramic/issues/3072)) ([a444125](https://github.com/ceramicnetwork/js-ceramic/commit/a4441253d6dd874f92b4eed8c19a672cc5e16990))
* register new running state ([#3074](https://github.com/ceramicnetwork/js-ceramic/issues/3074)) ([e4fe604](https://github.com/ceramicnetwork/js-ceramic/commit/e4fe6048c2875a9809488217c113e4823c294df8))
* Update state store if loading at a commit that is ahead of what we currently have ([#3097](https://github.com/ceramicnetwork/js-ceramic/issues/3097)) ([8804c99](https://github.com/ceramicnetwork/js-ceramic/commit/8804c99c02e9872cfcd5d5a24507f39b43868c3f))


### Features

* Timeout fetching batches from the AnchorRequestStore ([#3083](https://github.com/ceramicnetwork/js-ceramic/issues/3083)) ([e7706df](https://github.com/ceramicnetwork/js-ceramic/commit/e7706df2a57e8bc5f1fbdd3b17a898edd7b93d63))





# [3.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.2.0-rc.0...@ceramicnetwork/core@3.2.0) (2023-12-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [3.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.1.0...@ceramicnetwork/core@3.2.0-rc.0) (2023-12-07)


### Bug Fixes

* Clean up anchor request store even if stream is already anchored ([#3053](https://github.com/ceramicnetwork/js-ceramic/issues/3053)) ([c3dc51f](https://github.com/ceramicnetwork/js-ceramic/commit/c3dc51fd712b213687559e5ebdbd2c49ec527ca1))
* Clear out AnchorRequestStore for requests that were anchored several commits ago ([#3055](https://github.com/ceramicnetwork/js-ceramic/issues/3055)) ([85f8a79](https://github.com/ceramicnetwork/js-ceramic/commit/85f8a790df1916971e4bfafd9120132e64bf0899))
* Update state store after applying update ([#3052](https://github.com/ceramicnetwork/js-ceramic/issues/3052)) ([d2db904](https://github.com/ceramicnetwork/js-ceramic/commit/d2db9045403472b490a2a4ac268538532a19e759))





# [3.1.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.1.0-rc.0...@ceramicnetwork/core@3.1.0) (2023-12-06)

**Note:** Version bump only for package @ceramicnetwork/core





# [3.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.0.4...@ceramicnetwork/core@3.1.0-rc.0) (2023-12-01)


### Bug Fixes

* Don't initialize Repository before Ceramic ([#3045](https://github.com/ceramicnetwork/js-ceramic/issues/3045)) ([c61623e](https://github.com/ceramicnetwork/js-ceramic/commit/c61623e9761872070fa86768137d9286ba54cf2b))
* gateway flag is broken ([#3044](https://github.com/ceramicnetwork/js-ceramic/issues/3044)) ([c1c5c50](https://github.com/ceramicnetwork/js-ceramic/commit/c1c5c50c35246cd9e4e812edda9d0bc7cf154ab7))





## [3.0.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.0.2...@ceramicnetwork/core@3.0.4) (2023-11-16)

**Note:** Version bump only for package @ceramicnetwork/core





## [3.0.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.0.0...@ceramicnetwork/core@3.0.2) (2023-11-16)

**Note:** Version bump only for package @ceramicnetwork/core





# [3.0.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@3.0.0-rc.0...@ceramicnetwork/core@3.0.0) (2023-11-16)

**Note:** Version bump only for package @ceramicnetwork/core





# [3.0.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.46.0...@ceramicnetwork/core@3.0.0-rc.0) (2023-11-10)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.46.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.46.0-rc.1...@ceramicnetwork/core@2.46.0) (2023-11-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.46.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.46.0-rc.0...@ceramicnetwork/core@2.46.0-rc.1) (2023-11-06)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.46.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.45.0...@ceramicnetwork/core@2.46.0-rc.0) (2023-11-02)


### Features

* rust ceramic tests ([#2965](https://github.com/ceramicnetwork/js-ceramic/issues/2965)) ([e6bbb11](https://github.com/ceramicnetwork/js-ceramic/commit/e6bbb11fe124d71ddfc5aabb73bf260a437ee707))





# [2.45.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.45.0-rc.2...@ceramicnetwork/core@2.45.0) (2023-10-26)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.45.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.45.0-rc.1...@ceramicnetwork/core@2.45.0-rc.2) (2023-10-25)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.45.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.45.0-rc.0...@ceramicnetwork/core@2.45.0-rc.1) (2023-10-20)


### Features

* **3id-did-resolver, anchor-listener, anchor-utils, blockchain-utils-linking, blockchain-utils-validation, cli, codecs, common, core, http-client, indexing, ipfs-daemon, ipfs-topology, job-queue, logger, pinning-aggregation, pinning-crust-backend, pinning-ipfs-backend, pinning-powergate-backend, stream-caip10-link, stream-caip10-link-handler, stream-handler-common, stream-model, stream-model-handler, stream-model-instance, stream-model-instance-handler, stream-tests, stream-tile, stream-tile-handler, streamid:** upgrade to node 20 and add engine ([#3003](https://github.com/ceramicnetwork/js-ceramic/issues/3003)) ([aae5ccd](https://github.com/ceramicnetwork/js-ceramic/commit/aae5ccdcec3009e411098df434a6e29b935b74fd))


### Reverts

* Revert "feat(3id-did-resolver, anchor-listener, anchor-utils, blockchain-utils-linking, blockchain-utils-validation, cli, codecs, common, core, http-client, indexing, ipfs-daemon, ipfs-topology, job-queue, logger, pinning-aggregation, pinning-crust-backend, pinning-ipfs-backend, pinning-powergate-backend, stream-caip10-link, stream-caip10-link-handler, stream-handler-common, stream-model, stream-model-handler, stream-model-instance, stream-model-instance-handler, stream-tests, stream-tile, stream-tile-handler, streamid): upgrade to node 20 and add engine (#3003)" (#3005) ([81b525a](https://github.com/ceramicnetwork/js-ceramic/commit/81b525afbaff04060aa1b6aaed1faf3c5bb8fa81)), closes [#3003](https://github.com/ceramicnetwork/js-ceramic/issues/3003) [#3005](https://github.com/ceramicnetwork/js-ceramic/issues/3005)





# [2.45.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.44.0...@ceramicnetwork/core@2.45.0-rc.0) (2023-10-19)


### Bug Fixes

* Fix calculation on number of eth blocks in 24 hours ([#3000](https://github.com/ceramicnetwork/js-ceramic/issues/3000)) ([18bb1ce](https://github.com/ceramicnetwork/js-ceramic/commit/18bb1ce3c61bd05a697099d70d367b3b9df0a80d))


### Features

* **core, anchor-utils:** sync start block 24 hours before model anchor ([#2881](https://github.com/ceramicnetwork/js-ceramic/issues/2881)) ([2d62e6c](https://github.com/ceramicnetwork/js-ceramic/commit/2d62e6c5bfb95fe44b28af6b76f854c4925a3b73))
* **indexing,stream-model:** Indexing logic for interfaces ([#2972](https://github.com/ceramicnetwork/js-ceramic/issues/2972)) ([6f1b8b9](https://github.com/ceramicnetwork/js-ceramic/commit/6f1b8b9bb03428766b0da2851d2f37e9bc45e5c4))
* Remove InternalOpts ([#2996](https://github.com/ceramicnetwork/js-ceramic/issues/2996)) ([24ab567](https://github.com/ceramicnetwork/js-ceramic/commit/24ab567bcb3ae1bd13b2f3556c90048f1319ea3d))





# [2.44.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.44.0-rc.0...@ceramicnetwork/core@2.44.0) (2023-10-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.44.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.43.0...@ceramicnetwork/core@2.44.0-rc.0) (2023-10-11)


### Features

* Update loading at a CommitID to use the StreamLoader ([#2967](https://github.com/ceramicnetwork/js-ceramic/issues/2967)) ([c6318ba](https://github.com/ceramicnetwork/js-ceramic/commit/c6318bab01d9023d50378e9ade3df20bb014af18))
* Use StreamLoader for loading streams ([#2963](https://github.com/ceramicnetwork/js-ceramic/issues/2963)) ([ca6c3ef](https://github.com/ceramicnetwork/js-ceramic/commit/ca6c3ef117c4377bab297e83bd250b238dcd4c5c))
* Use StreamUpdater for processing tips from the network ([#2982](https://github.com/ceramicnetwork/js-ceramic/issues/2982)) ([62bc7cb](https://github.com/ceramicnetwork/js-ceramic/commit/62bc7cbdef356e32768282d09c1c96409142b16a))





# [2.43.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.43.0-rc.0...@ceramicnetwork/core@2.43.0) (2023-10-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.43.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.42.0...@ceramicnetwork/core@2.43.0-rc.0) (2023-09-20)


### Bug Fixes

* Do not start subscription until repository is ready ([#2957](https://github.com/ceramicnetwork/js-ceramic/issues/2957)) ([009aabe](https://github.com/ceramicnetwork/js-ceramic/commit/009aabeea4c83556ab8c79cc194b3def718d7ebc))
* Fix StreamLoader test ([#2966](https://github.com/ceramicnetwork/js-ceramic/issues/2966)) ([1d8da07](https://github.com/ceramicnetwork/js-ceramic/commit/1d8da077599028159a1f975ddfcdfa9503cbff5a))


### Features

* Make StreamLoader consider multiple tip responses when syncing a stream ([#2962](https://github.com/ceramicnetwork/js-ceramic/issues/2962)) ([07019aa](https://github.com/ceramicnetwork/js-ceramic/commit/07019aadcb9b671f1246fbcc2dc163402a5b447f))





# [2.42.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.42.0-rc.0...@ceramicnetwork/core@2.42.0) (2023-09-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.42.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.41.0...@ceramicnetwork/core@2.42.0-rc.0) (2023-09-14)


### Features

* Add functionality to StreamLoader to load at a CommitID ([#2950](https://github.com/ceramicnetwork/js-ceramic/issues/2950)) ([8103038](https://github.com/ceramicnetwork/js-ceramic/commit/8103038ac2cca172470ca82778225a6ef2045385))
* Add StreamUpdater to handle applying incoming commits ([#2953](https://github.com/ceramicnetwork/js-ceramic/issues/2953)) ([21c4df6](https://github.com/ceramicnetwork/js-ceramic/commit/21c4df615cd68f7b563435580e5488cf64e639a1))
* Implement StateManipulator with cleaner, more efficient conflict resolution ([#2946](https://github.com/ceramicnetwork/js-ceramic/issues/2946)) ([510e811](https://github.com/ceramicnetwork/js-ceramic/commit/510e811392dfe1e4f2223113fca8cf459c1b91e3))





# [2.41.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.41.0-rc.1...@ceramicnetwork/core@2.41.0) (2023-09-14)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.41.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.41.0-rc.0...@ceramicnetwork/core@2.41.0-rc.1) (2023-09-12)


### Features

* **core, cli, stream-tests:** Add support for filters in count ([cef2139](https://github.com/ceramicnetwork/js-ceramic/commit/cef21396e170f5cf72260ad28520c0e91177ccb1))





# [2.41.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.40.0...@ceramicnetwork/core@2.41.0-rc.0) (2023-09-06)


### Bug Fixes

* Await pubsub subscription in tip fetcher test ([#2938](https://github.com/ceramicnetwork/js-ceramic/issues/2938)) ([c0a47d4](https://github.com/ceramicnetwork/js-ceramic/commit/c0a47d42e0353d8cf21ec1373ca3e654c3630905))
* Do not publish tip when loading from genesis ([#2933](https://github.com/ceramicnetwork/js-ceramic/issues/2933)) ([120bfd0](https://github.com/ceramicnetwork/js-ceramic/commit/120bfd0f4a7f36fab58633eba33ee1bb1695376e))


### Features

* **core:** Implement LogSyncer ([#2932](https://github.com/ceramicnetwork/js-ceramic/issues/2932)) ([886b60d](https://github.com/ceramicnetwork/js-ceramic/commit/886b60d3b5715e465e390f0e3675e7b042c1c047))
* **core:** Implement TipFetcher ([#2930](https://github.com/ceramicnetwork/js-ceramic/issues/2930)) ([db2fdd2](https://github.com/ceramicnetwork/js-ceramic/commit/db2fdd23fa3e949c1e4f7787d5bfc1c5786ebb6b))
* Report number of pending anchors in metrics and nodeStatus output ([#2918](https://github.com/ceramicnetwork/js-ceramic/issues/2918)) ([c93bb2a](https://github.com/ceramicnetwork/js-ceramic/commit/c93bb2afe6e346e160ba4911c2a94fdd380de52b))





# [2.40.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.40.0-rc.1...@ceramicnetwork/core@2.40.0) (2023-08-28)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.40.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.40.0-rc.0...@ceramicnetwork/core@2.40.0-rc.1) (2023-08-25)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.40.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.39.0...@ceramicnetwork/core@2.40.0-rc.0) (2023-08-23)


### Bug Fixes

* Slow down rate of restoring polling for streams with pending anchors ([#2912](https://github.com/ceramicnetwork/js-ceramic/issues/2912)) ([442d2e4](https://github.com/ceramicnetwork/js-ceramic/commit/442d2e4294b2bea76dec99895cf14e492585a620))


### Features

* Add option to wait until anchor requests are durably created on the CAS ([#2907](https://github.com/ceramicnetwork/js-ceramic/issues/2907)) ([a36ebf7](https://github.com/ceramicnetwork/js-ceramic/commit/a36ebf72b1701836a3360fb30ba935a265d0aeda))
* **core, stream-tests:** negated ors/ands and multiple keys/values with where filters ([#2916](https://github.com/ceramicnetwork/js-ceramic/issues/2916)) ([9ac0ba9](https://github.com/ceramicnetwork/js-ceramic/commit/9ac0ba99c9219163a391ffcbc8c5c42745f9dad5))





# [2.39.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.39.0-rc.1...@ceramicnetwork/core@2.39.0) (2023-08-23)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.39.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.39.0-rc.0...@ceramicnetwork/core@2.39.0-rc.1) (2023-08-17)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.39.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.38.0...@ceramicnetwork/core@2.39.0-rc.0) (2023-08-16)


### Bug Fixes

* **core:** fix anchor retry logic ([#2865](https://github.com/ceramicnetwork/js-ceramic/issues/2865)) ([95d57ef](https://github.com/ceramicnetwork/js-ceramic/commit/95d57ef0905d65ff882ab27016b57703a2bd7326))
* **core:** limit IPFS load of HDS sync ([#2889](https://github.com/ceramicnetwork/js-ceramic/issues/2889)) ([4c6eae6](https://github.com/ceramicnetwork/js-ceramic/commit/4c6eae67fca9ef1ebdf80e99c7921e747eccd3a5))
* **core:** send anchor status request once every poll interval ([#2884](https://github.com/ceramicnetwork/js-ceramic/issues/2884)) ([f9dafae](https://github.com/ceramicnetwork/js-ceramic/commit/f9dafae9c2ef69be6a56487807b2be625c6bd9fc))





# [2.38.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.38.0-rc.2...@ceramicnetwork/core@2.38.0) (2023-08-16)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.38.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.38.0-rc.1...@ceramicnetwork/core@2.38.0-rc.2) (2023-08-11)


### Bug Fixes

* **core:** String in query values should be escaped ([#2891](https://github.com/ceramicnetwork/js-ceramic/issues/2891)) ([6bd02d7](https://github.com/ceramicnetwork/js-ceramic/commit/6bd02d77701b1f6195495ba994847dade7938a61))


### Features

* Add config option to disable data fetching in IPFS ([#2888](https://github.com/ceramicnetwork/js-ceramic/issues/2888)) ([ae87750](https://github.com/ceramicnetwork/js-ceramic/commit/ae87750f5d03f322114cb48ead4d03a860a175fe))





# [2.38.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.38.0-rc.0...@ceramicnetwork/core@2.38.0-rc.1) (2023-08-09)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.38.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.37.0...@ceramicnetwork/core@2.38.0-rc.0) (2023-08-07)


### Features

* **core:** query results ordering on custom fields ([#2864](https://github.com/ceramicnetwork/js-ceramic/issues/2864)) ([d56a13f](https://github.com/ceramicnetwork/js-ceramic/commit/d56a13f0ce25983f5a60e2a78816843e56c4fda2))





# [2.37.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.37.0-rc.3...@ceramicnetwork/core@2.37.0) (2023-07-31)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.37.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.37.0-rc.2...@ceramicnetwork/core@2.37.0-rc.3) (2023-07-26)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.37.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.37.0-rc.1...@ceramicnetwork/core@2.37.0-rc.2) (2023-07-26)


### Bug Fixes

* **core:** empty sync statuses ([#2872](https://github.com/ceramicnetwork/js-ceramic/issues/2872)) ([a3e78db](https://github.com/ceramicnetwork/js-ceramic/commit/a3e78dbd773d2e8d8fb0f10cea0ae47295ec41cd))
* **core:** Fix CAS DID-auth ([#2873](https://github.com/ceramicnetwork/js-ceramic/issues/2873)) ([879f401](https://github.com/ceramicnetwork/js-ceramic/commit/879f401d5405f861226dd5be023eb58ff65d9120))





# [2.37.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.37.0-rc.0...@ceramicnetwork/core@2.37.0-rc.1) (2023-07-24)


### Bug Fixes

* **core:** Loading at an AnchorCommit should be able to inform node that CACAO is not actually expired ([#2868](https://github.com/ceramicnetwork/js-ceramic/issues/2868)) ([35ada9e](https://github.com/ceramicnetwork/js-ceramic/commit/35ada9e722991364d332ec87f53d42972241e910))
* Do not stop polling for anchor result on a network error ([#2869](https://github.com/ceramicnetwork/js-ceramic/issues/2869)) ([07ff4e5](https://github.com/ceramicnetwork/js-ceramic/commit/07ff4e5b0558fd3ae6069c2fe2bdff5c6de69306))


### Features

* add metrics for caching and syncing ([#2866](https://github.com/ceramicnetwork/js-ceramic/issues/2866)) ([1c3118b](https://github.com/ceramicnetwork/js-ceramic/commit/1c3118bb131dfe395cc49e755eaa1c01dadbbbfb))
* Add scarf ([#2870](https://github.com/ceramicnetwork/js-ceramic/issues/2870)) ([1c2efa0](https://github.com/ceramicnetwork/js-ceramic/commit/1c2efa0b2db3a74fd64b49d4924fe5eb3c74d1fa))


### Reverts

* Revert "chore: Make CAR file required (#2849)" ([cbae060](https://github.com/ceramicnetwork/js-ceramic/commit/cbae060a6f5642ff098566c35d7d6bd03c5a5959)), closes [#2849](https://github.com/ceramicnetwork/js-ceramic/issues/2849)





# [2.37.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.36.0...@ceramicnetwork/core@2.37.0-rc.0) (2023-07-13)


### Features

* CDB-2493 Adjust API to support model index changes ([#2844](https://github.com/ceramicnetwork/js-ceramic/issues/2844)) ([13e7a9f](https://github.com/ceramicnetwork/js-ceramic/commit/13e7a9f52fdb824d97966c4df88e3db1fcd16428))
* **core:** CDB 2492 Add database indices for model fields ([#2845](https://github.com/ceramicnetwork/js-ceramic/issues/2845)) ([5ef6dba](https://github.com/ceramicnetwork/js-ceramic/commit/5ef6dbac58258718e3fb108c7fefedf899441591))
* **core:** CDB-2535 Implement query filters for database queries ([#2842](https://github.com/ceramicnetwork/js-ceramic/issues/2842)) ([67f3de1](https://github.com/ceramicnetwork/js-ceramic/commit/67f3de190950db032cc68cd06e902d9fccda0d6e))
* Send ipfs version in a keepalive message ([#2848](https://github.com/ceramicnetwork/js-ceramic/issues/2848)) ([8098cff](https://github.com/ceramicnetwork/js-ceramic/commit/8098cff5b1bcd71a407c09db4b1cf00849fb9590))





# [2.36.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.36.0-rc.0...@ceramicnetwork/core@2.36.0) (2023-07-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.36.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.35.0-rc.0...@ceramicnetwork/core@2.36.0-rc.0) (2023-06-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.35.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.34.0-rc.0...@ceramicnetwork/core@2.35.0-rc.0) (2023-06-19)


### Features

* Add CAS Response as a codec ([#2838](https://github.com/ceramicnetwork/js-ceramic/issues/2838)) ([346a359](https://github.com/ceramicnetwork/js-ceramic/commit/346a359a978328d155e3dfa1a44f59946435dd9c))
* Add loadOpts to MultiQuery ([#2768](https://github.com/ceramicnetwork/js-ceramic/issues/2768)) ([c609c23](https://github.com/ceramicnetwork/js-ceramic/commit/c609c23e808e659d79e2a8bbc5dcdf80cab88e19))





# [2.34.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.33.0...@ceramicnetwork/core@2.34.0-rc.0) (2023-06-01)


### Features

* **core:** finalize block threshold for switch to smart contract anchoring ([#2830](https://github.com/ceramicnetwork/js-ceramic/issues/2830)) ([affc665](https://github.com/ceramicnetwork/js-ceramic/commit/affc665fa1d73e45a2a695d63fb913521484c4d0))
* **core:** store CAR files that come back from CAS ([#2828](https://github.com/ceramicnetwork/js-ceramic/issues/2828)) ([45440ca](https://github.com/ceramicnetwork/js-ceramic/commit/45440cad18d7eb89e1b5c0838cb1df6b96bbe754))





# [2.33.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.33.0-rc.0...@ceramicnetwork/core@2.33.0) (2023-06-01)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.33.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.32.0...@ceramicnetwork/core@2.33.0-rc.0) (2023-05-24)


### Features

* **core:** Use codecs for pubsub ([#2822](https://github.com/ceramicnetwork/js-ceramic/issues/2822)) ([7797603](https://github.com/ceramicnetwork/js-ceramic/commit/7797603da9bdddb4176f6eaaf3d0581c0801683f))
* Less calls to IPFS node ([#2820](https://github.com/ceramicnetwork/js-ceramic/issues/2820)) ([74b92bb](https://github.com/ceramicnetwork/js-ceramic/commit/74b92bb746fbe2cd2957724e9a831a7ca7fed34d))





# [2.32.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.32.0-rc.0...@ceramicnetwork/core@2.32.0) (2023-05-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.32.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.31.0...@ceramicnetwork/core@2.32.0-rc.0) (2023-04-26)


### Features

* add composeDB section to node status endpoint ([#2787](https://github.com/ceramicnetwork/js-ceramic/issues/2787)) ([4025aee](https://github.com/ceramicnetwork/js-ceramic/commit/4025aee935c5727fc65ef4cf765b8a0fbadc9b14))





# [2.31.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.31.0-rc.0...@ceramicnetwork/core@2.31.0) (2023-03-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.31.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.30.0...@ceramicnetwork/core@2.31.0-rc.0) (2023-03-16)


### Features

* Change MID content in the indexing DB on update ([#2770](https://github.com/ceramicnetwork/js-ceramic/issues/2770)) ([ce7f401](https://github.com/ceramicnetwork/js-ceramic/commit/ce7f40104479613548f8adc5d4d1ab434df9bc1c))





# [2.30.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.30.0-rc.0...@ceramicnetwork/core@2.30.0) (2023-02-28)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.30.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.29.0...@ceramicnetwork/core@2.30.0-rc.0) (2023-02-28)


### Bug Fixes

* If config.indexing is absent, do not expect enableHistoricalSync ([#2767](https://github.com/ceramicnetwork/js-ceramic/issues/2767)) ([7942f75](https://github.com/ceramicnetwork/js-ceramic/commit/7942f757b024b316402f73a49421524b2074d956))





# [2.29.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.29.0-rc.0...@ceramicnetwork/core@2.29.0) (2023-02-28)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.29.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.28.0-rc.0...@ceramicnetwork/core@2.29.0-rc.0) (2023-02-28)


### Bug Fixes

* **core, anchor-listener:** fix hds bugs ([#2765](https://github.com/ceramicnetwork/js-ceramic/issues/2765)) ([c346c6c](https://github.com/ceramicnetwork/js-ceramic/commit/c346c6cbc34c41207fb27e12cef2e3e6fc1cbd10))
* **core:** warn instead of throw on pin opts for stream crud ([#2764](https://github.com/ceramicnetwork/js-ceramic/issues/2764) ([4ecfbc1](https://github.com/ceramicnetwork/js-ceramic/commit/4ecfbc1442fa098bfacdfb7488d5d59525288650))





# [2.28.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.27.0-rc.0...@ceramicnetwork/core@2.28.0-rc.0) (2023-02-27)


### Bug Fixes

* added disallow HDS with SQLite check ([#2749](https://github.com/ceramicnetwork/js-ceramic/issues/2749)) ([2a560da](https://github.com/ceramicnetwork/js-ceramic/commit/2a560da80385b03253a3ff1895a8e5802cc65311))
* Disallow pinning and unpinning through CRUD APIs ([#2750](https://github.com/ceramicnetwork/js-ceramic/issues/2750)) ([25d9ebf](https://github.com/ceramicnetwork/js-ceramic/commit/25d9ebfdc8017274ed4dde3ed11e0248c5019f5c))


### Features

* **cli, core:** add sync worker flag to config file with default values ([#2757](https://github.com/ceramicnetwork/js-ceramic/issues/2757)) ([5375c88](https://github.com/ceramicnetwork/js-ceramic/commit/5375c886ecf58fa646ab3afe0796b0d2edc17af4))





# [2.27.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.26.0-rc.0...@ceramicnetwork/core@2.27.0-rc.0) (2023-02-24)


### Features

* Bump IPFS/IPLD deps ([#2746](https://github.com/ceramicnetwork/js-ceramic/issues/2746)) ([ef23e50](https://github.com/ceramicnetwork/js-ceramic/commit/ef23e509556f32e6b1f6c1ed6f87116a3bc7e26a))





# [2.26.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.25.0...@ceramicnetwork/core@2.26.0-rc.0) (2023-02-23)


### Bug Fixes

* **anchor-listener, core:** batch get logs ([#2710](https://github.com/ceramicnetwork/js-ceramic/issues/2710)) ([c6fcaae](https://github.com/ceramicnetwork/js-ceramic/commit/c6fcaae5fdd807d913432df7f238dc7fa496a0c6))
* **core, anchor-utils, anchor-listener:** change defaults ([#2721](https://github.com/ceramicnetwork/js-ceramic/issues/2721)) ([4fd6c24](https://github.com/ceramicnetwork/js-ceramic/commit/4fd6c24cd968aa91a10145b45e7d42e74bf6781e))
* **core:** do not expect link when we retrieve the commit when rebuilding the anchor ([#2723](https://github.com/ceramicnetwork/js-ceramic/issues/2723)) ([4fce3b2](https://github.com/ceramicnetwork/js-ceramic/commit/4fce3b2f5fc3040cd8290ebf9476ed25034e2a09))
* **core:** logging and job queue ([#2739](https://github.com/ceramicnetwork/js-ceramic/issues/2739)) ([52b7d2c](https://github.com/ceramicnetwork/js-ceramic/commit/52b7d2cbd86e59a10093c85a78dd8aa1efbbbb2d))
* fix postgresql database url not accepted ([#2737](https://github.com/ceramicnetwork/js-ceramic/issues/2737)) ([c1bab2c](https://github.com/ceramicnetwork/js-ceramic/commit/c1bab2cd2d2ecb77cfb1893d6b63cb82cffb0f2c))
* re-indexing error on startup ([#2738](https://github.com/ceramicnetwork/js-ceramic/issues/2738)) ([15d54ba](https://github.com/ceramicnetwork/js-ceramic/commit/15d54bae6a3b28539d37b5463224582f57f4b910))


### Features

* **cli,http-client:** Add node status admin API endpoint skeleton ([#2713](https://github.com/ceramicnetwork/js-ceramic/issues/2713)) ([124b0da](https://github.com/ceramicnetwork/js-ceramic/commit/124b0da6c0c8f17ad7eb254a27eacd61b598cc98))
* **core:** add logging to syncing ([#2712](https://github.com/ceramicnetwork/js-ceramic/issues/2712)) ([b8caa1d](https://github.com/ceramicnetwork/js-ceramic/commit/b8caa1dedf9d0b84ff0a969ae5a5ec6fb6112e5a))
* **core:** Add stop model sync to admin api ([#2741](https://github.com/ceramicnetwork/js-ceramic/issues/2741)) ([3e294ec](https://github.com/ceramicnetwork/js-ceramic/commit/3e294ecd8db1e1085b582d6ad60cc010dfc9cc55))
* **core:** initial nodeStatus output ([#2715](https://github.com/ceramicnetwork/js-ceramic/issues/2715)) ([5ba3384](https://github.com/ceramicnetwork/js-ceramic/commit/5ba3384af4b2535a72a37324e7071117ec8c9d04))
* **core:** logging message for sync status ([#2733](https://github.com/ceramicnetwork/js-ceramic/issues/2733)) ([6a0479f](https://github.com/ceramicnetwork/js-ceramic/commit/6a0479f0552d42cb72b9f1cd10e7dd40472c80c2))
* **core:** separate continuous and history syncs ([#2722](https://github.com/ceramicnetwork/js-ceramic/issues/2722)) ([89c9c4d](https://github.com/ceramicnetwork/js-ceramic/commit/89c9c4d07d73a731fcad50adc46ba1654cef9f8f))
* Handle REPLACED status from CAS ([#2725](https://github.com/ceramicnetwork/js-ceramic/issues/2725)) ([87f0566](https://github.com/ceramicnetwork/js-ceramic/commit/87f056630354b60031a69872fc91621f3c82d07d))
* Pin access control ([#2735](https://github.com/ceramicnetwork/js-ceramic/issues/2735)) ([ee505ca](https://github.com/ceramicnetwork/js-ceramic/commit/ee505cad77113b64e93925bbbc6aa6b56de63fd2))





# [2.25.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.25.0-rc.0...@ceramicnetwork/core@2.25.0) (2023-02-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.25.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.24.0-rc.0...@ceramicnetwork/core@2.25.0-rc.0) (2023-02-16)


### Bug Fixes

* **core:** Always fail to index Models with incompatible versions ([#2709](https://github.com/ceramicnetwork/js-ceramic/issues/2709)) ([13f4bba](https://github.com/ceramicnetwork/js-ceramic/commit/13f4bbabf363fa1a19c14cec7078d68d015dd5aa))
* **core:** Update expected smart contract address ([#2720](https://github.com/ceramicnetwork/js-ceramic/issues/2720)) ([af7ae69](https://github.com/ceramicnetwork/js-ceramic/commit/af7ae69d5592b37cabf45a0dc2a9d683dac40ff8))





# [2.24.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.23.0...@ceramicnetwork/core@2.24.0-rc.0) (2023-02-13)


### Bug Fixes

* **core,cli:** pin version of p-queue library ([#2690](https://github.com/ceramicnetwork/js-ceramic/issues/2690)) ([bf3b6e6](https://github.com/ceramicnetwork/js-ceramic/commit/bf3b6e6bbe6eff8b20ad6cafe382ed09c884527c))
* **core:** job queue constructor needs logger ([#2681](https://github.com/ceramicnetwork/js-ceramic/issues/2681)) ([881a6a5](https://github.com/ceramicnetwork/js-ceramic/commit/881a6a51a17c487ce52b4bf67cf59d680078d00a))
* **core:** sync worker should not have a constant chainId ([#2699](https://github.com/ceramicnetwork/js-ceramic/issues/2699)) ([c038465](https://github.com/ceramicnetwork/js-ceramic/commit/c0384656ad3fb2cacd1ad7072459d929c99fe89d))


### Features

* **core:** add ability to update a job's data ([#2655](https://github.com/ceramicnetwork/js-ceramic/issues/2655)) ([c502c8a](https://github.com/ceramicnetwork/js-ceramic/commit/c502c8ab466b55a836035c7141d2a9e95baa0818))
* **core:** Add flag to skip publishing updates to pubsub ([#2680](https://github.com/ceramicnetwork/js-ceramic/issues/2680)) ([7703298](https://github.com/ceramicnetwork/js-ceramic/commit/77032983a879b4f438777c7911b21dd2e8801189))
* **core:** Add sync worker ([#2667](https://github.com/ceramicnetwork/js-ceramic/issues/2667)) ([1a8c432](https://github.com/ceramicnetwork/js-ceramic/commit/1a8c4324639ee05030d31181a6e882732ab7f545))
* **core:** Enable running ComposeDB on mainnet ([#2705](https://github.com/ceramicnetwork/js-ceramic/issues/2705)) ([682035b](https://github.com/ceramicnetwork/js-ceramic/commit/682035be992b9b4e0903d0f0db9389be90519c57))
* **core:** enable syncing on ceramic start ([#2693](https://github.com/ceramicnetwork/js-ceramic/issues/2693)) ([c744c6e](https://github.com/ceramicnetwork/js-ceramic/commit/c744c6e36cf7ca3af6ee1f5c20d9e3b32ad308d5))
* **core:** handle blocks reorganizations when creating sync jobs ([#2679](https://github.com/ceramicnetwork/js-ceramic/issues/2679)) ([ab04ed4](https://github.com/ceramicnetwork/js-ceramic/commit/ab04ed43dfc4d7a24cffc4b0876b3e56771f314e))
* **core:** Limit how many pin requests can be sent to ipfs at once ([#2683](https://github.com/ceramicnetwork/js-ceramic/issues/2683)) ([981a180](https://github.com/ceramicnetwork/js-ceramic/commit/981a180851384a1acb4bea5a8ff27b6e792a2326))
* **core:** make sync flag work ([#2697](https://github.com/ceramicnetwork/js-ceramic/issues/2697)) ([8cf3edf](https://github.com/ceramicnetwork/js-ceramic/commit/8cf3edf05eb4dad22e0ad34f1ffa846c39319ce5))
* **core:** Resumes active jobs on start of job queue ([#2673](https://github.com/ceramicnetwork/js-ceramic/issues/2673)) ([c84f0b6](https://github.com/ceramicnetwork/js-ceramic/commit/c84f0b6b7a3523a5da6b0eaf1ed62d57c593627b))
* **core:** set initial sync blocks ([#2695](https://github.com/ceramicnetwork/js-ceramic/issues/2695)) ([fbe19e0](https://github.com/ceramicnetwork/js-ceramic/commit/fbe19e05f3fba32bc6914c4e7a9976dd97e38b26))
* **core:** store indexing sync state ([#2658](https://github.com/ceramicnetwork/js-ceramic/issues/2658)) ([c7fd8b5](https://github.com/ceramicnetwork/js-ceramic/commit/c7fd8b584ba19ee3e286275737004d9630a17db3))
* **stream-model,stream-model-handler:** model definition versioning ([#2660](https://github.com/ceramicnetwork/js-ceramic/issues/2660)) ([6ccbbdd](https://github.com/ceramicnetwork/js-ceramic/commit/6ccbbdd4d9e028394c14c2c1ac755236a6c80008))





# [2.23.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.23.0-rc.1...@ceramicnetwork/core@2.23.0) (2023-01-23)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.23.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.23.0-rc.0...@ceramicnetwork/core@2.23.0-rc.1) (2023-01-20)


### Features

* **core:** Add SyncOption to resync stream on error ([#2661](https://github.com/ceramicnetwork/js-ceramic/issues/2661)) ([d4fdf7b](https://github.com/ceramicnetwork/js-ceramic/commit/d4fdf7bb676db90178293170f9cbd07cdfeed6b9))


### Reverts

* Revert "chore(core): prefix columns for user-defined fields (#2549)" ([f7d37f0](https://github.com/ceramicnetwork/js-ceramic/commit/f7d37f01b880ad0980398c704181f5cd9c05a547)), closes [#2549](https://github.com/ceramicnetwork/js-ceramic/issues/2549)





# [2.23.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.22.0-rc.0...@ceramicnetwork/core@2.23.0-rc.0) (2023-01-18)


### Features

* **core:** create rebuild anchor worker ([#2646](https://github.com/ceramicnetwork/js-ceramic/issues/2646)) ([7d759c7](https://github.com/ceramicnetwork/js-ceramic/commit/7d759c787b21874d5b2a390d38539e2ba9c717d2))
* **core:** merkle tree leaf loader ([#2639](https://github.com/ceramicnetwork/js-ceramic/issues/2639)) ([7077512](https://github.com/ceramicnetwork/js-ceramic/commit/70775123f37b9aa7eadb635ffb369138aedd9947))





# [2.22.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.21.0...@ceramicnetwork/core@2.22.0-rc.0) (2023-01-11)


### Bug Fixes

* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* bump version on mapmoize package ([#2629](https://github.com/ceramicnetwork/js-ceramic/issues/2629)) ([78b668f](https://github.com/ceramicnetwork/js-ceramic/commit/78b668feeef0f563e1f8f6a1773a7c9af467bdde))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** fix metrics import and dependency ([#2227](https://github.com/ceramicnetwork/js-ceramic/issues/2227)) ([c418347](https://github.com/ceramicnetwork/js-ceramic/commit/c4183476a53aedb23edba7f2e2dd1c456d1f1ba8))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different ([#2479](https://github.com/ceramicnetwork/js-ceramic/issues/2479)) ([d83c739](https://github.com/ceramicnetwork/js-ceramic/commit/d83c739ef6e5679da485363db8bc477ec1d39540))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([319adf2](https://github.com/ceramicnetwork/js-ceramic/commit/319adf2f9c7e2575c114ce8ae05864f0c8e0eeb4))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow fast-forward of a stream state if newer commit is anchored ([#2398](https://github.com/ceramicnetwork/js-ceramic/issues/2398)) ([d4085aa](https://github.com/ceramicnetwork/js-ceramic/commit/d4085aa3410443102d79ad7322b7aa503cab3871))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** anchor proofs use txType instead of version - CDB-2074 ([#2565](https://github.com/ceramicnetwork/js-ceramic/issues/2565)) ([bed5161](https://github.com/ceramicnetwork/js-ceramic/commit/bed51611244b3fcd3880743c309440728ff08573))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Creating a stream via a multiquery should pin it ([#2236](https://github.com/ceramicnetwork/js-ceramic/issues/2236)) ([f6f6b55](https://github.com/ceramicnetwork/js-ceramic/commit/f6f6b5513b3e2a5e6a428611a3151e767c922b04))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Depend on the right version of metrics package ([2d12605](https://github.com/ceramicnetwork/js-ceramic/commit/2d1260511012203854046560ea067e48f270dafc))
* **core:** Detect model model index table and don't recreate ([#2340](https://github.com/ceramicnetwork/js-ceramic/issues/2340)) ([cc83b3b](https://github.com/ceramicnetwork/js-ceramic/commit/cc83b3b10db12df64f224f5a7b3333ff8266ff08))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't fail to start up if indexing section is missing from config file ([#2454](https://github.com/ceramicnetwork/js-ceramic/issues/2454)) ([fb4936e](https://github.com/ceramicnetwork/js-ceramic/commit/fb4936e142cd5a36f3a1026cbec23c69644e7578))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** fix startup error from broken import ([#2255](https://github.com/ceramicnetwork/js-ceramic/issues/2255)) ([6c847aa](https://github.com/ceramicnetwork/js-ceramic/commit/6c847aa40b7dabfc56b1e2102d2e2b430618b9aa))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to check for IPFS data at startup ([#2100](https://github.com/ceramicnetwork/js-ceramic/issues/2100)) ([36af9fa](https://github.com/ceramicnetwork/js-ceramic/commit/36af9fa2725ee987b8f76d8f38b9137bedae6ccb))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub ([#2259](https://github.com/ceramicnetwork/js-ceramic/issues/2259)) ([99393e2](https://github.com/ceramicnetwork/js-ceramic/commit/99393e245a0a5d1f1013c784583a4596ab18109f))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Pinning a stream should mark it as synced ([#2394](https://github.com/ceramicnetwork/js-ceramic/issues/2394)) ([8e2fbf6](https://github.com/ceramicnetwork/js-ceramic/commit/8e2fbf63efdb361cb80a5d31cd8a8e92b177bee2))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** StreamID comes from genesis commit CID, not tip ([#2256](https://github.com/ceramicnetwork/js-ceramic/issues/2256)) ([ff1e3db](https://github.com/ceramicnetwork/js-ceramic/commit/ff1e3dbf0011d7819ce28d4d71d94047d6d2dd6f))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core:** Use package, not relative path to metrics ([#2393](https://github.com/ceramicnetwork/js-ceramic/issues/2393)) ([0d8e50a](https://github.com/ceramicnetwork/js-ceramic/commit/0d8e50a543550a58364a8c25ad3487e599e95608))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* Filter by account ([#2202](https://github.com/ceramicnetwork/js-ceramic/issues/2202)) ([d50e3ac](https://github.com/ceramicnetwork/js-ceramic/commit/d50e3ac49030bd7eda318580fe354db53530cf71))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-tile, stream-model-instance:** Enforce controller must be a string ([#2647](https://github.com/ceramicnetwork/js-ceramic/issues/2647)) ([7ad3e90](https://github.com/ceramicnetwork/js-ceramic/commit/7ad3e90ce0176abf19041bebdd67d90733ba2511))
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values ([#2159](https://github.com/ceramicnetwork/js-ceramic/issues/2159)) ([cd195c9](https://github.com/ceramicnetwork/js-ceramic/commit/cd195c924b3316ded5d33f708c6781e1b6f49543))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* `count` endpoint ([#2463](https://github.com/ceramicnetwork/js-ceramic/issues/2463)) ([6556596](https://github.com/ceramicnetwork/js-ceramic/commit/65565965d22fa924e2b372dd34002378ea7808ef))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add allowQueriesBeforeHistoricalSync flag to config ([#2289](https://github.com/ceramicnetwork/js-ceramic/issues/2289)) ([cf68d7e](https://github.com/ceramicnetwork/js-ceramic/commit/cf68d7e832368b1d59fc002f45654d5e0ad64f16))
* add dummy implementation of IndexClientApi to core and http-client ([#2200](https://github.com/ceramicnetwork/js-ceramic/issues/2200)) ([aaf6fe3](https://github.com/ceramicnetwork/js-ceramic/commit/aaf6fe33df0be3d44e10d4b7e47e3fca9c86e2c2)), closes [#2201](https://github.com/ceramicnetwork/js-ceramic/issues/2201)
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* add gnosis chain and goerli to supported networks [NET-1556] ([#2239](https://github.com/ceramicnetwork/js-ceramic/issues/2239)) ([25877cf](https://github.com/ceramicnetwork/js-ceramic/commit/25877cfcc14001f1fee660e62bedb1932ea4f1d6))
* Add InsertionOrder and remove ChronologicalOrder ([#2218](https://github.com/ceramicnetwork/js-ceramic/issues/2218)) ([4f98136](https://github.com/ceramicnetwork/js-ceramic/commit/4f981368e658c18e74d59efbd370b9311ece3008))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Attempt to limit concurrent S3 reads ([#2219](https://github.com/ceramicnetwork/js-ceramic/issues/2219)) ([bac9378](https://github.com/ceramicnetwork/js-ceramic/commit/bac937838122346a2be963f1ec110634cfad7dcc))
* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* Bypass maxEventListeners warning by using homegrown signalling ([#2411](https://github.com/ceramicnetwork/js-ceramic/issues/2411)) ([bbe17cd](https://github.com/ceramicnetwork/js-ceramic/commit/bbe17cdcc3794e00f3ed519d49da41afd27f25ba))
* Ceramic asks CAS to anchor indefinitely until some ok response ([#2441](https://github.com/ceramicnetwork/js-ceramic/issues/2441)) ([18150a9](https://github.com/ceramicnetwork/js-ceramic/commit/18150a93183700a8e3e45f253b639cdacabc9d69))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Chronological order for indexing, SQLite-only ([#2184](https://github.com/ceramicnetwork/js-ceramic/issues/2184)) ([e202ea7](https://github.com/ceramicnetwork/js-ceramic/commit/e202ea7e4ce82225452118e0dce50d6b1957f62c))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,cli:** Remove unused 'validate-streams' config option ([#2147](https://github.com/ceramicnetwork/js-ceramic/issues/2147)) ([90c6470](https://github.com/ceramicnetwork/js-ceramic/commit/90c647060c9db26f6b060fbcfe48ec46161cb810))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add anchor status for READY requests([#2325](https://github.com/ceramicnetwork/js-ceramic/issues/2325)) ([c9d4bbb](https://github.com/ceramicnetwork/js-ceramic/commit/c9d4bbbe9005eeeae62e7b4850ba9e19b1ef7749))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))
* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))
* **core:** add family to pubsub update messages ([e2fef67](https://github.com/ceramicnetwork/js-ceramic/commit/e2fef67fde82c9134eba4a771f9ff5adc8f84836))
* **core:** Add functionality for building tables with columns for relations ([#2435](https://github.com/ceramicnetwork/js-ceramic/issues/2435)) ([1da2e65](https://github.com/ceramicnetwork/js-ceramic/commit/1da2e658584d745d205ce9612400829d2dbe41a7))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** add stream to index api http ([#2252](https://github.com/ceramicnetwork/js-ceramic/issues/2252)) ([001233b](https://github.com/ceramicnetwork/js-ceramic/commit/001233b40c754a85dd40becdbe9ee01c1b8749a8))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Allow setting network to mainnet ([#2491](https://github.com/ceramicnetwork/js-ceramic/issues/2491)) ([b4c5958](https://github.com/ceramicnetwork/js-ceramic/commit/b4c595867ed6daeb03102aff58d951a5d149777e))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Cache recently processed pubsub messages ([#2559](https://github.com/ceramicnetwork/js-ceramic/issues/2559)) ([94d539b](https://github.com/ceramicnetwork/js-ceramic/commit/94d539b8df21305c7cb4f49cc8c144e9d4622cfd))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** implement `ceramic_models` indexing config table ([#2449](https://github.com/ceramicnetwork/js-ceramic/issues/2449)) ([33e3c09](https://github.com/ceramicnetwork/js-ceramic/commit/33e3c0969c0161d5dc17b55501775385241066be))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** job queue interface ([#2621](https://github.com/ceramicnetwork/js-ceramic/issues/2621)) ([2563864](https://github.com/ceramicnetwork/js-ceramic/commit/256386418bc9944f75beda94dd5b5c4b522dd25d))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** MID table schema validation on node startup ([#2320](https://github.com/ceramicnetwork/js-ceramic/issues/2320)) ([ffdc92b](https://github.com/ceramicnetwork/js-ceramic/commit/ffdc92ba8f14792294ca6babdeb781654eed47f8))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** persist and check network used for indexing ([#2558](https://github.com/ceramicnetwork/js-ceramic/issues/2558)) ([7224f1e](https://github.com/ceramicnetwork/js-ceramic/commit/7224f1ee9dfa46a1636f1a397de0f410ecca16e2))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Reject client-initiated updates that build on stale state ([#2579](https://github.com/ceramicnetwork/js-ceramic/issues/2579)) ([78a3ae0](https://github.com/ceramicnetwork/js-ceramic/commit/78a3ae0ea87645d17db6c57da05f718c4611e1bf))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** replace cas-dev for dev-unstable with cas-qa ([#2144](https://github.com/ceramicnetwork/js-ceramic/issues/2144)) ([e8ef8c0](https://github.com/ceramicnetwork/js-ceramic/commit/e8ef8c00041c9dc6239e338d9be78f7ee9da2474))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Sanity check that IPFS node has data for 1 random pinned stream at startup. ([#2093](https://github.com/ceramicnetwork/js-ceramic/issues/2093)) ([f7d0f67](https://github.com/ceramicnetwork/js-ceramic/commit/f7d0f67a2f6269f1a5488615a53e1f3b4e1c8d18))
* **core:** Setup database connection for indexing, SQLite only ([#2167](https://github.com/ceramicnetwork/js-ceramic/issues/2167)) ([3d63ccc](https://github.com/ceramicnetwork/js-ceramic/commit/3d63ccca02bee96ac5775ada38686c6065307b57))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core:** Validate anchors and extract timestamp information before commit application ([#2622](https://github.com/ceramicnetwork/js-ceramic/issues/2622)) ([ae3ae5e](https://github.com/ceramicnetwork/js-ceramic/commit/ae3ae5e57303f658d6fd3c332b8773ffebf98793))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))
* Create table per indexed model ([#2179](https://github.com/ceramicnetwork/js-ceramic/issues/2179)) ([f917846](https://github.com/ceramicnetwork/js-ceramic/commit/f917846cd3f23357ebb089c09578e11288ee58a9))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* gitgnore generated version.ts file ([#2205](https://github.com/ceramicnetwork/js-ceramic/issues/2205)) ([395509c](https://github.com/ceramicnetwork/js-ceramic/commit/395509c79e5e7c5da5bd4d7ed39e6cc521e6ad65))
* HTTP endpoint - it works ([#2210](https://github.com/ceramicnetwork/js-ceramic/issues/2210)) ([28bf9aa](https://github.com/ceramicnetwork/js-ceramic/commit/28bf9aa9bc5338130d7eb2a0f8691d04edc7f1a9))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Parallelise table operations in database apis ([#2541](https://github.com/ceramicnetwork/js-ceramic/issues/2541)) ([882dede](https://github.com/ceramicnetwork/js-ceramic/commit/882dede57dc2fa9fe0b59f6258524d30bb64aab3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))
* Provisionary dedupe of pinning ([#2543](https://github.com/ceramicnetwork/js-ceramic/issues/2543)) ([989c0c7](https://github.com/ceramicnetwork/js-ceramic/commit/989c0c70badc2599c481c0d83e029c617fbca9a4))
* Rate-limit a warning about messages over a rate-limit ([#2424](https://github.com/ceramicnetwork/js-ceramic/issues/2424)) ([0b51309](https://github.com/ceramicnetwork/js-ceramic/commit/0b51309be704196e1beade5c67c444b7064f76d7))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* Use StaticJsonRpcProvider in EthereumAnchorValidator ([#2471](https://github.com/ceramicnetwork/js-ceramic/issues/2471)) ([6c4988f](https://github.com/ceramicnetwork/js-ceramic/commit/6c4988fcf27c5f0687114bb1585e36d35bc62e6e))
* warn at startup if runs SQLite in production ([#2254](https://github.com/ceramicnetwork/js-ceramic/issues/2254)) ([425b8ed](https://github.com/ceramicnetwork/js-ceramic/commit/425b8edea9d1d01e62d4650ae5c442d4bbaae208))
* warn if indexing is not configured ([#2194](https://github.com/ceramicnetwork/js-ceramic/issues/2194)) ([6985549](https://github.com/ceramicnetwork/js-ceramic/commit/69855496e98b610bd62abfe42c013f127754f6f8))


### Reverts

* Revert "chore: Make memoization slightly faster and more reliable (#2235)" ([5c64483](https://github.com/ceramicnetwork/js-ceramic/commit/5c644838da2e7e0b0d5a1a696576dd3d188f9a67)), closes [#2235](https://github.com/ceramicnetwork/js-ceramic/issues/2235)
* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [2.21.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.21.0-rc.0...@ceramicnetwork/core@2.21.0) (2023-01-05)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.21.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.20.1...@ceramicnetwork/core@2.21.0-rc.0) (2022-12-29)


### Bug Fixes

* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* bump version on mapmoize package ([#2629](https://github.com/ceramicnetwork/js-ceramic/issues/2629)) ([78b668f](https://github.com/ceramicnetwork/js-ceramic/commit/78b668feeef0f563e1f8f6a1773a7c9af467bdde))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** fix metrics import and dependency ([#2227](https://github.com/ceramicnetwork/js-ceramic/issues/2227)) ([c418347](https://github.com/ceramicnetwork/js-ceramic/commit/c4183476a53aedb23edba7f2e2dd1c456d1f1ba8))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different ([#2479](https://github.com/ceramicnetwork/js-ceramic/issues/2479)) ([d83c739](https://github.com/ceramicnetwork/js-ceramic/commit/d83c739ef6e5679da485363db8bc477ec1d39540))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([319adf2](https://github.com/ceramicnetwork/js-ceramic/commit/319adf2f9c7e2575c114ce8ae05864f0c8e0eeb4))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow fast-forward of a stream state if newer commit is anchored ([#2398](https://github.com/ceramicnetwork/js-ceramic/issues/2398)) ([d4085aa](https://github.com/ceramicnetwork/js-ceramic/commit/d4085aa3410443102d79ad7322b7aa503cab3871))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** anchor proofs use txType instead of version - CDB-2074 ([#2565](https://github.com/ceramicnetwork/js-ceramic/issues/2565)) ([bed5161](https://github.com/ceramicnetwork/js-ceramic/commit/bed51611244b3fcd3880743c309440728ff08573))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Creating a stream via a multiquery should pin it ([#2236](https://github.com/ceramicnetwork/js-ceramic/issues/2236)) ([f6f6b55](https://github.com/ceramicnetwork/js-ceramic/commit/f6f6b5513b3e2a5e6a428611a3151e767c922b04))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Depend on the right version of metrics package ([2d12605](https://github.com/ceramicnetwork/js-ceramic/commit/2d1260511012203854046560ea067e48f270dafc))
* **core:** Detect model model index table and don't recreate ([#2340](https://github.com/ceramicnetwork/js-ceramic/issues/2340)) ([cc83b3b](https://github.com/ceramicnetwork/js-ceramic/commit/cc83b3b10db12df64f224f5a7b3333ff8266ff08))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't fail to start up if indexing section is missing from config file ([#2454](https://github.com/ceramicnetwork/js-ceramic/issues/2454)) ([fb4936e](https://github.com/ceramicnetwork/js-ceramic/commit/fb4936e142cd5a36f3a1026cbec23c69644e7578))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** fix startup error from broken import ([#2255](https://github.com/ceramicnetwork/js-ceramic/issues/2255)) ([6c847aa](https://github.com/ceramicnetwork/js-ceramic/commit/6c847aa40b7dabfc56b1e2102d2e2b430618b9aa))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to check for IPFS data at startup ([#2100](https://github.com/ceramicnetwork/js-ceramic/issues/2100)) ([36af9fa](https://github.com/ceramicnetwork/js-ceramic/commit/36af9fa2725ee987b8f76d8f38b9137bedae6ccb))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub ([#2259](https://github.com/ceramicnetwork/js-ceramic/issues/2259)) ([99393e2](https://github.com/ceramicnetwork/js-ceramic/commit/99393e245a0a5d1f1013c784583a4596ab18109f))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Pinning a stream should mark it as synced ([#2394](https://github.com/ceramicnetwork/js-ceramic/issues/2394)) ([8e2fbf6](https://github.com/ceramicnetwork/js-ceramic/commit/8e2fbf63efdb361cb80a5d31cd8a8e92b177bee2))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** StreamID comes from genesis commit CID, not tip ([#2256](https://github.com/ceramicnetwork/js-ceramic/issues/2256)) ([ff1e3db](https://github.com/ceramicnetwork/js-ceramic/commit/ff1e3dbf0011d7819ce28d4d71d94047d6d2dd6f))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core:** Use package, not relative path to metrics ([#2393](https://github.com/ceramicnetwork/js-ceramic/issues/2393)) ([0d8e50a](https://github.com/ceramicnetwork/js-ceramic/commit/0d8e50a543550a58364a8c25ad3487e599e95608))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* Filter by account ([#2202](https://github.com/ceramicnetwork/js-ceramic/issues/2202)) ([d50e3ac](https://github.com/ceramicnetwork/js-ceramic/commit/d50e3ac49030bd7eda318580fe354db53530cf71))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values ([#2159](https://github.com/ceramicnetwork/js-ceramic/issues/2159)) ([cd195c9](https://github.com/ceramicnetwork/js-ceramic/commit/cd195c924b3316ded5d33f708c6781e1b6f49543))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* `count` endpoint ([#2463](https://github.com/ceramicnetwork/js-ceramic/issues/2463)) ([6556596](https://github.com/ceramicnetwork/js-ceramic/commit/65565965d22fa924e2b372dd34002378ea7808ef))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add allowQueriesBeforeHistoricalSync flag to config ([#2289](https://github.com/ceramicnetwork/js-ceramic/issues/2289)) ([cf68d7e](https://github.com/ceramicnetwork/js-ceramic/commit/cf68d7e832368b1d59fc002f45654d5e0ad64f16))
* add dummy implementation of IndexClientApi to core and http-client ([#2200](https://github.com/ceramicnetwork/js-ceramic/issues/2200)) ([aaf6fe3](https://github.com/ceramicnetwork/js-ceramic/commit/aaf6fe33df0be3d44e10d4b7e47e3fca9c86e2c2)), closes [#2201](https://github.com/ceramicnetwork/js-ceramic/issues/2201)
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* add gnosis chain and goerli to supported networks [NET-1556] ([#2239](https://github.com/ceramicnetwork/js-ceramic/issues/2239)) ([25877cf](https://github.com/ceramicnetwork/js-ceramic/commit/25877cfcc14001f1fee660e62bedb1932ea4f1d6))
* Add InsertionOrder and remove ChronologicalOrder ([#2218](https://github.com/ceramicnetwork/js-ceramic/issues/2218)) ([4f98136](https://github.com/ceramicnetwork/js-ceramic/commit/4f981368e658c18e74d59efbd370b9311ece3008))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Attempt to limit concurrent S3 reads ([#2219](https://github.com/ceramicnetwork/js-ceramic/issues/2219)) ([bac9378](https://github.com/ceramicnetwork/js-ceramic/commit/bac937838122346a2be963f1ec110634cfad7dcc))
* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* Bypass maxEventListeners warning by using homegrown signalling ([#2411](https://github.com/ceramicnetwork/js-ceramic/issues/2411)) ([bbe17cd](https://github.com/ceramicnetwork/js-ceramic/commit/bbe17cdcc3794e00f3ed519d49da41afd27f25ba))
* Ceramic asks CAS to anchor indefinitely until some ok response ([#2441](https://github.com/ceramicnetwork/js-ceramic/issues/2441)) ([18150a9](https://github.com/ceramicnetwork/js-ceramic/commit/18150a93183700a8e3e45f253b639cdacabc9d69))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Chronological order for indexing, SQLite-only ([#2184](https://github.com/ceramicnetwork/js-ceramic/issues/2184)) ([e202ea7](https://github.com/ceramicnetwork/js-ceramic/commit/e202ea7e4ce82225452118e0dce50d6b1957f62c))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,cli:** Remove unused 'validate-streams' config option ([#2147](https://github.com/ceramicnetwork/js-ceramic/issues/2147)) ([90c6470](https://github.com/ceramicnetwork/js-ceramic/commit/90c647060c9db26f6b060fbcfe48ec46161cb810))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add anchor status for READY requests([#2325](https://github.com/ceramicnetwork/js-ceramic/issues/2325)) ([c9d4bbb](https://github.com/ceramicnetwork/js-ceramic/commit/c9d4bbbe9005eeeae62e7b4850ba9e19b1ef7749))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))
* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))
* **core:** add family to pubsub update messages ([e2fef67](https://github.com/ceramicnetwork/js-ceramic/commit/e2fef67fde82c9134eba4a771f9ff5adc8f84836))
* **core:** Add functionality for building tables with columns for relations ([#2435](https://github.com/ceramicnetwork/js-ceramic/issues/2435)) ([1da2e65](https://github.com/ceramicnetwork/js-ceramic/commit/1da2e658584d745d205ce9612400829d2dbe41a7))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** add stream to index api http ([#2252](https://github.com/ceramicnetwork/js-ceramic/issues/2252)) ([001233b](https://github.com/ceramicnetwork/js-ceramic/commit/001233b40c754a85dd40becdbe9ee01c1b8749a8))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Allow setting network to mainnet ([#2491](https://github.com/ceramicnetwork/js-ceramic/issues/2491)) ([b4c5958](https://github.com/ceramicnetwork/js-ceramic/commit/b4c595867ed6daeb03102aff58d951a5d149777e))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Cache recently processed pubsub messages ([#2559](https://github.com/ceramicnetwork/js-ceramic/issues/2559)) ([94d539b](https://github.com/ceramicnetwork/js-ceramic/commit/94d539b8df21305c7cb4f49cc8c144e9d4622cfd))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** implement `ceramic_models` indexing config table ([#2449](https://github.com/ceramicnetwork/js-ceramic/issues/2449)) ([33e3c09](https://github.com/ceramicnetwork/js-ceramic/commit/33e3c0969c0161d5dc17b55501775385241066be))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** job queue interface ([#2621](https://github.com/ceramicnetwork/js-ceramic/issues/2621)) ([2563864](https://github.com/ceramicnetwork/js-ceramic/commit/256386418bc9944f75beda94dd5b5c4b522dd25d))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** MID table schema validation on node startup ([#2320](https://github.com/ceramicnetwork/js-ceramic/issues/2320)) ([ffdc92b](https://github.com/ceramicnetwork/js-ceramic/commit/ffdc92ba8f14792294ca6babdeb781654eed47f8))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** persist and check network used for indexing ([#2558](https://github.com/ceramicnetwork/js-ceramic/issues/2558)) ([7224f1e](https://github.com/ceramicnetwork/js-ceramic/commit/7224f1ee9dfa46a1636f1a397de0f410ecca16e2))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Reject client-initiated updates that build on stale state ([#2579](https://github.com/ceramicnetwork/js-ceramic/issues/2579)) ([78a3ae0](https://github.com/ceramicnetwork/js-ceramic/commit/78a3ae0ea87645d17db6c57da05f718c4611e1bf))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** replace cas-dev for dev-unstable with cas-qa ([#2144](https://github.com/ceramicnetwork/js-ceramic/issues/2144)) ([e8ef8c0](https://github.com/ceramicnetwork/js-ceramic/commit/e8ef8c00041c9dc6239e338d9be78f7ee9da2474))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Sanity check that IPFS node has data for 1 random pinned stream at startup. ([#2093](https://github.com/ceramicnetwork/js-ceramic/issues/2093)) ([f7d0f67](https://github.com/ceramicnetwork/js-ceramic/commit/f7d0f67a2f6269f1a5488615a53e1f3b4e1c8d18))
* **core:** Setup database connection for indexing, SQLite only ([#2167](https://github.com/ceramicnetwork/js-ceramic/issues/2167)) ([3d63ccc](https://github.com/ceramicnetwork/js-ceramic/commit/3d63ccca02bee96ac5775ada38686c6065307b57))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core:** Validate anchors and extract timestamp information before commit application ([#2622](https://github.com/ceramicnetwork/js-ceramic/issues/2622)) ([ae3ae5e](https://github.com/ceramicnetwork/js-ceramic/commit/ae3ae5e57303f658d6fd3c332b8773ffebf98793))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))
* Create table per indexed model ([#2179](https://github.com/ceramicnetwork/js-ceramic/issues/2179)) ([f917846](https://github.com/ceramicnetwork/js-ceramic/commit/f917846cd3f23357ebb089c09578e11288ee58a9))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* gitgnore generated version.ts file ([#2205](https://github.com/ceramicnetwork/js-ceramic/issues/2205)) ([395509c](https://github.com/ceramicnetwork/js-ceramic/commit/395509c79e5e7c5da5bd4d7ed39e6cc521e6ad65))
* HTTP endpoint - it works ([#2210](https://github.com/ceramicnetwork/js-ceramic/issues/2210)) ([28bf9aa](https://github.com/ceramicnetwork/js-ceramic/commit/28bf9aa9bc5338130d7eb2a0f8691d04edc7f1a9))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Parallelise table operations in database apis ([#2541](https://github.com/ceramicnetwork/js-ceramic/issues/2541)) ([882dede](https://github.com/ceramicnetwork/js-ceramic/commit/882dede57dc2fa9fe0b59f6258524d30bb64aab3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))
* Provisionary dedupe of pinning ([#2543](https://github.com/ceramicnetwork/js-ceramic/issues/2543)) ([989c0c7](https://github.com/ceramicnetwork/js-ceramic/commit/989c0c70badc2599c481c0d83e029c617fbca9a4))
* Rate-limit a warning about messages over a rate-limit ([#2424](https://github.com/ceramicnetwork/js-ceramic/issues/2424)) ([0b51309](https://github.com/ceramicnetwork/js-ceramic/commit/0b51309be704196e1beade5c67c444b7064f76d7))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* Use StaticJsonRpcProvider in EthereumAnchorValidator ([#2471](https://github.com/ceramicnetwork/js-ceramic/issues/2471)) ([6c4988f](https://github.com/ceramicnetwork/js-ceramic/commit/6c4988fcf27c5f0687114bb1585e36d35bc62e6e))
* warn at startup if runs SQLite in production ([#2254](https://github.com/ceramicnetwork/js-ceramic/issues/2254)) ([425b8ed](https://github.com/ceramicnetwork/js-ceramic/commit/425b8edea9d1d01e62d4650ae5c442d4bbaae208))
* warn if indexing is not configured ([#2194](https://github.com/ceramicnetwork/js-ceramic/issues/2194)) ([6985549](https://github.com/ceramicnetwork/js-ceramic/commit/69855496e98b610bd62abfe42c013f127754f6f8))


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





## [2.20.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.20.0...@ceramicnetwork/core@2.20.1) (2022-12-29)


### Reverts

* Revert "chore: Make memoization slightly faster and more reliable (#2235)" ([5c64483](https://github.com/ceramicnetwork/js-ceramic/commit/5c644838da2e7e0b0d5a1a696576dd3d188f9a67)), closes [#2235](https://github.com/ceramicnetwork/js-ceramic/issues/2235)





# [2.20.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.20.0-rc.0...@ceramicnetwork/core@2.20.0) (2022-12-21)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.20.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.19.0...@ceramicnetwork/core@2.20.0-rc.0) (2022-12-15)


### Bug Fixes

* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** fix metrics import and dependency ([#2227](https://github.com/ceramicnetwork/js-ceramic/issues/2227)) ([c418347](https://github.com/ceramicnetwork/js-ceramic/commit/c4183476a53aedb23edba7f2e2dd1c456d1f1ba8))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different ([#2479](https://github.com/ceramicnetwork/js-ceramic/issues/2479)) ([d83c739](https://github.com/ceramicnetwork/js-ceramic/commit/d83c739ef6e5679da485363db8bc477ec1d39540))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([319adf2](https://github.com/ceramicnetwork/js-ceramic/commit/319adf2f9c7e2575c114ce8ae05864f0c8e0eeb4))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow fast-forward of a stream state if newer commit is anchored ([#2398](https://github.com/ceramicnetwork/js-ceramic/issues/2398)) ([d4085aa](https://github.com/ceramicnetwork/js-ceramic/commit/d4085aa3410443102d79ad7322b7aa503cab3871))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** anchor proofs use txType instead of version - CDB-2074 ([#2565](https://github.com/ceramicnetwork/js-ceramic/issues/2565)) ([bed5161](https://github.com/ceramicnetwork/js-ceramic/commit/bed51611244b3fcd3880743c309440728ff08573))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Creating a stream via a multiquery should pin it ([#2236](https://github.com/ceramicnetwork/js-ceramic/issues/2236)) ([f6f6b55](https://github.com/ceramicnetwork/js-ceramic/commit/f6f6b5513b3e2a5e6a428611a3151e767c922b04))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Depend on the right version of metrics package ([2d12605](https://github.com/ceramicnetwork/js-ceramic/commit/2d1260511012203854046560ea067e48f270dafc))
* **core:** Detect model model index table and don't recreate ([#2340](https://github.com/ceramicnetwork/js-ceramic/issues/2340)) ([cc83b3b](https://github.com/ceramicnetwork/js-ceramic/commit/cc83b3b10db12df64f224f5a7b3333ff8266ff08))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't fail to start up if indexing section is missing from config file ([#2454](https://github.com/ceramicnetwork/js-ceramic/issues/2454)) ([fb4936e](https://github.com/ceramicnetwork/js-ceramic/commit/fb4936e142cd5a36f3a1026cbec23c69644e7578))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** fix startup error from broken import ([#2255](https://github.com/ceramicnetwork/js-ceramic/issues/2255)) ([6c847aa](https://github.com/ceramicnetwork/js-ceramic/commit/6c847aa40b7dabfc56b1e2102d2e2b430618b9aa))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to check for IPFS data at startup ([#2100](https://github.com/ceramicnetwork/js-ceramic/issues/2100)) ([36af9fa](https://github.com/ceramicnetwork/js-ceramic/commit/36af9fa2725ee987b8f76d8f38b9137bedae6ccb))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub ([#2259](https://github.com/ceramicnetwork/js-ceramic/issues/2259)) ([99393e2](https://github.com/ceramicnetwork/js-ceramic/commit/99393e245a0a5d1f1013c784583a4596ab18109f))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Pinning a stream should mark it as synced ([#2394](https://github.com/ceramicnetwork/js-ceramic/issues/2394)) ([8e2fbf6](https://github.com/ceramicnetwork/js-ceramic/commit/8e2fbf63efdb361cb80a5d31cd8a8e92b177bee2))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** StreamID comes from genesis commit CID, not tip ([#2256](https://github.com/ceramicnetwork/js-ceramic/issues/2256)) ([ff1e3db](https://github.com/ceramicnetwork/js-ceramic/commit/ff1e3dbf0011d7819ce28d4d71d94047d6d2dd6f))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core:** Use package, not relative path to metrics ([#2393](https://github.com/ceramicnetwork/js-ceramic/issues/2393)) ([0d8e50a](https://github.com/ceramicnetwork/js-ceramic/commit/0d8e50a543550a58364a8c25ad3487e599e95608))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* Filter by account ([#2202](https://github.com/ceramicnetwork/js-ceramic/issues/2202)) ([d50e3ac](https://github.com/ceramicnetwork/js-ceramic/commit/d50e3ac49030bd7eda318580fe354db53530cf71))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values ([#2159](https://github.com/ceramicnetwork/js-ceramic/issues/2159)) ([cd195c9](https://github.com/ceramicnetwork/js-ceramic/commit/cd195c924b3316ded5d33f708c6781e1b6f49543))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* `count` endpoint ([#2463](https://github.com/ceramicnetwork/js-ceramic/issues/2463)) ([6556596](https://github.com/ceramicnetwork/js-ceramic/commit/65565965d22fa924e2b372dd34002378ea7808ef))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add allowQueriesBeforeHistoricalSync flag to config ([#2289](https://github.com/ceramicnetwork/js-ceramic/issues/2289)) ([cf68d7e](https://github.com/ceramicnetwork/js-ceramic/commit/cf68d7e832368b1d59fc002f45654d5e0ad64f16))
* add dummy implementation of IndexClientApi to core and http-client ([#2200](https://github.com/ceramicnetwork/js-ceramic/issues/2200)) ([aaf6fe3](https://github.com/ceramicnetwork/js-ceramic/commit/aaf6fe33df0be3d44e10d4b7e47e3fca9c86e2c2)), closes [#2201](https://github.com/ceramicnetwork/js-ceramic/issues/2201)
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* add gnosis chain and goerli to supported networks [NET-1556] ([#2239](https://github.com/ceramicnetwork/js-ceramic/issues/2239)) ([25877cf](https://github.com/ceramicnetwork/js-ceramic/commit/25877cfcc14001f1fee660e62bedb1932ea4f1d6))
* Add InsertionOrder and remove ChronologicalOrder ([#2218](https://github.com/ceramicnetwork/js-ceramic/issues/2218)) ([4f98136](https://github.com/ceramicnetwork/js-ceramic/commit/4f981368e658c18e74d59efbd370b9311ece3008))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Attempt to limit concurrent S3 reads ([#2219](https://github.com/ceramicnetwork/js-ceramic/issues/2219)) ([bac9378](https://github.com/ceramicnetwork/js-ceramic/commit/bac937838122346a2be963f1ec110634cfad7dcc))
* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* Bypass maxEventListeners warning by using homegrown signalling ([#2411](https://github.com/ceramicnetwork/js-ceramic/issues/2411)) ([bbe17cd](https://github.com/ceramicnetwork/js-ceramic/commit/bbe17cdcc3794e00f3ed519d49da41afd27f25ba))
* Ceramic asks CAS to anchor indefinitely until some ok response ([#2441](https://github.com/ceramicnetwork/js-ceramic/issues/2441)) ([18150a9](https://github.com/ceramicnetwork/js-ceramic/commit/18150a93183700a8e3e45f253b639cdacabc9d69))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Chronological order for indexing, SQLite-only ([#2184](https://github.com/ceramicnetwork/js-ceramic/issues/2184)) ([e202ea7](https://github.com/ceramicnetwork/js-ceramic/commit/e202ea7e4ce82225452118e0dce50d6b1957f62c))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,cli:** Remove unused 'validate-streams' config option ([#2147](https://github.com/ceramicnetwork/js-ceramic/issues/2147)) ([90c6470](https://github.com/ceramicnetwork/js-ceramic/commit/90c647060c9db26f6b060fbcfe48ec46161cb810))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add anchor status for READY requests([#2325](https://github.com/ceramicnetwork/js-ceramic/issues/2325)) ([c9d4bbb](https://github.com/ceramicnetwork/js-ceramic/commit/c9d4bbbe9005eeeae62e7b4850ba9e19b1ef7749))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))
* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))
* **core:** add family to pubsub update messages ([e2fef67](https://github.com/ceramicnetwork/js-ceramic/commit/e2fef67fde82c9134eba4a771f9ff5adc8f84836))
* **core:** Add functionality for building tables with columns for relations ([#2435](https://github.com/ceramicnetwork/js-ceramic/issues/2435)) ([1da2e65](https://github.com/ceramicnetwork/js-ceramic/commit/1da2e658584d745d205ce9612400829d2dbe41a7))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** add stream to index api http ([#2252](https://github.com/ceramicnetwork/js-ceramic/issues/2252)) ([001233b](https://github.com/ceramicnetwork/js-ceramic/commit/001233b40c754a85dd40becdbe9ee01c1b8749a8))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Allow setting network to mainnet ([#2491](https://github.com/ceramicnetwork/js-ceramic/issues/2491)) ([b4c5958](https://github.com/ceramicnetwork/js-ceramic/commit/b4c595867ed6daeb03102aff58d951a5d149777e))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Cache recently processed pubsub messages ([#2559](https://github.com/ceramicnetwork/js-ceramic/issues/2559)) ([94d539b](https://github.com/ceramicnetwork/js-ceramic/commit/94d539b8df21305c7cb4f49cc8c144e9d4622cfd))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** implement `ceramic_models` indexing config table ([#2449](https://github.com/ceramicnetwork/js-ceramic/issues/2449)) ([33e3c09](https://github.com/ceramicnetwork/js-ceramic/commit/33e3c0969c0161d5dc17b55501775385241066be))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** MID table schema validation on node startup ([#2320](https://github.com/ceramicnetwork/js-ceramic/issues/2320)) ([ffdc92b](https://github.com/ceramicnetwork/js-ceramic/commit/ffdc92ba8f14792294ca6babdeb781654eed47f8))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** persist and check network used for indexing ([#2558](https://github.com/ceramicnetwork/js-ceramic/issues/2558)) ([7224f1e](https://github.com/ceramicnetwork/js-ceramic/commit/7224f1ee9dfa46a1636f1a397de0f410ecca16e2))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** replace cas-dev for dev-unstable with cas-qa ([#2144](https://github.com/ceramicnetwork/js-ceramic/issues/2144)) ([e8ef8c0](https://github.com/ceramicnetwork/js-ceramic/commit/e8ef8c00041c9dc6239e338d9be78f7ee9da2474))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Sanity check that IPFS node has data for 1 random pinned stream at startup. ([#2093](https://github.com/ceramicnetwork/js-ceramic/issues/2093)) ([f7d0f67](https://github.com/ceramicnetwork/js-ceramic/commit/f7d0f67a2f6269f1a5488615a53e1f3b4e1c8d18))
* **core:** Setup database connection for indexing, SQLite only ([#2167](https://github.com/ceramicnetwork/js-ceramic/issues/2167)) ([3d63ccc](https://github.com/ceramicnetwork/js-ceramic/commit/3d63ccca02bee96ac5775ada38686c6065307b57))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))
* Create table per indexed model ([#2179](https://github.com/ceramicnetwork/js-ceramic/issues/2179)) ([f917846](https://github.com/ceramicnetwork/js-ceramic/commit/f917846cd3f23357ebb089c09578e11288ee58a9))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* gitgnore generated version.ts file ([#2205](https://github.com/ceramicnetwork/js-ceramic/issues/2205)) ([395509c](https://github.com/ceramicnetwork/js-ceramic/commit/395509c79e5e7c5da5bd4d7ed39e6cc521e6ad65))
* HTTP endpoint - it works ([#2210](https://github.com/ceramicnetwork/js-ceramic/issues/2210)) ([28bf9aa](https://github.com/ceramicnetwork/js-ceramic/commit/28bf9aa9bc5338130d7eb2a0f8691d04edc7f1a9))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Parallelise table operations in database apis ([#2541](https://github.com/ceramicnetwork/js-ceramic/issues/2541)) ([882dede](https://github.com/ceramicnetwork/js-ceramic/commit/882dede57dc2fa9fe0b59f6258524d30bb64aab3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))
* Provisionary dedupe of pinning ([#2543](https://github.com/ceramicnetwork/js-ceramic/issues/2543)) ([989c0c7](https://github.com/ceramicnetwork/js-ceramic/commit/989c0c70badc2599c481c0d83e029c617fbca9a4))
* Rate-limit a warning about messages over a rate-limit ([#2424](https://github.com/ceramicnetwork/js-ceramic/issues/2424)) ([0b51309](https://github.com/ceramicnetwork/js-ceramic/commit/0b51309be704196e1beade5c67c444b7064f76d7))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* Use StaticJsonRpcProvider in EthereumAnchorValidator ([#2471](https://github.com/ceramicnetwork/js-ceramic/issues/2471)) ([6c4988f](https://github.com/ceramicnetwork/js-ceramic/commit/6c4988fcf27c5f0687114bb1585e36d35bc62e6e))
* warn at startup if runs SQLite in production ([#2254](https://github.com/ceramicnetwork/js-ceramic/issues/2254)) ([425b8ed](https://github.com/ceramicnetwork/js-ceramic/commit/425b8edea9d1d01e62d4650ae5c442d4bbaae208))
* warn if indexing is not configured ([#2194](https://github.com/ceramicnetwork/js-ceramic/issues/2194)) ([6985549](https://github.com/ceramicnetwork/js-ceramic/commit/69855496e98b610bd62abfe42c013f127754f6f8))


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [2.19.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.19.0-rc.0...@ceramicnetwork/core@2.19.0) (2022-12-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.19.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.18.0...@ceramicnetwork/core@2.19.0-rc.0) (2022-11-28)


### Bug Fixes

* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** fix metrics import and dependency ([#2227](https://github.com/ceramicnetwork/js-ceramic/issues/2227)) ([c418347](https://github.com/ceramicnetwork/js-ceramic/commit/c4183476a53aedb23edba7f2e2dd1c456d1f1ba8))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different ([#2479](https://github.com/ceramicnetwork/js-ceramic/issues/2479)) ([d83c739](https://github.com/ceramicnetwork/js-ceramic/commit/d83c739ef6e5679da485363db8bc477ec1d39540))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([319adf2](https://github.com/ceramicnetwork/js-ceramic/commit/319adf2f9c7e2575c114ce8ae05864f0c8e0eeb4))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow fast-forward of a stream state if newer commit is anchored ([#2398](https://github.com/ceramicnetwork/js-ceramic/issues/2398)) ([d4085aa](https://github.com/ceramicnetwork/js-ceramic/commit/d4085aa3410443102d79ad7322b7aa503cab3871))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** anchor proofs use txType instead of version - CDB-2074 ([#2565](https://github.com/ceramicnetwork/js-ceramic/issues/2565)) ([bed5161](https://github.com/ceramicnetwork/js-ceramic/commit/bed51611244b3fcd3880743c309440728ff08573))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Creating a stream via a multiquery should pin it ([#2236](https://github.com/ceramicnetwork/js-ceramic/issues/2236)) ([f6f6b55](https://github.com/ceramicnetwork/js-ceramic/commit/f6f6b5513b3e2a5e6a428611a3151e767c922b04))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Depend on the right version of metrics package ([2d12605](https://github.com/ceramicnetwork/js-ceramic/commit/2d1260511012203854046560ea067e48f270dafc))
* **core:** Detect model model index table and don't recreate ([#2340](https://github.com/ceramicnetwork/js-ceramic/issues/2340)) ([cc83b3b](https://github.com/ceramicnetwork/js-ceramic/commit/cc83b3b10db12df64f224f5a7b3333ff8266ff08))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't fail to start up if indexing section is missing from config file ([#2454](https://github.com/ceramicnetwork/js-ceramic/issues/2454)) ([fb4936e](https://github.com/ceramicnetwork/js-ceramic/commit/fb4936e142cd5a36f3a1026cbec23c69644e7578))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** fix startup error from broken import ([#2255](https://github.com/ceramicnetwork/js-ceramic/issues/2255)) ([6c847aa](https://github.com/ceramicnetwork/js-ceramic/commit/6c847aa40b7dabfc56b1e2102d2e2b430618b9aa))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to check for IPFS data at startup ([#2100](https://github.com/ceramicnetwork/js-ceramic/issues/2100)) ([36af9fa](https://github.com/ceramicnetwork/js-ceramic/commit/36af9fa2725ee987b8f76d8f38b9137bedae6ccb))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub ([#2259](https://github.com/ceramicnetwork/js-ceramic/issues/2259)) ([99393e2](https://github.com/ceramicnetwork/js-ceramic/commit/99393e245a0a5d1f1013c784583a4596ab18109f))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Pinning a stream should mark it as synced ([#2394](https://github.com/ceramicnetwork/js-ceramic/issues/2394)) ([8e2fbf6](https://github.com/ceramicnetwork/js-ceramic/commit/8e2fbf63efdb361cb80a5d31cd8a8e92b177bee2))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** StreamID comes from genesis commit CID, not tip ([#2256](https://github.com/ceramicnetwork/js-ceramic/issues/2256)) ([ff1e3db](https://github.com/ceramicnetwork/js-ceramic/commit/ff1e3dbf0011d7819ce28d4d71d94047d6d2dd6f))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core:** Use package, not relative path to metrics ([#2393](https://github.com/ceramicnetwork/js-ceramic/issues/2393)) ([0d8e50a](https://github.com/ceramicnetwork/js-ceramic/commit/0d8e50a543550a58364a8c25ad3487e599e95608))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* Filter by account ([#2202](https://github.com/ceramicnetwork/js-ceramic/issues/2202)) ([d50e3ac](https://github.com/ceramicnetwork/js-ceramic/commit/d50e3ac49030bd7eda318580fe354db53530cf71))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values ([#2159](https://github.com/ceramicnetwork/js-ceramic/issues/2159)) ([cd195c9](https://github.com/ceramicnetwork/js-ceramic/commit/cd195c924b3316ded5d33f708c6781e1b6f49543))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* `count` endpoint ([#2463](https://github.com/ceramicnetwork/js-ceramic/issues/2463)) ([6556596](https://github.com/ceramicnetwork/js-ceramic/commit/65565965d22fa924e2b372dd34002378ea7808ef))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add allowQueriesBeforeHistoricalSync flag to config ([#2289](https://github.com/ceramicnetwork/js-ceramic/issues/2289)) ([cf68d7e](https://github.com/ceramicnetwork/js-ceramic/commit/cf68d7e832368b1d59fc002f45654d5e0ad64f16))
* add dummy implementation of IndexClientApi to core and http-client ([#2200](https://github.com/ceramicnetwork/js-ceramic/issues/2200)) ([aaf6fe3](https://github.com/ceramicnetwork/js-ceramic/commit/aaf6fe33df0be3d44e10d4b7e47e3fca9c86e2c2)), closes [#2201](https://github.com/ceramicnetwork/js-ceramic/issues/2201)
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* add gnosis chain and goerli to supported networks [NET-1556] ([#2239](https://github.com/ceramicnetwork/js-ceramic/issues/2239)) ([25877cf](https://github.com/ceramicnetwork/js-ceramic/commit/25877cfcc14001f1fee660e62bedb1932ea4f1d6))
* Add InsertionOrder and remove ChronologicalOrder ([#2218](https://github.com/ceramicnetwork/js-ceramic/issues/2218)) ([4f98136](https://github.com/ceramicnetwork/js-ceramic/commit/4f981368e658c18e74d59efbd370b9311ece3008))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Attempt to limit concurrent S3 reads ([#2219](https://github.com/ceramicnetwork/js-ceramic/issues/2219)) ([bac9378](https://github.com/ceramicnetwork/js-ceramic/commit/bac937838122346a2be963f1ec110634cfad7dcc))
* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* Bypass maxEventListeners warning by using homegrown signalling ([#2411](https://github.com/ceramicnetwork/js-ceramic/issues/2411)) ([bbe17cd](https://github.com/ceramicnetwork/js-ceramic/commit/bbe17cdcc3794e00f3ed519d49da41afd27f25ba))
* Ceramic asks CAS to anchor indefinitely until some ok response ([#2441](https://github.com/ceramicnetwork/js-ceramic/issues/2441)) ([18150a9](https://github.com/ceramicnetwork/js-ceramic/commit/18150a93183700a8e3e45f253b639cdacabc9d69))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Chronological order for indexing, SQLite-only ([#2184](https://github.com/ceramicnetwork/js-ceramic/issues/2184)) ([e202ea7](https://github.com/ceramicnetwork/js-ceramic/commit/e202ea7e4ce82225452118e0dce50d6b1957f62c))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,cli:** Remove unused 'validate-streams' config option ([#2147](https://github.com/ceramicnetwork/js-ceramic/issues/2147)) ([90c6470](https://github.com/ceramicnetwork/js-ceramic/commit/90c647060c9db26f6b060fbcfe48ec46161cb810))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add anchor status for READY requests([#2325](https://github.com/ceramicnetwork/js-ceramic/issues/2325)) ([c9d4bbb](https://github.com/ceramicnetwork/js-ceramic/commit/c9d4bbbe9005eeeae62e7b4850ba9e19b1ef7749))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))
* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))
* **core:** add family to pubsub update messages ([e2fef67](https://github.com/ceramicnetwork/js-ceramic/commit/e2fef67fde82c9134eba4a771f9ff5adc8f84836))
* **core:** Add functionality for building tables with columns for relations ([#2435](https://github.com/ceramicnetwork/js-ceramic/issues/2435)) ([1da2e65](https://github.com/ceramicnetwork/js-ceramic/commit/1da2e658584d745d205ce9612400829d2dbe41a7))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** add stream to index api http ([#2252](https://github.com/ceramicnetwork/js-ceramic/issues/2252)) ([001233b](https://github.com/ceramicnetwork/js-ceramic/commit/001233b40c754a85dd40becdbe9ee01c1b8749a8))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Allow setting network to mainnet ([#2491](https://github.com/ceramicnetwork/js-ceramic/issues/2491)) ([b4c5958](https://github.com/ceramicnetwork/js-ceramic/commit/b4c595867ed6daeb03102aff58d951a5d149777e))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Cache recently processed pubsub messages ([#2559](https://github.com/ceramicnetwork/js-ceramic/issues/2559)) ([94d539b](https://github.com/ceramicnetwork/js-ceramic/commit/94d539b8df21305c7cb4f49cc8c144e9d4622cfd))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** implement `ceramic_models` indexing config table ([#2449](https://github.com/ceramicnetwork/js-ceramic/issues/2449)) ([33e3c09](https://github.com/ceramicnetwork/js-ceramic/commit/33e3c0969c0161d5dc17b55501775385241066be))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** MID table schema validation on node startup ([#2320](https://github.com/ceramicnetwork/js-ceramic/issues/2320)) ([ffdc92b](https://github.com/ceramicnetwork/js-ceramic/commit/ffdc92ba8f14792294ca6babdeb781654eed47f8))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** persist and check network used for indexing ([#2558](https://github.com/ceramicnetwork/js-ceramic/issues/2558)) ([7224f1e](https://github.com/ceramicnetwork/js-ceramic/commit/7224f1ee9dfa46a1636f1a397de0f410ecca16e2))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** replace cas-dev for dev-unstable with cas-qa ([#2144](https://github.com/ceramicnetwork/js-ceramic/issues/2144)) ([e8ef8c0](https://github.com/ceramicnetwork/js-ceramic/commit/e8ef8c00041c9dc6239e338d9be78f7ee9da2474))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Sanity check that IPFS node has data for 1 random pinned stream at startup. ([#2093](https://github.com/ceramicnetwork/js-ceramic/issues/2093)) ([f7d0f67](https://github.com/ceramicnetwork/js-ceramic/commit/f7d0f67a2f6269f1a5488615a53e1f3b4e1c8d18))
* **core:** Setup database connection for indexing, SQLite only ([#2167](https://github.com/ceramicnetwork/js-ceramic/issues/2167)) ([3d63ccc](https://github.com/ceramicnetwork/js-ceramic/commit/3d63ccca02bee96ac5775ada38686c6065307b57))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))
* **core:** Throw when loading or updating a stream with expired CACAOs in the log ([#2574](https://github.com/ceramicnetwork/js-ceramic/issues/2574)) ([928d5e3](https://github.com/ceramicnetwork/js-ceramic/commit/928d5e338957ba361c6b33246091ac145e6740d4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))
* Create table per indexed model ([#2179](https://github.com/ceramicnetwork/js-ceramic/issues/2179)) ([f917846](https://github.com/ceramicnetwork/js-ceramic/commit/f917846cd3f23357ebb089c09578e11288ee58a9))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* gitgnore generated version.ts file ([#2205](https://github.com/ceramicnetwork/js-ceramic/issues/2205)) ([395509c](https://github.com/ceramicnetwork/js-ceramic/commit/395509c79e5e7c5da5bd4d7ed39e6cc521e6ad65))
* HTTP endpoint - it works ([#2210](https://github.com/ceramicnetwork/js-ceramic/issues/2210)) ([28bf9aa](https://github.com/ceramicnetwork/js-ceramic/commit/28bf9aa9bc5338130d7eb2a0f8691d04edc7f1a9))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Parallelise table operations in database apis ([#2541](https://github.com/ceramicnetwork/js-ceramic/issues/2541)) ([882dede](https://github.com/ceramicnetwork/js-ceramic/commit/882dede57dc2fa9fe0b59f6258524d30bb64aab3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))
* Provisionary dedupe of pinning ([#2543](https://github.com/ceramicnetwork/js-ceramic/issues/2543)) ([989c0c7](https://github.com/ceramicnetwork/js-ceramic/commit/989c0c70badc2599c481c0d83e029c617fbca9a4))
* Rate-limit a warning about messages over a rate-limit ([#2424](https://github.com/ceramicnetwork/js-ceramic/issues/2424)) ([0b51309](https://github.com/ceramicnetwork/js-ceramic/commit/0b51309be704196e1beade5c67c444b7064f76d7))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* Use StaticJsonRpcProvider in EthereumAnchorValidator ([#2471](https://github.com/ceramicnetwork/js-ceramic/issues/2471)) ([6c4988f](https://github.com/ceramicnetwork/js-ceramic/commit/6c4988fcf27c5f0687114bb1585e36d35bc62e6e))
* warn at startup if runs SQLite in production ([#2254](https://github.com/ceramicnetwork/js-ceramic/issues/2254)) ([425b8ed](https://github.com/ceramicnetwork/js-ceramic/commit/425b8edea9d1d01e62d4650ae5c442d4bbaae208))
* warn if indexing is not configured ([#2194](https://github.com/ceramicnetwork/js-ceramic/issues/2194)) ([6985549](https://github.com/ceramicnetwork/js-ceramic/commit/69855496e98b610bd62abfe42c013f127754f6f8))


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [2.18.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.17.0...@ceramicnetwork/core@2.18.0) (2022-11-16)


### Bug Fixes

* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** fix metrics import and dependency ([#2227](https://github.com/ceramicnetwork/js-ceramic/issues/2227)) ([c418347](https://github.com/ceramicnetwork/js-ceramic/commit/c4183476a53aedb23edba7f2e2dd1c456d1f1ba8))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different ([#2479](https://github.com/ceramicnetwork/js-ceramic/issues/2479)) ([d83c739](https://github.com/ceramicnetwork/js-ceramic/commit/d83c739ef6e5679da485363db8bc477ec1d39540))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([319adf2](https://github.com/ceramicnetwork/js-ceramic/commit/319adf2f9c7e2575c114ce8ae05864f0c8e0eeb4))
* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow fast-forward of a stream state if newer commit is anchored ([#2398](https://github.com/ceramicnetwork/js-ceramic/issues/2398)) ([d4085aa](https://github.com/ceramicnetwork/js-ceramic/commit/d4085aa3410443102d79ad7322b7aa503cab3871))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Creating a stream via a multiquery should pin it ([#2236](https://github.com/ceramicnetwork/js-ceramic/issues/2236)) ([f6f6b55](https://github.com/ceramicnetwork/js-ceramic/commit/f6f6b5513b3e2a5e6a428611a3151e767c922b04))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Depend on the right version of metrics package ([2d12605](https://github.com/ceramicnetwork/js-ceramic/commit/2d1260511012203854046560ea067e48f270dafc))
* **core:** Detect model model index table and don't recreate ([#2340](https://github.com/ceramicnetwork/js-ceramic/issues/2340)) ([cc83b3b](https://github.com/ceramicnetwork/js-ceramic/commit/cc83b3b10db12df64f224f5a7b3333ff8266ff08))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't fail to start up if indexing section is missing from config file ([#2454](https://github.com/ceramicnetwork/js-ceramic/issues/2454)) ([fb4936e](https://github.com/ceramicnetwork/js-ceramic/commit/fb4936e142cd5a36f3a1026cbec23c69644e7578))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams ([#2307](https://github.com/ceramicnetwork/js-ceramic/issues/2307)) ([5b9773a](https://github.com/ceramicnetwork/js-ceramic/commit/5b9773aa68a5163baffb99ee05e99139865192e6))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** fix startup error from broken import ([#2255](https://github.com/ceramicnetwork/js-ceramic/issues/2255)) ([6c847aa](https://github.com/ceramicnetwork/js-ceramic/commit/6c847aa40b7dabfc56b1e2102d2e2b430618b9aa))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to check for IPFS data at startup ([#2100](https://github.com/ceramicnetwork/js-ceramic/issues/2100)) ([36af9fa](https://github.com/ceramicnetwork/js-ceramic/commit/36af9fa2725ee987b8f76d8f38b9137bedae6ccb))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub ([#2259](https://github.com/ceramicnetwork/js-ceramic/issues/2259)) ([99393e2](https://github.com/ceramicnetwork/js-ceramic/commit/99393e245a0a5d1f1013c784583a4596ab18109f))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Pinning a stream should mark it as synced ([#2394](https://github.com/ceramicnetwork/js-ceramic/issues/2394)) ([8e2fbf6](https://github.com/ceramicnetwork/js-ceramic/commit/8e2fbf63efdb361cb80a5d31cd8a8e92b177bee2))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** StreamID comes from genesis commit CID, not tip ([#2256](https://github.com/ceramicnetwork/js-ceramic/issues/2256)) ([ff1e3db](https://github.com/ceramicnetwork/js-ceramic/commit/ff1e3dbf0011d7819ce28d4d71d94047d6d2dd6f))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core:** Use package, not relative path to metrics ([#2393](https://github.com/ceramicnetwork/js-ceramic/issues/2393)) ([0d8e50a](https://github.com/ceramicnetwork/js-ceramic/commit/0d8e50a543550a58364a8c25ad3487e599e95608))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* evaluate string value of env vars as booleans ([#2382](https://github.com/ceramicnetwork/js-ceramic/issues/2382)) ([2837112](https://github.com/ceramicnetwork/js-ceramic/commit/28371128d867fc7102dbf614f5bc1eab6a04b94d))
* Filter by account ([#2202](https://github.com/ceramicnetwork/js-ceramic/issues/2202)) ([d50e3ac](https://github.com/ceramicnetwork/js-ceramic/commit/d50e3ac49030bd7eda318580fe354db53530cf71))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values ([#2159](https://github.com/ceramicnetwork/js-ceramic/issues/2159)) ([cd195c9](https://github.com/ceramicnetwork/js-ceramic/commit/cd195c924b3316ded5d33f708c6781e1b6f49543))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* `count` endpoint ([#2463](https://github.com/ceramicnetwork/js-ceramic/issues/2463)) ([6556596](https://github.com/ceramicnetwork/js-ceramic/commit/65565965d22fa924e2b372dd34002378ea7808ef))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add allowQueriesBeforeHistoricalSync flag to config ([#2289](https://github.com/ceramicnetwork/js-ceramic/issues/2289)) ([cf68d7e](https://github.com/ceramicnetwork/js-ceramic/commit/cf68d7e832368b1d59fc002f45654d5e0ad64f16))
* add dummy implementation of IndexClientApi to core and http-client ([#2200](https://github.com/ceramicnetwork/js-ceramic/issues/2200)) ([aaf6fe3](https://github.com/ceramicnetwork/js-ceramic/commit/aaf6fe33df0be3d44e10d4b7e47e3fca9c86e2c2)), closes [#2201](https://github.com/ceramicnetwork/js-ceramic/issues/2201)
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* add gnosis chain and goerli to supported networks [NET-1556] ([#2239](https://github.com/ceramicnetwork/js-ceramic/issues/2239)) ([25877cf](https://github.com/ceramicnetwork/js-ceramic/commit/25877cfcc14001f1fee660e62bedb1932ea4f1d6))
* Add InsertionOrder and remove ChronologicalOrder ([#2218](https://github.com/ceramicnetwork/js-ceramic/issues/2218)) ([4f98136](https://github.com/ceramicnetwork/js-ceramic/commit/4f981368e658c18e74d59efbd370b9311ece3008))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Attempt to limit concurrent S3 reads ([#2219](https://github.com/ceramicnetwork/js-ceramic/issues/2219)) ([bac9378](https://github.com/ceramicnetwork/js-ceramic/commit/bac937838122346a2be963f1ec110634cfad7dcc))
* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* Bypass maxEventListeners warning by using homegrown signalling ([#2411](https://github.com/ceramicnetwork/js-ceramic/issues/2411)) ([bbe17cd](https://github.com/ceramicnetwork/js-ceramic/commit/bbe17cdcc3794e00f3ed519d49da41afd27f25ba))
* Ceramic asks CAS to anchor indefinitely until some ok response ([#2441](https://github.com/ceramicnetwork/js-ceramic/issues/2441)) ([18150a9](https://github.com/ceramicnetwork/js-ceramic/commit/18150a93183700a8e3e45f253b639cdacabc9d69))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Chronological order for indexing, SQLite-only ([#2184](https://github.com/ceramicnetwork/js-ceramic/issues/2184)) ([e202ea7](https://github.com/ceramicnetwork/js-ceramic/commit/e202ea7e4ce82225452118e0dce50d6b1957f62c))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common:** Update type definitions to support simple relations ([#2421](https://github.com/ceramicnetwork/js-ceramic/issues/2421)) ([a4c4ce3](https://github.com/ceramicnetwork/js-ceramic/commit/a4c4ce303603c2ddad3e1e51026c4a8205a91188))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,cli:** Remove unused 'validate-streams' config option ([#2147](https://github.com/ceramicnetwork/js-ceramic/issues/2147)) ([90c6470](https://github.com/ceramicnetwork/js-ceramic/commit/90c647060c9db26f6b060fbcfe48ec46161cb810))
* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. ([#2481](https://github.com/ceramicnetwork/js-ceramic/issues/2481)) ([52a8c50](https://github.com/ceramicnetwork/js-ceramic/commit/52a8c502ec1da7e920e1c83dfc0de2013fd09420))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features ([#2405](https://github.com/ceramicnetwork/js-ceramic/issues/2405)) ([f0435ac](https://github.com/ceramicnetwork/js-ceramic/commit/f0435ac38f366afc5f2115cab67d996b4095ed5f))
* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add anchor status for READY requests([#2325](https://github.com/ceramicnetwork/js-ceramic/issues/2325)) ([c9d4bbb](https://github.com/ceramicnetwork/js-ceramic/commit/c9d4bbbe9005eeeae62e7b4850ba9e19b1ef7749))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))
* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))
* **core:** add family to pubsub update messages ([e2fef67](https://github.com/ceramicnetwork/js-ceramic/commit/e2fef67fde82c9134eba4a771f9ff5adc8f84836))
* **core:** Add functionality for building tables with columns for relations ([#2435](https://github.com/ceramicnetwork/js-ceramic/issues/2435)) ([1da2e65](https://github.com/ceramicnetwork/js-ceramic/commit/1da2e658584d745d205ce9612400829d2dbe41a7))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** add stream to index api http ([#2252](https://github.com/ceramicnetwork/js-ceramic/issues/2252)) ([001233b](https://github.com/ceramicnetwork/js-ceramic/commit/001233b40c754a85dd40becdbe9ee01c1b8749a8))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Allow setting network to mainnet ([#2491](https://github.com/ceramicnetwork/js-ceramic/issues/2491)) ([b4c5958](https://github.com/ceramicnetwork/js-ceramic/commit/b4c595867ed6daeb03102aff58d951a5d149777e))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries ([#2455](https://github.com/ceramicnetwork/js-ceramic/issues/2455)) ([fbe04b5](https://github.com/ceramicnetwork/js-ceramic/commit/fbe04b526dd662a59d355e29e68d5c741d5c0dd7))
* **core:** implement `ceramic_models` indexing config table ([#2449](https://github.com/ceramicnetwork/js-ceramic/issues/2449)) ([33e3c09](https://github.com/ceramicnetwork/js-ceramic/commit/33e3c0969c0161d5dc17b55501775385241066be))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Load Model relations when indexing a new Model ([#2447](https://github.com/ceramicnetwork/js-ceramic/issues/2447)) ([3c87ea7](https://github.com/ceramicnetwork/js-ceramic/commit/3c87ea72ff2fa12f031ca67abe08f9b409f4486c))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** MID table schema validation on node startup ([#2320](https://github.com/ceramicnetwork/js-ceramic/issues/2320)) ([ffdc92b](https://github.com/ceramicnetwork/js-ceramic/commit/ffdc92ba8f14792294ca6babdeb781654eed47f8))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** Pinning a ModelInstanceDocument should also pin its Model ([#2319](https://github.com/ceramicnetwork/js-ceramic/issues/2319)) ([6df9ae9](https://github.com/ceramicnetwork/js-ceramic/commit/6df9ae91afaa3beea8cd70cba1aebbc0ea188dbc))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** replace cas-dev for dev-unstable with cas-qa ([#2144](https://github.com/ceramicnetwork/js-ceramic/issues/2144)) ([e8ef8c0](https://github.com/ceramicnetwork/js-ceramic/commit/e8ef8c00041c9dc6239e338d9be78f7ee9da2474))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Sanity check that IPFS node has data for 1 random pinned stream at startup. ([#2093](https://github.com/ceramicnetwork/js-ceramic/issues/2093)) ([f7d0f67](https://github.com/ceramicnetwork/js-ceramic/commit/f7d0f67a2f6269f1a5488615a53e1f3b4e1c8d18))
* **core:** Setup database connection for indexing, SQLite only ([#2167](https://github.com/ceramicnetwork/js-ceramic/issues/2167)) ([3d63ccc](https://github.com/ceramicnetwork/js-ceramic/commit/3d63ccca02bee96ac5775ada38686c6065307b57))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core:** Throw clear error and log warning when querying a model that isn't indexed ([#2467](https://github.com/ceramicnetwork/js-ceramic/issues/2467)) ([e79f157](https://github.com/ceramicnetwork/js-ceramic/commit/e79f157b1e391c110b3acb7d638d679b517b3a44))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))
* Create table per indexed model ([#2179](https://github.com/ceramicnetwork/js-ceramic/issues/2179)) ([f917846](https://github.com/ceramicnetwork/js-ceramic/commit/f917846cd3f23357ebb089c09578e11288ee58a9))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* gitgnore generated version.ts file ([#2205](https://github.com/ceramicnetwork/js-ceramic/issues/2205)) ([395509c](https://github.com/ceramicnetwork/js-ceramic/commit/395509c79e5e7c5da5bd4d7ed39e6cc521e6ad65))
* HTTP endpoint - it works ([#2210](https://github.com/ceramicnetwork/js-ceramic/issues/2210)) ([28bf9aa](https://github.com/ceramicnetwork/js-ceramic/commit/28bf9aa9bc5338130d7eb2a0f8691d04edc7f1a9))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))
* Make SYNC_ALWAYS rewrite and revalidate local state ([#2410](https://github.com/ceramicnetwork/js-ceramic/issues/2410)) ([24caa20](https://github.com/ceramicnetwork/js-ceramic/commit/24caa202c5d7d85dba66b6f104e094316145dad5))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Parallelise table operations in database apis ([#2541](https://github.com/ceramicnetwork/js-ceramic/issues/2541)) ([882dede](https://github.com/ceramicnetwork/js-ceramic/commit/882dede57dc2fa9fe0b59f6258524d30bb64aab3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))
* Rate-limit a warning about messages over a rate-limit ([#2424](https://github.com/ceramicnetwork/js-ceramic/issues/2424)) ([0b51309](https://github.com/ceramicnetwork/js-ceramic/commit/0b51309be704196e1beade5c67c444b7064f76d7))
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API ([#2196](https://github.com/ceramicnetwork/js-ceramic/issues/2196)) ([3ecf9fd](https://github.com/ceramicnetwork/js-ceramic/commit/3ecf9fdb1f0c573b9784337b80fc1c985e3d499c))
* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* update dids, add/register cacao verifiers ([#2452](https://github.com/ceramicnetwork/js-ceramic/issues/2452)) ([d93fedb](https://github.com/ceramicnetwork/js-ceramic/commit/d93fedbb96f17b974f7e07f78aefa67790d8930e))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* Use StaticJsonRpcProvider in EthereumAnchorValidator ([#2471](https://github.com/ceramicnetwork/js-ceramic/issues/2471)) ([6c4988f](https://github.com/ceramicnetwork/js-ceramic/commit/6c4988fcf27c5f0687114bb1585e36d35bc62e6e))
* warn at startup if runs SQLite in production ([#2254](https://github.com/ceramicnetwork/js-ceramic/issues/2254)) ([425b8ed](https://github.com/ceramicnetwork/js-ceramic/commit/425b8edea9d1d01e62d4650ae5c442d4bbaae208))
* warn if indexing is not configured ([#2194](https://github.com/ceramicnetwork/js-ceramic/issues/2194)) ([6985549](https://github.com/ceramicnetwork/js-ceramic/commit/69855496e98b610bd62abfe42c013f127754f6f8))


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [2.17.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.17.0-rc.0...@ceramicnetwork/core@2.17.0) (2022-11-09)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.17.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.16.0-rc.0...@ceramicnetwork/core@2.17.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.16.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.15.0-rc.0...@ceramicnetwork/core@2.16.0-rc.0) (2022-11-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.15.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.14.0...@ceramicnetwork/core@2.15.0-rc.0) (2022-11-03)


### Bug Fixes

* **stream-handler-common:** Fix loading of historical commits with CACAOs ([#2523](https://github.com/ceramicnetwork/js-ceramic/issues/2523)) ([329f1c8](https://github.com/ceramicnetwork/js-ceramic/commit/329f1c8457bd04bf9619fed0bba8f89afabd0b7e))





# [2.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.14.0-rc.0...@ceramicnetwork/core@2.14.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.14.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.12.0-rc.0...@ceramicnetwork/core@2.14.0-rc.0) (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/core





# 2.13.0-rc.0 (2022-10-24)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.12.0-rc.0](/compare/@ceramicnetwork/core@2.11.0...@ceramicnetwork/core@2.12.0-rc.0) (2022-10-19)


### Features

* **core:** Allow setting network to mainnet (#2491) b4c5958, closes #2491





# [2.11.0](/compare/@ceramicnetwork/core@2.11.0-rc.1...@ceramicnetwork/core@2.11.0) (2022-10-05)


### Bug Fixes

* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different (#2479) d83c739, closes #2479


### Features

* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. (#2481) 52a8c50, closes #2481





# [2.11.0-rc.2](/compare/@ceramicnetwork/core@2.11.0-rc.1...@ceramicnetwork/core@2.11.0-rc.2) (2022-10-04)


### Bug Fixes

* **core, http-client, common:** Remove AdminApi from CeramicAPI since the implementations are different (#2479) d83c739, closes #2479


### Features

* **core,common,http-client:** Standardize AdminAPI implementations to not take DID argument. (#2481) 52a8c50, closes #2481





# [2.11.0-rc.1](/compare/@ceramicnetwork/core@2.11.0-rc.0...@ceramicnetwork/core@2.11.0-rc.1) (2022-09-30)


### Features

* **core:** Throw clear error and log warning when querying a model that isn't indexed (#2467) e79f157, closes #2467
* Use StaticJsonRpcProvider in EthereumAnchorValidator (#2471) 6c4988f, closes #2471





# [2.11.0-rc.0](/compare/@ceramicnetwork/core@2.10.0...@ceramicnetwork/core@2.11.0-rc.0) (2022-09-28)


### Bug Fixes

* **core:** Don't fail to start up if indexing section is missing from config file (#2454) fb4936e, closes #2454


### Features

* `count` endpoint (#2463) 6556596, closes #2463
* Ceramic asks CAS to anchor indefinitely until some ok response (#2441) 18150a9, closes #2441
* **core:** Add functionality for building tables with columns for relations (#2435) 1da2e65, closes #2435
* **core:** Extract relation fields from MIDs and add to database, plus add filter capability to queries (#2455) fbe04b5, closes #2455
* **core:** implement `ceramic_models` indexing config table (#2449) 33e3c09, closes #2449
* **core:** Load Model relations when indexing a new Model (#2447) 3c87ea7, closes #2447
* update dids, add/register cacao verifiers (#2452) d93fedb, closes #2452





# [2.10.0](/compare/@ceramicnetwork/core@2.10.0-rc.3...@ceramicnetwork/core@2.10.0) (2022-09-21)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.10.0-rc.3](/compare/@ceramicnetwork/core@2.10.0-rc.2...@ceramicnetwork/core@2.10.0-rc.3) (2022-09-20)


### Features

* **common:** Update type definitions to support simple relations (#2421) a4c4ce3, closes #2421
* Rate-limit a warning about messages over a rate-limit (#2424) 0b51309, closes #2424





# [2.10.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.10.0-rc.1...@ceramicnetwork/core@2.10.0-rc.2) (2022-09-15)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.10.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.10.0-rc.0...@ceramicnetwork/core@2.10.0-rc.1) (2022-09-14)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.10.0-rc.0](/compare/@ceramicnetwork/core@2.9.0...@ceramicnetwork/core@2.10.0-rc.0) (2022-09-13)


### Features

* Bypass maxEventListeners warning by using homegrown signalling (#2411) bbe17cd, closes #2411





# [2.9.0](/compare/@ceramicnetwork/core@2.9.0-rc.1...@ceramicnetwork/core@2.9.0) (2022-09-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.9.0-rc.1](/compare/@ceramicnetwork/core@2.9.0-rc.0...@ceramicnetwork/core@2.9.0-rc.1) (2022-09-06)


### Features

* Make SYNC_ALWAYS rewrite and revalidate local state (#2410) 24caa20, closes #2410





# [2.9.0-rc.0](/compare/@ceramicnetwork/core@2.8.1-rc.0...@ceramicnetwork/core@2.9.0-rc.0) (2022-09-06)


### Bug Fixes

* **core:** Allow fast-forward of a stream state if newer commit is anchored (#2398) d4085aa, closes #2398
* **core:** Pinning a stream should mark it as synced (#2394) 8e2fbf6, closes #2394
* **core:** Use package, not relative path to metrics (#2393) 0d8e50a, closes #2393
* evaluate string value of env vars as booleans (#2382) 2837112, closes #2382


### Features

* **core,stream-model-handler,stream-model-instance-handler:** Rename env var for enabling ComposeDB features (#2405) f0435ac, closes #2405





## [2.8.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.8.0...@ceramicnetwork/core@2.8.1-rc.0) (2022-08-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.8.0-rc.2...@ceramicnetwork/core@2.8.0) (2022-08-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.8.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.7.2...@ceramicnetwork/core@2.8.0-rc.2) (2022-08-20)


### Bug Fixes

* **core:** Add default endpoint for gnosis ([#2366](https://github.com/ceramicnetwork/js-ceramic/issues/2366)) ([3e53142](https://github.com/ceramicnetwork/js-ceramic/commit/3e531428df28b811687186b6ebd7415a1cd3fec9))
* **core:** check value of indexing env var ([#2363](https://github.com/ceramicnetwork/js-ceramic/issues/2363)) ([147cebc](https://github.com/ceramicnetwork/js-ceramic/commit/147cebccb8aae66df4aa8c30cb64561c74a1b40d))


### Features

* **cli:** Enable ceramic --version flag ([#2339](https://github.com/ceramicnetwork/js-ceramic/issues/2339)) ([df53df4](https://github.com/ceramicnetwork/js-ceramic/commit/df53df49a480884d9d97da452a19a6e96a0633a4))
* **core:** Add stream from pubsub for UPDATE msg types ([#2317](https://github.com/ceramicnetwork/js-ceramic/issues/2317)) ([413b644](https://github.com/ceramicnetwork/js-ceramic/commit/413b64490cfeb1a8430ecedaaeb55f106e103e2a))
* **core:** Add tests and validation for anchor smart contract address ([#2367](https://github.com/ceramicnetwork/js-ceramic/issues/2367)) ([936705c](https://github.com/ceramicnetwork/js-ceramic/commit/936705cd5e241dadf101dea20642169822bfd5ff))
* **core:** parse smart contract tx that anchors a 32 byte hash ([#2379](https://github.com/ceramicnetwork/js-ceramic/issues/2379)) ([0cd3a36](https://github.com/ceramicnetwork/js-ceramic/commit/0cd3a36914216b5b0dee385eb5b54bef280b632b))
* **core:** working implementation of indexable anchors Phase 2 ([#2315](https://github.com/ceramicnetwork/js-ceramic/issues/2315)) ([987cd43](https://github.com/ceramicnetwork/js-ceramic/commit/987cd43fa5d6f0a8bac1aefc28e8b181e33b62cb))






## [2.7.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.7.1...@ceramicnetwork/core@2.7.2) (2022-08-19)

**Note:** Version bump only for package @ceramicnetwork/core






## [2.7.1](/compare/@ceramicnetwork/core@2.7.0...@ceramicnetwork/core@2.7.1) (2022-08-11)


### Bug Fixes

* **core:** Add default endpoint for gnosis (#2366) 319adf2, closes #2366





# [2.7.0](/compare/@ceramicnetwork/core@2.7.0-rc.2...@ceramicnetwork/core@2.7.0) (2022-08-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.7.0-rc.2](/compare/@ceramicnetwork/core@2.7.0-rc.1...@ceramicnetwork/core@2.7.0-rc.2) (2022-07-26)


### Bug Fixes

* **core:** Detect model model index table and don't recreate (#2340) cc83b3b, closes #2340


### Features

* **core:** Add anchor status for READY requests(#2325) c9d4bbb, closes #2325
* **core:** MID table schema validation on node startup (#2320) ffdc92b, closes #2320
* **core:** Pinning a ModelInstanceDocument should also pin its Model (#2319) 6df9ae9, closes #2319





# [2.7.0-rc.1](/compare/@ceramicnetwork/core@2.7.0-rc.0...@ceramicnetwork/core@2.7.0-rc.1) (2022-07-14)


### Bug Fixes

* **core:** Don't unpin anchor proof, merkle tree, or CACAO when unpinning streams (#2307) 5b9773a, closes #2307


### Features

* Add allowQueriesBeforeHistoricalSync flag to config (#2289) cf68d7e, closes #2289





# [2.7.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.6.0...@ceramicnetwork/core@2.7.0-rc.0) (2022-07-06)


### Features

* **core,model-handler,model-instance-handler:** Disable indexing and query features by default until they are ready ([#2280](https://github.com/ceramicnetwork/js-ceramic/issues/2280)) ([acb010c](https://github.com/ceramicnetwork/js-ceramic/commit/acb010ccb9ced4b2228f574e4325806a4a2d7241))
* **core:** Postgres MID table creation and indexing ([#2288](https://github.com/ceramicnetwork/js-ceramic/issues/2288)) ([2406073](https://github.com/ceramicnetwork/js-ceramic/commit/2406073b7b34a080be505f612b1596f8bf866a5b))
* Store first anchored time in the indexing database ([#2287](https://github.com/ceramicnetwork/js-ceramic/issues/2287)) ([35a7e3e](https://github.com/ceramicnetwork/js-ceramic/commit/35a7e3ee838ae775306e4cd748300e6acf3fb101))





# [2.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.6.0-rc.1...@ceramicnetwork/core@2.6.0) (2022-07-06)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.6.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.6.0-rc.0...@ceramicnetwork/core@2.6.0-rc.1) (2022-06-30)


### Features

* Add a method to CeramicAPI that transforms raw StreamState to an instance of Streamtype ([#2286](https://github.com/ceramicnetwork/js-ceramic/issues/2286)) ([9475ccc](https://github.com/ceramicnetwork/js-ceramic/commit/9475ccc6b1c43ad4c3101bdf77bd98fcea6fedf8))
* Add edge cursors and use expected order ([#2282](https://github.com/ceramicnetwork/js-ceramic/issues/2282)) ([87d8e3f](https://github.com/ceramicnetwork/js-ceramic/commit/87d8e3fc65b7a1743111b4a1105513fd4e98a42b))
* Remove AbortController polyfill ([#2278](https://github.com/ceramicnetwork/js-ceramic/issues/2278)) ([65b9bee](https://github.com/ceramicnetwork/js-ceramic/commit/65b9beedafa108c07d4c7080c038061c35b88110))
* **stream-caip-10-link, stream-model, stream-model-instance, stream-tile:** Use 'controller' instead of 'controllers' in metadata ([#2251](https://github.com/ceramicnetwork/js-ceramic/issues/2251)) ([f0b94f6](https://github.com/ceramicnetwork/js-ceramic/commit/f0b94f62d490a8519eabc88e009ecc56a1784b11))





# [2.6.0-rc.0](/compare/@ceramicnetwork/core@2.5.1...@ceramicnetwork/core@2.6.0-rc.0) (2022-06-27)


### Bug Fixes

* **core:** fix startup error from broken import (#2255) 6c847aa, closes #2255
* **core:** Only use the execution and loading queues when applying commits or loading over pubsub (#2259) 99393e2, closes #2259
* **core:** StreamID comes from genesis commit CID, not tip (#2256) ff1e3db, closes #2256


### Features

* add gnosis chain and goerli to supported networks [NET-1556] (#2239) 25877cf, closes #2239
* Attempt to limit concurrent S3 reads (#2219) bac9378, closes #2219
* **core:** add stream to index api http (#2252) 001233b, closes #2252
* warn at startup if runs SQLite in production (#2254) 425b8ed, closes #2254





## [2.5.1](/compare/@ceramicnetwork/core@2.5.1-rc.0...@ceramicnetwork/core@2.5.1) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/core





## [2.5.1-rc.0](/compare/@ceramicnetwork/core@2.5.0...@ceramicnetwork/core@2.5.1-rc.0) (2022-06-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.5.0](/compare/@ceramicnetwork/core@2.5.0-rc.5...@ceramicnetwork/core@2.5.0) (2022-06-17)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.5.0-rc.5](/compare/@ceramicnetwork/core@2.5.0-rc.4...@ceramicnetwork/core@2.5.0-rc.5) (2022-06-17)


### Bug Fixes

* **core:** Creating a stream via a multiquery should pin it (#2236) f6f6b55, closes #2236


### Features

* Add InsertionOrder and remove ChronologicalOrder (#2218) 4f98136, closes #2218





# [2.5.0-rc.4](/compare/@ceramicnetwork/core@2.5.0-rc.3...@ceramicnetwork/core@2.5.0-rc.4) (2022-06-14)


### Bug Fixes

* **cli:** fix metrics import and dependency (#2227) c418347, closes #2227





# [2.5.0-rc.3](/compare/@ceramicnetwork/core@2.5.0-rc.2...@ceramicnetwork/core@2.5.0-rc.3) (2022-06-13)


### Bug Fixes

* **core:** Depend on the right version of metrics package 2d12605





# [2.5.0-rc.2](/compare/@ceramicnetwork/core@2.5.0-rc.0...@ceramicnetwork/core@2.5.0-rc.2) (2022-06-13)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.5.0-rc.0](/compare/@ceramicnetwork/core@2.4.0...@ceramicnetwork/core@2.5.0-rc.0) (2022-06-13)


### Features

* **core:** add family to pubsub update messages e2fef67
* HTTP endpoint - it works (#2210) 28bf9aa, closes #2210





# [2.4.0](/compare/@ceramicnetwork/core@2.3.1...@ceramicnetwork/core@2.4.0) (2022-06-06)


### Bug Fixes

* Filter by account (#2202) d50e3ac, closes #2202
* **stream-tile, stream-tile-handler:** don't allow updating controllers to invalid values (#2159) cd195c9, closes #2159


### Features

* add dummy implementation of IndexClientApi to core and http-client (#2200) aaf6fe3, closes #2200 #2201
* Chronological order for indexing, SQLite-only (#2184) e202ea7, closes #2184
* **core:** Setup database connection for indexing, SQLite only (#2167) 3d63ccc, closes #2167
* Create table per indexed model (#2179) f917846, closes #2179
* gitgnore generated version.ts file (#2205) 395509c, closes #2205
* **stream-model-instance, stream-model-instance-handler:** ModelInstanceDocument API (#2196) 3ecf9fd, closes #2196
* warn if indexing is not configured (#2194) 6985549, closes #2194





## [2.3.1](/compare/@ceramicnetwork/core@2.3.1-rc.2...@ceramicnetwork/core@2.3.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/core





## [2.3.1-rc.2](/compare/@ceramicnetwork/core@2.3.1-rc.1...@ceramicnetwork/core@2.3.1-rc.2) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/core





## [2.3.1-rc.1](/compare/@ceramicnetwork/core@2.3.0...@ceramicnetwork/core@2.3.1-rc.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.3.0](/compare/@ceramicnetwork/core@2.2.1...@ceramicnetwork/core@2.3.0) (2022-05-18)


### Features

* **core,cli:** Remove unused 'validate-streams' config option (#2147) 90c6470, closes #2147
* **core:** replace cas-dev for dev-unstable with cas-qa (#2144) e8ef8c0, closes #2144





## [2.2.1](/compare/@ceramicnetwork/core@2.2.0-rc.4...@ceramicnetwork/core@2.2.1) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.2.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.2.0-rc.3...@ceramicnetwork/core@2.2.0-rc.4) (2022-05-18)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.2.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.2.0-rc.1...@ceramicnetwork/core@2.2.0-rc.3) (2022-05-12)

**Note:** Version bump only for package @ceramicnetwork/core





# 2.2.0-rc.2 (2022-05-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.2.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.2.0-rc.0...@ceramicnetwork/core@2.2.0-rc.1) (2022-05-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.2.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.1.2-rc.1...@ceramicnetwork/core@2.2.0-rc.0) (2022-05-11)


### Bug Fixes

* **core:** add .jsipfs detection to startup check ([#2148](https://github.com/ceramicnetwork/js-ceramic/issues/2148)) ([c236173](https://github.com/ceramicnetwork/js-ceramic/commit/c236173802990f0d60e01fadfa483fbb64d2e96d))


### Features

* **stream-tile:** use dids capability iss as controller when capabil… ([#2138](https://github.com/ceramicnetwork/js-ceramic/issues/2138)) ([a924fec](https://github.com/ceramicnetwork/js-ceramic/commit/a924fec1bf660d68d713f28ef41ee1229c7c754f))





## [2.1.2-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.1.2-rc.0...@ceramicnetwork/core@2.1.2-rc.1) (2022-04-27)

**Note:** Version bump only for package @ceramicnetwork/core





## [2.1.2-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.1.1...@ceramicnetwork/core@2.1.2-rc.0) (2022-04-26)


### Bug Fixes

* **core:** Export pusub message in index ([#2128](https://github.com/ceramicnetwork/js-ceramic/issues/2128)) ([bf943dc](https://github.com/ceramicnetwork/js-ceramic/commit/bf943dc348ed3e1d5ce48b5032a44392858c85a6))





## [2.1.1](/compare/@ceramicnetwork/core@2.1.1-rc.0...@ceramicnetwork/core@2.1.1) (2022-04-20)

**Note:** Version bump only for package @ceramicnetwork/core





## [2.1.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.1.0...@ceramicnetwork/core@2.1.1-rc.0) (2022-04-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.1.0](/compare/@ceramicnetwork/core@2.1.0-rc.0...@ceramicnetwork/core@2.1.0) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.1.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0...@ceramicnetwork/core@2.1.0-rc.0) (2022-04-19)


### Features

* **core:** Add env var to skip ipfs data persistence check at startup ([#2125](https://github.com/ceramicnetwork/js-ceramic/issues/2125)) ([a03bc30](https://github.com/ceramicnetwork/js-ceramic/commit/a03bc30199c9fadf94fc208d29c37c56041405ee))





# [2.0.0](/compare/@ceramicnetwork/core@2.0.0-rc.5...@ceramicnetwork/core@2.0.0) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.0.0-rc.5](/compare/@ceramicnetwork/core@2.0.0-rc.4...@ceramicnetwork/core@2.0.0-rc.5) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.0.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-rc.3...@ceramicnetwork/core@2.0.0-rc.4) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.0.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-rc.2...@ceramicnetwork/core@2.0.0-rc.3) (2022-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.0.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-rc.1...@ceramicnetwork/core@2.0.0-rc.2) (2022-04-18)


### Features

* **core:** Add env variable for configuring stream cache size ([#2120](https://github.com/ceramicnetwork/js-ceramic/issues/2120)) ([e5d72c1](https://github.com/ceramicnetwork/js-ceramic/commit/e5d72c1e5cba05c4fc372aa31dfeb9ada31fa928))





# [2.0.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-rc.0...@ceramicnetwork/core@2.0.0-rc.1) (2022-04-18)


### Features

* **core:** export pubsub message ([7e8e8e4](https://github.com/ceramicnetwork/js-ceramic/commit/7e8e8e40c8af80d9dc026beb1365e1790e53f4a1))
* Log when stream with subscriptions is evicted ([#2107](https://github.com/ceramicnetwork/js-ceramic/issues/2107)) ([2ea85fa](https://github.com/ceramicnetwork/js-ceramic/commit/2ea85fa9d272f19286d84ba4ddcb76583c0dbf02))





# 2.0.0-rc.0 (2022-03-31)

**Note:** Version bump only for package @ceramicnetwork/core





# [2.0.0-alpha.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-alpha.3...@ceramicnetwork/core@2.0.0-alpha.4) (2022-03-24)


### Features

* polyfill AbortController, so that Ceramic node works on Node.js v14 ([#2090](https://github.com/ceramicnetwork/js-ceramic/issues/2090)) ([fff3e8a](https://github.com/ceramicnetwork/js-ceramic/commit/fff3e8a18ef7d2ba86c80743f61f0487dae3e129))





# [2.0.0-alpha.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-alpha.2...@ceramicnetwork/core@2.0.0-alpha.3) (2022-03-03)


### Bug Fixes

* **core:** Re-enable dispatcher-real-ipfs.test.ts ([#2037](https://github.com/ceramicnetwork/js-ceramic/issues/2037)) ([d06392d](https://github.com/ceramicnetwork/js-ceramic/commit/d06392da6e5fc618501240d9bbad25c2a4f778cd))
* revert `format` changes and set `keepalive: false` in HTTP(S) agent to IPFS ([#2065](https://github.com/ceramicnetwork/js-ceramic/issues/2065)) ([b0b5e70](https://github.com/ceramicnetwork/js-ceramic/commit/b0b5e701b569d746b9b8e68ac973d4e705f78af5))
* socket hangup bug ([#2061](https://github.com/ceramicnetwork/js-ceramic/issues/2061)) ([3147fb7](https://github.com/ceramicnetwork/js-ceramic/commit/3147fb7749b08e216cf31c2bcea55693868f4cf2))
* typo in block.put() API call updates ([9d0e286](https://github.com/ceramicnetwork/js-ceramic/commit/9d0e286913730d90c40e00ed2fafd0726db24672))


### Features

* Transition remaining tests to pure ESM ([#2044](https://github.com/ceramicnetwork/js-ceramic/issues/2044)) ([0848eb5](https://github.com/ceramicnetwork/js-ceramic/commit/0848eb59741a2b940de9dd76df94bd8948bae637))





# [2.0.0-alpha.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@2.0.0-alpha.1...@ceramicnetwork/core@2.0.0-alpha.2) (2022-02-10)


### Bug Fixes

* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))


### Features

* **core,stream-tile,stream-caip10-link:** Pin streams by default ([#2025](https://github.com/ceramicnetwork/js-ceramic/issues/2025)) ([463fecd](https://github.com/ceramicnetwork/js-ceramic/commit/463fecdca5f20373d78fb7775d2ad4825c576397))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Throw error if commit rejected by conflict resolution ([#2009](https://github.com/ceramicnetwork/js-ceramic/issues/2009)) ([998ac5e](https://github.com/ceramicnetwork/js-ceramic/commit/998ac5e2e7658bc523f803d99b80e65f8604dee3))





# [2.0.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1-rc.10...@ceramicnetwork/core@2.0.0-alpha.1) (2022-01-14)


### Features

* First stab at go-ipfs inclusion ([#1933](https://github.com/ceramicnetwork/js-ceramic/issues/1933)) ([9f29300](https://github.com/ceramicnetwork/js-ceramic/commit/9f29300a0b0f986dda476f99784e7bfcb62dcef4)), closes [#1935](https://github.com/ceramicnetwork/js-ceramic/issues/1935)
* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))





# [2.0.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1-rc.10...@ceramicnetwork/core@2.0.0-alpha.0) (2021-12-07)


### Features

* Re-apply Caip version update and format change ([#1896](https://github.com/ceramicnetwork/js-ceramic/issues/1896)) ([be875de](https://github.com/ceramicnetwork/js-ceramic/commit/be875de3e9a5b54605c6d20b9610a52f8267e0ce))





## [1.13.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.13.0...@ceramicnetwork/core@1.13.1-rc.0) (2022-01-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.13.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.12.3...@ceramicnetwork/core@1.13.0) (2022-01-12)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))
* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix ipfs retries when using ipfs http client ([#1949](https://github.com/ceramicnetwork/js-ceramic/issues/1949)) ([953df1e](https://github.com/ceramicnetwork/js-ceramic/commit/953df1e45a16285d234a9db5c0fd9e023a47e998))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))
* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))
* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)
* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





## [1.12.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.12.2...@ceramicnetwork/core@1.12.3) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.12.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.12.1...@ceramicnetwork/core@1.12.2) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.12.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.12.0...@ceramicnetwork/core@1.12.1) (2022-01-09)

**Note:** Version bump only for package @ceramicnetwork/core






# [1.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.12.0-rc.0...@ceramicnetwork/core@1.12.0) (2021-12-23)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.12.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.2...@ceramicnetwork/core@1.12.0-rc.0) (2021-12-23)


### Bug Fixes

* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1956](https://github.com/ceramicnetwork/js-ceramic/issues/1956)) ([28cfd62](https://github.com/ceramicnetwork/js-ceramic/commit/28cfd622e684b3b7209884024e684be6e6a1fa88))


### Features

* **core:** Add env var to configure pubsub qps limit ([#1947](https://github.com/ceramicnetwork/js-ceramic/issues/1947)) ([05e5f1c](https://github.com/ceramicnetwork/js-ceramic/commit/05e5f1cf51611cbdc651c37f10bad39ea833365f))
* **core:** Don't fail queries when query pubsub queue is full ([#1955](https://github.com/ceramicnetwork/js-ceramic/issues/1955)) ([bdd9127](https://github.com/ceramicnetwork/js-ceramic/commit/bdd91273b0e46cec7804473a36d8bf5d5ef1e5e9))





## [1.11.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.2-rc.2...@ceramicnetwork/core@1.11.2) (2021-12-08)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.2-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.2-rc.1...@ceramicnetwork/core@1.11.2-rc.2) (2021-12-08)


### Bug Fixes

* **core:** Load commits serially again ([#1920](https://github.com/ceramicnetwork/js-ceramic/issues/1920)) ([8c73805](https://github.com/ceramicnetwork/js-ceramic/commit/8c73805991e1f3d960f5451af8fa795fb260fef2))





## [1.11.2-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.2-rc.0...@ceramicnetwork/core@1.11.2-rc.1) (2021-12-08)


### Bug Fixes

* **core:** Allow loading multiple CommitIDs for the same stream in parallel ([#1901](https://github.com/ceramicnetwork/js-ceramic/issues/1901)) ([3290a66](https://github.com/ceramicnetwork/js-ceramic/commit/3290a66db7f4063aac1df3781bef2962442740e2))





## [1.11.2-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1...@ceramicnetwork/core@1.11.2-rc.0) (2021-12-06)


### Bug Fixes

* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))





## [1.11.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1-rc.10...@ceramicnetwork/core@1.11.1) (2021-12-06)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1-rc.9...@ceramicnetwork/core@1.11.1-rc.10) (2021-12-06)


### Bug Fixes

* Revert Caip10 upgrade ([#1895](https://github.com/ceramicnetwork/js-ceramic/issues/1895)) ([1c376ef](https://github.com/ceramicnetwork/js-ceramic/commit/1c376ef92f4e93b6da819616cef4e5c7582c97e5))





## [1.11.1-rc.9](/compare/@ceramicnetwork/core@1.11.1-rc.8...@ceramicnetwork/core@1.11.1-rc.9) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.8](/compare/@ceramicnetwork/core@1.11.1-rc.6...@ceramicnetwork/core@1.11.1-rc.8) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.6](/compare/@ceramicnetwork/core@1.11.1-rc.4...@ceramicnetwork/core@1.11.1-rc.6) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.4](/compare/@ceramicnetwork/core@1.11.1-rc.2...@ceramicnetwork/core@1.11.1-rc.4) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.2](/compare/@ceramicnetwork/core@1.11.1-rc.1...@ceramicnetwork/core@1.11.1-rc.2) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.11.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.1-rc.0...@ceramicnetwork/core@1.11.1-rc.1) (2021-12-01)


### Reverts

* Revert "DEBUG DO NOT PUBLISH: add env var to disable peer discovery (#1878)" (#1879) ([1274a3d](https://github.com/ceramicnetwork/js-ceramic/commit/1274a3dbe48875514f9223c71a1038281a632961)), closes [#1878](https://github.com/ceramicnetwork/js-ceramic/issues/1878) [#1879](https://github.com/ceramicnetwork/js-ceramic/issues/1879)





## [1.11.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.0...@ceramicnetwork/core@1.11.1-rc.0) (2021-11-17)


### Bug Fixes

* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))





# [1.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.11.0-rc.0...@ceramicnetwork/core@1.11.0) (2021-11-17)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.11.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.10.0...@ceramicnetwork/core@1.11.0-rc.0) (2021-11-12)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** Reset RunningState pinned state on unpin ([#1821](https://github.com/ceramicnetwork/js-ceramic/issues/1821)) ([b4ddb2b](https://github.com/ceramicnetwork/js-ceramic/commit/b4ddb2b16bb2a0be0909ad6198ba0734eb205b70))
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Update running state's pinned commits when adding pins to pin store ([#1806](https://github.com/ceramicnetwork/js-ceramic/issues/1806)) ([e6c7067](https://github.com/ceramicnetwork/js-ceramic/commit/e6c70675b089362ba73cd04b44bd63444a5e6226))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.10.0-rc.0...@ceramicnetwork/core@1.10.0) (2021-11-12)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.10.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.9.0...@ceramicnetwork/core@1.10.0-rc.0) (2021-11-03)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** await expect statement in test ([#1791](https://github.com/ceramicnetwork/js-ceramic/issues/1791)) ([aa07618](https://github.com/ceramicnetwork/js-ceramic/commit/aa07618e464d2913c628ac6d0c97a5855bf256dd))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add argument to PinStore.add to provide already pinned commits and not re-pin them ([#1792](https://github.com/ceramicnetwork/js-ceramic/issues/1792)) ([072f954](https://github.com/ceramicnetwork/js-ceramic/commit/072f95483801c91b72b127aee307236df842407f))
* **core:** Add stateSource to runningState ([#1800](https://github.com/ceramicnetwork/js-ceramic/issues/1800)) ([ee36d77](https://github.com/ceramicnetwork/js-ceramic/commit/ee36d7780ede398d0ebe984f26238c213dddd5de))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.9.0-rc.0...@ceramicnetwork/core@1.9.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.9.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.8.2-rc.0...@ceramicnetwork/core@1.9.0-rc.0) (2021-10-28)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **blockchain-utils-validation, stream-caip10-link:** add clearDid fn, add DID validation to setDid, update DID regex ([#1783](https://github.com/ceramicnetwork/js-ceramic/issues/1783)) ([f233f86](https://github.com/ceramicnetwork/js-ceramic/commit/f233f862f257bae24eb2fd1ae2a36c8f10f8a51d))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **core:** CAS is now reponsible for informing Ceramic when to publish the AnchorCommit ([#1774](https://github.com/ceramicnetwork/js-ceramic/issues/1774)) ([ae82e0c](https://github.com/ceramicnetwork/js-ceramic/commit/ae82e0c32c7a4eb2ec4e0d93ed712f0e004e7714))
* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





## [1.8.2-rc.0](/compare/@ceramicnetwork/core@1.8.1...@ceramicnetwork/core@1.8.2-rc.0) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.8.1](/compare/@ceramicnetwork/core@1.8.0...@ceramicnetwork/core@1.8.1) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.8.0-rc.0...@ceramicnetwork/core@1.8.0) (2021-10-20)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.8.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.7.0...@ceramicnetwork/core@1.8.0-rc.0) (2021-10-14)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core:** use correct CID when retrieving Merkle tree parent ([6871b7d](https://github.com/ceramicnetwork/js-ceramic/commit/6871b7dcd27d08a727ae492754440309a563efc3))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* Support optional genesis property in multiquery API ([#1736](https://github.com/ceramicnetwork/js-ceramic/issues/1736)) ([3e08463](https://github.com/ceramicnetwork/js-ceramic/commit/3e084638467d2d8983835d3836aec3049ae82920))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** optimize document handler IPFS lookups ([2cb95df](https://github.com/ceramicnetwork/js-ceramic/commit/2cb95df549a531c0727d699f7953286ed5611efa))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.7.0-rc.2...@ceramicnetwork/core@1.7.0) (2021-10-14)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.7.0-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.7.0-rc.1...@ceramicnetwork/core@1.7.0-rc.2) (2021-09-18)


### Bug Fixes

* **ci:** minor fix for npm publish action along with dummy update in core to cause lerna to cause fresh RC to be published ([6bc4870](https://github.com/ceramicnetwork/js-ceramic/commit/6bc4870dac1dafb24ac0765f1142f8bcad5f00af))





# [1.7.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.7.0-rc.0...@ceramicnetwork/core@1.7.0-rc.1) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.7.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.6.0...@ceramicnetwork/core@1.7.0-rc.0) (2021-09-17)


### Bug Fixes

* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row ([35dae9d](https://github.com/ceramicnetwork/js-ceramic/commit/35dae9da8adbf11fdce9ee2327ffab49f75189bd))
* **core:** Add information for validating transactions on rinkeby ([#1510](https://github.com/ceramicnetwork/js-ceramic/issues/1510)) ([9a4cd0b](https://github.com/ceramicnetwork/js-ceramic/commit/9a4cd0bceea6e8acf9af3622f472259025481f26))
* **core:** Add retry logic when applying anchor commits ([#1393](https://github.com/ceramicnetwork/js-ceramic/issues/1393)) ([881d7f0](https://github.com/ceramicnetwork/js-ceramic/commit/881d7f0f17de820290ba6b5b7f4b19e00d2eed6c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([f5e38f1](https://github.com/ceramicnetwork/js-ceramic/commit/f5e38f19f20a4b9aa1b29bafc9eff4d01e326e9c))
* **core:** allow cas internal url ([#1723](https://github.com/ceramicnetwork/js-ceramic/issues/1723)) ([fb4c43d](https://github.com/ceramicnetwork/js-ceramic/commit/fb4c43d9918197cd697cea3101780f5f8871d420))
* **core:** Always subscribe to pubsub once on startup ([#1338](https://github.com/ceramicnetwork/js-ceramic/issues/1338)) ([b46c0a0](https://github.com/ceramicnetwork/js-ceramic/commit/b46c0a0cee01cb1076a7a271ff63426e357a446f))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([d2ac5db](https://github.com/ceramicnetwork/js-ceramic/commit/d2ac5dbbf7fb1f336b0bee4a4a5ce15fbc7db7d2))
* **core:** check for cas url equality ([#1725](https://github.com/ceramicnetwork/js-ceramic/issues/1725)) ([67db99e](https://github.com/ceramicnetwork/js-ceramic/commit/67db99e2b70a01d5dbf5dd61286b54f0eeb0acad))
* **core:** Continue polling anchor service even after error ([10719e7](https://github.com/ceramicnetwork/js-ceramic/commit/10719e7c6298cc7d36bea35e3f134c2b494e3e09))
* **core:** convert pubsub seqno to string ([#1543](https://github.com/ceramicnetwork/js-ceramic/issues/1543)) ([a96d932](https://github.com/ceramicnetwork/js-ceramic/commit/a96d932219367e3d546c217f01d7c3b22ac4402e))
* **core:** Disable ajv strictTypes and strictTuples log warnings ([#1471](https://github.com/ceramicnetwork/js-ceramic/issues/1471)) ([d3c817d](https://github.com/ceramicnetwork/js-ceramic/commit/d3c817d667874bbe08b78ae5e07dbda404750906))
* **core:** Don't refetch CID from IPFS when re-applying commits already in the log ([#1422](https://github.com/ceramicnetwork/js-ceramic/issues/1422)) ([b8a941c](https://github.com/ceramicnetwork/js-ceramic/commit/b8a941c9941b1c70473f3fd9f1497aaaff0d248d))
* **core:** Don't retry anchors indefinitely on error ([#1438](https://github.com/ceramicnetwork/js-ceramic/issues/1438)) ([69f4993](https://github.com/ceramicnetwork/js-ceramic/commit/69f499325157983ca14539f4f34c4497c4e47f07))
* **core:** Don't submit an anchor request for an AnchorCommit ([#1474](https://github.com/ceramicnetwork/js-ceramic/issues/1474)) ([356775f](https://github.com/ceramicnetwork/js-ceramic/commit/356775f9295a3130e7aa99783eb990ef19e02e02))
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip ([94ac4a7](https://github.com/ceramicnetwork/js-ceramic/commit/94ac4a703b0593c8ecfcc10c02ff55de003dc1a8))
* **core:** Fix startup of EthereumAnchorValidator ([#1512](https://github.com/ceramicnetwork/js-ceramic/issues/1512)) ([e8b87fa](https://github.com/ceramicnetwork/js-ceramic/commit/e8b87fa7c3b774d2116b6946041a5e37280ed51f))
* **core:** Increase max anchor poll timeout ([#1377](https://github.com/ceramicnetwork/js-ceramic/issues/1377)) ([37d6540](https://github.com/ceramicnetwork/js-ceramic/commit/37d65403461d8edbeacaff498bd1a09dee750290))
* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* **core:** Only poll for anchors at startup, don't submit a new request ([#1437](https://github.com/ceramicnetwork/js-ceramic/issues/1437)) ([ec17446](https://github.com/ceramicnetwork/js-ceramic/commit/ec17446b0472942f4e4bcfeb8037aebe5ce63525))
* **core:** only sync pinned streams the first time they are loaded ([#1417](https://github.com/ceramicnetwork/js-ceramic/issues/1417)) ([76be682](https://github.com/ceramicnetwork/js-ceramic/commit/76be6820fa2b5db49ede38b6cf20a9bee2702928))
* **core:** Optimize commit application to minimize calls to IPFS ([#1528](https://github.com/ceramicnetwork/js-ceramic/issues/1528)) ([75ee50e](https://github.com/ceramicnetwork/js-ceramic/commit/75ee50eb7ec988afdab81aa23a9f792fb5c7602c))
* **core:** Periodically publish keepalive pubsub message ([#1634](https://github.com/ceramicnetwork/js-ceramic/issues/1634)) ([79803ef](https://github.com/ceramicnetwork/js-ceramic/commit/79803ef46b4c5d8f296cb72b6a256a2ee3f297a5))
* **core:** Properly cache IPFS lookups with paths ([#1560](https://github.com/ceramicnetwork/js-ceramic/issues/1560)) ([ef9956d](https://github.com/ceramicnetwork/js-ceramic/commit/ef9956d9c88a2d28245c0c6709892383954ab20e))
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex ([#1491](https://github.com/ceramicnetwork/js-ceramic/issues/1491)) ([d1b021c](https://github.com/ceramicnetwork/js-ceramic/commit/d1b021ce7d6d776cfa820bf693d7767dc966f9be)), closes [#1434](https://github.com/ceramicnetwork/js-ceramic/issues/1434)
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **store:** web browsers don't have access to fs ([#1273](https://github.com/ceramicnetwork/js-ceramic/issues/1273)) ([2301e79](https://github.com/ceramicnetwork/js-ceramic/commit/2301e79248234c1e3dc60af9730473c3b02e7b88))
* **stream-caip10-link:** better genesis determinism ([#1519](https://github.com/ceramicnetwork/js-ceramic/issues/1519)) ([8b8adce](https://github.com/ceramicnetwork/js-ceramic/commit/8b8adcea0a5852dc032ec10455c84ad406bce748))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([c38098a](https://github.com/ceramicnetwork/js-ceramic/commit/c38098af66220912d01214e965392996d308c14f))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([ff0e99f](https://github.com/ceramicnetwork/js-ceramic/commit/ff0e99fcf6167e8ca3e36217935bfd673abdf198))
* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))
* accept multiple pubsub responses ([#1348](https://github.com/ceramicnetwork/js-ceramic/issues/1348)) ([fa2d72a](https://github.com/ceramicnetwork/js-ceramic/commit/fa2d72a5790d5994b82aeedd131fccf1b7641320))
* **cli:** Add the peerlist for dev-unstable network ([#853](https://github.com/ceramicnetwork/js-ceramic/issues/853)) ([69ccb00](https://github.com/ceramicnetwork/js-ceramic/commit/69ccb002d2a5f8d11491194801ecdcaaba021847))
* **core:** Cache providers per network ([#1262](https://github.com/ceramicnetwork/js-ceramic/issues/1262)) ([05aba6f](https://github.com/ceramicnetwork/js-ceramic/commit/05aba6ff8638c6a1045505c57c072610566c4b1e))
* **core:** Fix error handling for failed anchors ([#1221](https://github.com/ceramicnetwork/js-ceramic/issues/1221)) ([6ecf04c](https://github.com/ceramicnetwork/js-ceramic/commit/6ecf04c8993dfb7a92879ab0b202750b24f6a712))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **common:** Don't serialize null state fields ([#867](https://github.com/ceramicnetwork/js-ceramic/issues/867)) ([51b7375](https://github.com/ceramicnetwork/js-ceramic/commit/51b737542dc64cd3feac8af6c22fa32a81a48c8a))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Cannot call ipfs.block.stat on an IPLD path ([#728](https://github.com/ceramicnetwork/js-ceramic/issues/728)) ([c756134](https://github.com/ceramicnetwork/js-ceramic/commit/c7561344c619f72a243d1f27978393830bf49f56))
* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't delete message key from pubsub system object ([#855](https://github.com/ceramicnetwork/js-ceramic/issues/855)) ([3b77db1](https://github.com/ceramicnetwork/js-ceramic/commit/3b77db12f02f03ab8cff87ec04f9442a0bd0cc01))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Don't resubscribe to pubsub if using internal ipfs ([#854](https://github.com/ceramicnetwork/js-ceramic/issues/854)) ([24af0c2](https://github.com/ceramicnetwork/js-ceramic/commit/24af0c29d29d4a45cf4580fdee3938495a6475d9))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* **core:** Fix flaky test ([#852](https://github.com/ceramicnetwork/js-ceramic/issues/852)) ([d1b6a64](https://github.com/ceramicnetwork/js-ceramic/commit/d1b6a64fcb2cfc30bd0083afc077d85ea1986570))
* **core:** Fix test by waiting long enough for new anchor timestamp ([#1136](https://github.com/ceramicnetwork/js-ceramic/issues/1136)) ([82fef5d](https://github.com/ceramicnetwork/js-ceramic/commit/82fef5d4245b27e4534682a8a16f40158211d2b3))
* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))
* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Honor ethereumRpcUrl config option ([#830](https://github.com/ceramicnetwork/js-ceramic/issues/830)) ([a440b59](https://github.com/ceramicnetwork/js-ceramic/commit/a440b59ec692313e72bf3f3e15abb5b90cdef5e9))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))
* **core:** respect pinned status on createDocument call ([#741](https://github.com/ceramicnetwork/js-ceramic/issues/741)) ([1361390](https://github.com/ceramicnetwork/js-ceramic/commit/1361390e26c4f8a7dfc052ad90078dfc9990fe4d))
* **core:** Schema validation not enforced during update ([#817](https://github.com/ceramicnetwork/js-ceramic/issues/817)) ([7431fce](https://github.com/ceramicnetwork/js-ceramic/commit/7431fcea1a426f4bd68e461e4d2fdb27060bf509))
* **core:** stablize the test for the atTime feature ([#1132](https://github.com/ceramicnetwork/js-ceramic/issues/1132)) ([e625a27](https://github.com/ceramicnetwork/js-ceramic/commit/e625a271e69bbbad564c679c425fd53439e6d516))
* **core:** Use seconds for unix timstamp for inmemory anchors ([#1131](https://github.com/ceramicnetwork/js-ceramic/issues/1131)) ([3d4a98a](https://github.com/ceramicnetwork/js-ceramic/commit/3d4a98a60ad6c9bced3f191555f3e2d31a33c76a))
* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* Pin dag-jose contents ([#1451](https://github.com/ceramicnetwork/js-ceramic/issues/1451)) ([a598c10](https://github.com/ceramicnetwork/js-ceramic/commit/a598c10d77eba29877c6513eb8567972f6db83cf))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Allow pinning/unpinning alongside CRUD operations in a single request ([#1693](https://github.com/ceramicnetwork/js-ceramic/issues/1693)) ([3727337](https://github.com/ceramicnetwork/js-ceramic/commit/3727337a355ce092851d169abf4fe510878137f3))
* **core:** Cache IPFS commit data ([#1531](https://github.com/ceramicnetwork/js-ceramic/issues/1531)) ([2e44e14](https://github.com/ceramicnetwork/js-ceramic/commit/2e44e146d145c981779aa438db7430ab1119c820))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Limit the number of concurrently loading streams ([#1453](https://github.com/ceramicnetwork/js-ceramic/issues/1453)) ([7ec721a](https://github.com/ceramicnetwork/js-ceramic/commit/7ec721a4f1a9558901f27ad175b590cafe7e8c7d))
* **core:** Limit total number of the tasks executed concurrently ([#1202](https://github.com/ceramicnetwork/js-ceramic/issues/1202)) ([6583a7e](https://github.com/ceramicnetwork/js-ceramic/commit/6583a7ebe1a17e014e26a9d96a0bdbbbe4c6af22))
* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip ([#1484](https://github.com/ceramicnetwork/js-ceramic/issues/1484)) ([46e0f22](https://github.com/ceramicnetwork/js-ceramic/commit/46e0f22f99d4ae47052083c4458de3d114cd6b59))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))
* **core:** Split AnchorService from AnchorValidator ([#1505](https://github.com/ceramicnetwork/js-ceramic/issues/1505)) ([b92add9](https://github.com/ceramicnetwork/js-ceramic/commit/b92add945e5fc52943a836dfad856dc052cfbee3))
* **core:** Update pubsub messages to use 'stream' instead of 'doc' ([#1291](https://github.com/ceramicnetwork/js-ceramic/issues/1291)) ([62e87b1](https://github.com/ceramicnetwork/js-ceramic/commit/62e87b19d36c9ce8dce76323f61004980c030b6e))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Allow stream controller to differ from signer ([#1609](https://github.com/ceramicnetwork/js-ceramic/issues/1609)) ([b1c4711](https://github.com/ceramicnetwork/js-ceramic/commit/b1c4711b88ae9a3cc422cd8a8ea6b2fd8ff9286b))
* Allow updating tile immediately after controller change ([#1619](https://github.com/ceramicnetwork/js-ceramic/issues/1619)) ([4e63e2f](https://github.com/ceramicnetwork/js-ceramic/commit/4e63e2f36dd1bd21ca52ebf988c4a54929ee5be3))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))
* **core:** Sync Streams with cache before returning from multiQuery ([#1548](https://github.com/ceramicnetwork/js-ceramic/issues/1548)) ([b78637d](https://github.com/ceramicnetwork/js-ceramic/commit/b78637dbb48111d8e45dc285fcd05570ad031f2e))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Get instance comparison by hand ([#1332](https://github.com/ceramicnetwork/js-ceramic/issues/1332)) ([8dbdc1b](https://github.com/ceramicnetwork/js-ceramic/commit/8dbdc1bafdd141f732492fd7b0ca038ed1a075a3))
* Introduce Running State ([#1118](https://github.com/ceramicnetwork/js-ceramic/issues/1118)) ([58bfe80](https://github.com/ceramicnetwork/js-ceramic/commit/58bfe805a7c733eacef9a6b4eee1f8d60c2f1fb2))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** enable the use of timestamps ([#1117](https://github.com/ceramicnetwork/js-ceramic/issues/1117)) ([f417e27](https://github.com/ceramicnetwork/js-ceramic/commit/f417e27ce34b56ed43a713ca6697c9f34b1b7ae7))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Add types and more JSDoc to conflict-resolution ([58f31d5](https://github.com/ceramicnetwork/js-ceramic/commit/58f31d53dc4affba131d14633366361897eede02))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Disallow ceramic mainnet for now ([#753](https://github.com/ceramicnetwork/js-ceramic/issues/753)) ([c352590](https://github.com/ceramicnetwork/js-ceramic/commit/c352590afcc4ac4c0745fbf9dbd9a8fea0cfed99))
* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers ([#814](https://github.com/ceramicnetwork/js-ceramic/issues/814)) ([a2fa80f](https://github.com/ceramicnetwork/js-ceramic/commit/a2fa80f96ca275df36a22ae1e969c6e8fae18b8e))
* **core:** Document.loadAtCommit -> Document#rewind ([2600734](https://github.com/ceramicnetwork/js-ceramic/commit/260073499d1179be835bd37d48ad04f7b6619327))
* **core:** Document#tip relies on state information only ([029e8d6](https://github.com/ceramicnetwork/js-ceramic/commit/029e8d6ec6d19f2b1022f2f533596260083224a9))
* **core:** Drop Document#content ([8cabb01](https://github.com/ceramicnetwork/js-ceramic/commit/8cabb0139f2569a03fcc9b02f1d4ff2b1d26646d))
* **core:** Emit doctype change event on state change inside Document ([fe63bb6](https://github.com/ceramicnetwork/js-ceramic/commit/fe63bb6d5380e692872a1bdfef2b31f780668508))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Externalize conflict resolution ([7d224c9](https://github.com/ceramicnetwork/js-ceramic/commit/7d224c9cd39493e204c2f062ca974555180a6998))
* **core:** Externalize state validation ([3d3164e](https://github.com/ceramicnetwork/js-ceramic/commit/3d3164e30cccfecc0feada3664f04306baef00b9))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle ([b602a44](https://github.com/ceramicnetwork/js-ceramic/commit/b602a44baf8508e96531324c006d604c68f29386))
* **core:** Running state inside a Document ([02d3b52](https://github.com/ceramicnetwork/js-ceramic/commit/02d3b523d7625218fe22dcda6186c3a7524d44e4))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* use serialized message in pubsub logs ([#1318](https://github.com/ceramicnetwork/js-ceramic/issues/1318)) ([f282686](https://github.com/ceramicnetwork/js-ceramic/commit/f282686ef8e869fb66d8b4f28dd19bf19b0ce19e))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links ([#1234](https://github.com/ceramicnetwork/js-ceramic/issues/1234)) ([e180889](https://github.com/ceramicnetwork/js-ceramic/commit/e1808895f9983caae877c354beec76428e59927d))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-caip10-link:** Update Caip10LinkDoctype API ([#1213](https://github.com/ceramicnetwork/js-ceramic/issues/1213)) ([afcf354](https://github.com/ceramicnetwork/js-ceramic/commit/afcf35426582bbc6aa0a5b2181feb5bf5c5016f9))
* **doctype-tile:** Log when DID is authenticated ([#1199](https://github.com/ceramicnetwork/js-ceramic/issues/1199)) ([9d4a779](https://github.com/ceramicnetwork/js-ceramic/commit/9d4a77957d94c375dbc127e4fb5a1f8dc4953844))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" ([6101b0b](https://github.com/ceramicnetwork/js-ceramic/commit/6101b0b0bd341d7c8d13d0d77569c900e3401ba0)), closes [#1334](https://github.com/ceramicnetwork/js-ceramic/issues/1334)
* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.6.0](/compare/@ceramicnetwork/core@1.6.0-rc.4...@ceramicnetwork/core@1.6.0) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.6.0-rc.4](/compare/@ceramicnetwork/core@1.5.1...@ceramicnetwork/core@1.6.0-rc.4) (2021-09-16)


### Bug Fixes

* **core:** allow cas internal url (#1723) f5e38f1, closes #1723
* **core:** check for cas url equality (#1725) d2ac5db, closes #1725
* **stream-caip10-link:** use lowercase in caip10-link genesis (#1718) ff0e99f, closes #1718


### Features

* **core:** Allow pinning/unpinning alongside CRUD operations in a single request (#1693) 3727337, closes #1693
* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





# [1.6.0-rc.2](/compare/@ceramicnetwork/core@1.5.1...@ceramicnetwork/core@1.6.0-rc.2) (2021-09-16)


### Bug Fixes

* **core:** allow cas internal url (#1723) f5e38f1, closes #1723
* **core:** check for cas url equality (#1725) d2ac5db, closes #1725
* **stream-caip10-link:** use lowercase in caip10-link genesis (#1718) ff0e99f, closes #1718


### Features

* **core:** Allow pinning/unpinning alongside CRUD operations in a single request (#1693) 3727337, closes #1693
* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





## [1.5.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.5.0...@ceramicnetwork/core@1.5.1) (2021-09-14)


### Bug Fixes

* **stream-caip10-link:** use lowercase in caip10-link genesis ([#1718](https://github.com/ceramicnetwork/js-ceramic/issues/1718)) ([04f977f](https://github.com/ceramicnetwork/js-ceramic/commit/04f977f315592b4b0f7590c9abcb67409c212adf))




# [1.5.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.5.0-rc.0...@ceramicnetwork/core@1.5.0) (2021-09-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.5.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0...@ceramicnetwork/core@1.5.0-rc.0) (2021-09-02)


### Bug Fixes

* **core:** Increase timeout to stabilize test ([#1665](https://github.com/ceramicnetwork/js-ceramic/issues/1665)) ([cd36378](https://github.com/ceramicnetwork/js-ceramic/commit/cd3637810e646ef5ab3d66e36a7e67679a1f3947))


### Features

* **common,stream-tile,stream-tile-handler:** Add metadata option to forbid controller changes ([#1688](https://github.com/ceramicnetwork/js-ceramic/issues/1688)) ([85d6c97](https://github.com/ceramicnetwork/js-ceramic/commit/85d6c9789d28bb507abb9226be02e803cdc275ed))
* **core:** Rate limit how frequently pubsub query messages can be published ([#1667](https://github.com/ceramicnetwork/js-ceramic/issues/1667)) ([e77b0b8](https://github.com/ceramicnetwork/js-ceramic/commit/e77b0b822bc8bf97c674b53a697e1d64128c5561))





# [1.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0-rc.7...@ceramicnetwork/core@1.4.0) (2021-08-25)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.4.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0-rc.6...@ceramicnetwork/core@1.4.0-rc.7) (2021-08-24)


### Features

* named exports ([884a6d8](https://github.com/ceramicnetwork/js-ceramic/commit/884a6d8e490f1c2c99ed99a17e9fd8c3dfb132d2))





# [1.4.0-rc.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0-rc.5...@ceramicnetwork/core@1.4.0-rc.6) (2021-08-23)

**Note:** Version bump only for package @ceramicnetwork/core





# 1.4.0-rc.5 (2021-08-23)


### Bug Fixes

* **ci:** remove private flag ([9974009](https://github.com/ceramicnetwork/js-ceramic/commit/9974009be69382f2a2caf59f4ff72bf6aa12491b))





# [1.4.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0-rc.3...@ceramicnetwork/core@1.4.0-rc.4) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.4.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@1.4.0-rc.2...@ceramicnetwork/core@1.4.0-rc.3) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/core





# 1.4.0-rc.2 (2021-08-22)


### Bug Fixes

* **ci:** remove flag from npm ci cmd ([b8ca310](https://github.com/ceramicnetwork/js-ceramic/commit/b8ca3102963096626a46a3c78c705da26e977021))





# [1.4.0-rc.1](/compare/@ceramicnetwork/core@1.4.0-rc.0...@ceramicnetwork/core@1.4.0-rc.1) (2021-08-19)


### Bug Fixes

* **core:** Periodically publish keepalive pubsub message (#1634) 79803ef, closes #1634


### Features

* **cli:** Add hierarchy to daemon config (#1633) 138b49d, closes #1633





# [1.4.0-rc.0](/compare/@ceramicnetwork/core@1.3.1...@ceramicnetwork/core@1.4.0-rc.0) (2021-08-13)


### Features

* **core:** Add API to request an anchor (#1622) 8473c6a, closes #1622
* Allow stream controller to differ from signer (#1609) b1c4711, closes #1609
* Allow updating tile immediately after controller change (#1619) 4e63e2f, closes #1619





## [1.3.1](/compare/@ceramicnetwork/core@1.3.0-rc.4...@ceramicnetwork/core@1.3.1) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.3.0](/compare/@ceramicnetwork/core@1.3.0-rc.4...@ceramicnetwork/core@1.3.0) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.3.0-rc.4](/compare/@ceramicnetwork/core@1.3.0-rc.3...@ceramicnetwork/core@1.3.0-rc.4) (2021-08-03)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.3.0-rc.3](/compare/@ceramicnetwork/core@1.3.0-rc.2...@ceramicnetwork/core@1.3.0-rc.3) (2021-07-30)


### Features

* **core:** Invalid commits don't prevent loading a stream (#1597) fb1dea1, closes #1597
* **daemon:** add raw_data endpoint (#1395) 41b6109, closes #1395 ceramicnetwork#1394





# [1.3.0-rc.2](/compare/@ceramicnetwork/core@1.3.0-rc.1...@ceramicnetwork/core@1.3.0-rc.2) (2021-07-19)


### Bug Fixes

* **core:** Properly cache IPFS lookups with paths (#1560) ef9956d, closes #1560





# [1.3.0-rc.1](/compare/@ceramicnetwork/core@1.3.0-rc.0...@ceramicnetwork/core@1.3.0-rc.1) (2021-07-16)


### Bug Fixes

* **core:** convert pubsub seqno to string (#1543) a96d932, closes #1543
* **core:** Optimize commit application to minimize calls to IPFS (#1528) 75ee50e, closes #1528
* **stream-caip10-link:** better genesis determinism (#1519) 8b8adce, closes #1519


### Features

* **cli:** add global sync override option (#1541) 4806e92, closes #1541
* **core:** Cache IPFS commit data (#1531) 2e44e14, closes #1531
* **core:** Sync Streams with cache before returning from multiQuery (#1548) b78637d, closes #1548
* Check signature of a lone genesis (#1529) b55e225, closes #1529
* Pass issuer to verifyJWS (#1542) 3c60b0c, closes #1542
* Pass time-information when checking a signature (#1502) 913e091, closes #1502





# [1.3.0-rc.0](/compare/@ceramicnetwork/core@1.2.0...@ceramicnetwork/core@1.3.0-rc.0) (2021-06-30)


### Bug Fixes

* **core:** Add information for validating transactions on rinkeby (#1510) 9a4cd0b, closes #1510
* **core:** Fix startup of EthereumAnchorValidator (#1512) e8b87fa, closes #1512


### Features

* **core:** Split AnchorService from AnchorValidator (#1505) b92add9, closes #1505
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway (#1513) be397c8, closes #1513





# [1.2.0](/compare/@ceramicnetwork/core@1.2.0-rc.0...@ceramicnetwork/core@1.2.0) (2021-06-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.2.0-rc.0](/compare/@ceramicnetwork/core@1.1.0...@ceramicnetwork/core@1.2.0-rc.0) (2021-06-21)


### Bug Fixes

* **core:** Disable ajv strictTypes and strictTuples log warnings (#1471) d3c817d, closes #1471
* **core:** Don't submit an anchor request for an AnchorCommit (#1474) 356775f, closes #1474
* **core:** Only poll for anchors at startup, don't submit a new request (#1437) ec17446, closes #1437
* **core:** Remove loading inner CID from SignedCommits in ConflictResolution.findIndex (#1491) d1b021c, closes #1491 #1434


### Features

* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip (#1484) 46e0f22, closes #1484
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS (#1490) 9dfc167, closes #1490





# [1.1.0](/compare/@ceramicnetwork/core@1.0.5...@ceramicnetwork/core@1.1.0) (2021-06-06)


### Features

* **core:** Limit the number of concurrently loading streams (#1453) 7ec721a, closes #1453





## [1.0.5](/compare/@ceramicnetwork/core@1.0.4...@ceramicnetwork/core@1.0.5) (2021-06-03)


### Bug Fixes

* **core:** ipfs subscribe, pin version (#1454) fc9c5e7, closes #1454
* Pin dag-jose contents (#1451) a598c10, closes #1451





## [1.0.4](/compare/@ceramicnetwork/core@1.0.4-rc.0...@ceramicnetwork/core@1.0.4) (2021-05-31)


### Bug Fixes

* **core:** Don't refetch CID from IPFS when re-applying commits already in the log (#1422) b8a941c, closes #1422
* **core:** Don't retry anchors indefinitely on error (#1438) 69f4993, closes #1438





## [1.0.4-rc.0](/compare/@ceramicnetwork/core@1.0.3...@ceramicnetwork/core@1.0.4-rc.0) (2021-05-28)


### Bug Fixes

* **core:** only sync pinned streams the first time they are loaded (#1417) 76be682, closes #1417





## [1.0.3](/compare/@ceramicnetwork/core@1.0.2...@ceramicnetwork/core@1.0.3) (2021-05-25)


### Bug Fixes

* **core:** Actively fail anchor if applying anchor commit fails 3 times in a row 35dae9d
* **core:** Continue polling anchor service even after error 10719e7
* **core:** Don't update stream state for changes to anchor status of commits that are no longer the tip 94ac4a7





## [1.0.2](/compare/@ceramicnetwork/core@1.0.1...@ceramicnetwork/core@1.0.2) (2021-05-20)


### Bug Fixes

* **core:** Add retry logic when applying anchor commits (#1393) 881d7f0, closes #1393
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations (#1391) 700221e, closes #1391





## [1.0.1](/compare/@ceramicnetwork/core@1.0.0...@ceramicnetwork/core@1.0.1) (2021-05-13)


### Bug Fixes

* **core:** Increase max anchor poll timeout (#1377) 37d6540, closes #1377





# [1.0.0](/compare/@ceramicnetwork/core@1.0.0-rc.12...@ceramicnetwork/core@1.0.0) (2021-05-06)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.0.0-rc.12](/compare/@ceramicnetwork/core@1.0.0-rc.11...@ceramicnetwork/core@1.0.0-rc.12) (2021-05-03)


### Bug Fixes

* accept multiple pubsub responses (#1348) fa2d72a, closes #1348





# [1.0.0-rc.11](/compare/@ceramicnetwork/core@1.0.0-rc.10...@ceramicnetwork/core@1.0.0-rc.11) (2021-04-30)


### Bug Fixes

* **core:** Always subscribe to pubsub once on startup (#1338) b46c0a0, closes #1338





# [1.0.0-rc.10](/compare/@ceramicnetwork/core@1.0.0-rc.9...@ceramicnetwork/core@1.0.0-rc.10) (2021-04-29)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.0.0-rc.9](/compare/@ceramicnetwork/core@1.0.0-rc.8...@ceramicnetwork/core@1.0.0-rc.9) (2021-04-29)


### Reverts

* Revert "fix(core): Add 2 retries when loading CIDs from IPFS (#1334)" 6101b0b, closes #1334





# [1.0.0-rc.8](/compare/@ceramicnetwork/core@1.0.0-rc.7...@ceramicnetwork/core@1.0.0-rc.8) (2021-04-29)


### Bug Fixes

* **core:** Add 2 retries when loading CIDs from IPFS (#1334) 279d729, closes #1334


### Features

* Get instance comparison by hand (#1332) 8dbdc1b, closes #1332





# [1.0.0-rc.7](/compare/@ceramicnetwork/core@1.0.0-rc.6...@ceramicnetwork/core@1.0.0-rc.7) (2021-04-28)


### Bug Fixes

* **cli:** Allow large requests to http API (#1324) 714922d, closes #1324





# [1.0.0-rc.6](/compare/@ceramicnetwork/core@1.0.0-rc.5...@ceramicnetwork/core@1.0.0-rc.6) (2021-04-26)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.0.0-rc.5](/compare/@ceramicnetwork/core@1.0.0-rc.4...@ceramicnetwork/core@1.0.0-rc.5) (2021-04-23)


### Features

* use serialized message in pubsub logs (#1318) f282686, closes #1318





# [1.0.0-rc.4](/compare/@ceramicnetwork/core@1.0.0-rc.3...@ceramicnetwork/core@1.0.0-rc.4) (2021-04-23)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.0.0-rc.3](/compare/@ceramicnetwork/core@1.0.0-rc.2...@ceramicnetwork/core@1.0.0-rc.3) (2021-04-20)


### Bug Fixes

* **core:** Cache providers per network (#1262) 05aba6f, closes #1262
* **core:** Fix error handling for failed anchors (#1221) 6ecf04c, closes #1221
* **store:** web browsers don't have access to fs (#1273) 2301e79, closes #1273
* Fix tests by using node environment for jest (#1212) 0f04006, closes #1212


### Features

* **common:** Change 'sync' option to an enum and refine sync behaviors (#1269) 0b652fb, closes #1269
* **common:** Miscellaneous renames from document-based to stream-based terminology (#1290) 2ca935e, closes #1290
* **common:** Remove deprecated methods named with Records instead of Commits (#1217) 43fa46a, closes #1217
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis (#1285) 0dbfbf3, closes #1285
* **common:** Rename Doctype to Stream (#1266) 4ebb6ac, closes #1266
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string (#1286) 967cf11, closes #1286
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts (#1229) 85ccbb8, closes #1229
* **core:** Limit total number of the tasks executed concurrently (#1202) 6583a7e, closes #1202
* **core:** Update pubsub messages to use 'stream' instead of 'doc' (#1291) 62e87b1, closes #1291
* DocState contains type as number (#1250) 56501e2, closes #1250
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() (#1196) e9b3c18, closes #1196
* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **core,http-client,cli:** Update config options from document to stream-based terminology (#1249) 5ce0969, closes #1249
* **doctype-caip10-link:** Don't anchor by default when creating Caip10Links (#1234) e180889, closes #1234
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link (#1216) f594ff0, closes #1216
* **doctype-caip10-link:** Update Caip10LinkDoctype API (#1213) afcf354, closes #1213
* **doctype-tile:** Log when DID is authenticated (#1199) 9d4a779, closes #1199
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link (#1264) ed7ee3c, closes #1264
* **streamid:** Rename DocID to StreamID (#1195) 65754d1, closes #1195
* **tile-doctype:** Update Tile API (#1180) 90973ee, closes #1180





# [1.0.0-rc.2](/compare/@ceramicnetwork/core@1.0.0-rc.1...@ceramicnetwork/core@1.0.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [1.0.0-rc.1](/compare/@ceramicnetwork/core@0.22.0-rc.2...@ceramicnetwork/core@1.0.0-rc.1) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.22.0-rc.2](/compare/@ceramicnetwork/core@0.22.0-rc.1...@ceramicnetwork/core@0.22.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.22.0-rc.1](/compare/@ceramicnetwork/core@0.21.0...@ceramicnetwork/core@0.22.0-rc.1) (2021-04-19)


### Bug Fixes

* Fix tests by using node environment for jest (#1212) aff01c6, closes #1212
* **core:** Cache providers per network (#1262) ee72737, closes #1262





# [0.22.0-rc.0](/compare/@ceramicnetwork/core@0.21.0...@ceramicnetwork/core@0.22.0-rc.0) (2021-04-02)


### Features

* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **tile-doctype:** Update Tile API 48f30e1





# [0.21.0](/compare/@ceramicnetwork/core@0.20.0...@ceramicnetwork/core@0.21.0) (2021-04-02)


### Bug Fixes

* **common, logger:** Clean up dependencies (#1164) 191ad31, closes #1164


### Features

* add networks enum and elp (#1187) 7a60b30, closes #1187




## [0.20.1-rc.4](/compare/@ceramicnetwork/core@0.20.0...@ceramicnetwork/core@0.20.1-rc.4) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.20.1-rc.3](/compare/@ceramicnetwork/core@0.20.0...@ceramicnetwork/core@0.20.1-rc.3) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.20.1-rc.2](/compare/@ceramicnetwork/core@0.20.0...@ceramicnetwork/core@0.20.1-rc.2) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.20.1-rc.1](/compare/@ceramicnetwork/core@0.20.1-rc.0...@ceramicnetwork/core@0.20.1-rc.1) (2021-03-25)


### Reverts

* Revert "update some deps" 2f195fc





## [0.20.1-rc.0](/compare/@ceramicnetwork/core@0.20.0...@ceramicnetwork/core@0.20.1-rc.0) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.20.0](/compare/@ceramicnetwork/core@0.20.0-rc.11...@ceramicnetwork/core@0.20.0) (2021-03-22)


### Bug Fixes

* **core:** Fix test by waiting long enough for new anchor timestamp (#1136) 82fef5d, closes #1136
* **core:** stablize the test for the atTime feature (#1132) e625a27, closes #1132


### Features

* **3id-did-resolver:** did metadata resolution (#1139) 818bde1, closes #1139
* **core:** Meat of State Refactor: final concurrency model (#1130) 345d3d1, closes #1130 #1141





# [0.20.0-rc.11](/compare/@ceramicnetwork/core@0.20.0-rc.10...@ceramicnetwork/core@0.20.0-rc.11) (2021-03-15)


### Bug Fixes

* **core:** Use seconds for unix timstamp for inmemory anchors (#1131) 3d4a98a, closes #1131


### Features

* Introduce Running State (#1118) 58bfe80, closes #1118
* **core:** enable the use of timestamps (#1117) f417e27, closes #1117





# [0.20.0-rc.10](/compare/@ceramicnetwork/core@0.20.0-rc.9...@ceramicnetwork/core@0.20.0-rc.10) (2021-03-12)


### Features

* upgrade 3id did resolver (#1108) 24ef6d4, closes #1108





# [0.20.0-rc.9](/compare/@ceramicnetwork/core@0.20.0-rc.8...@ceramicnetwork/core@0.20.0-rc.9) (2021-03-10)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.20.0-rc.8](/compare/@ceramicnetwork/core@0.20.0-rc.6...@ceramicnetwork/core@0.20.0-rc.8) (2021-03-09)


### Bug Fixes

* **core:** Generate Query id differently (#1063) c58f114, closes #1063
* **core:** Init TaskQueue differently in IncomingChannel (#1065) d0e9af0, closes #1065


### Features

* **core:** Add types and more JSDoc to conflict-resolution 58f31d5
* **core:** Document.loadAtCommit -> Document#rewind 2600734
* **core:** Document#tip relies on state information only 029e8d6
* **core:** Drop Document#content 8cabb01
* **core:** Emit doctype change event on state change inside Document fe63bb6
* **core:** Externalize conflict resolution 7d224c9
* **core:** Externalize state validation 3d3164e
* **core:** Replace _applyQueue.onEmpty + custom processing logic with _applyQueue.onIdle b602a44
* **core:** Running state inside a Document 02d3b52
* Feed of pubsub messages (#1058) 2d2bb5c, closes #1058





# [0.20.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.19.7...@ceramicnetwork/core@0.20.0-rc.7) (2021-02-25)


### Bug Fixes

* **core:** Generate Query id differently ([#1063](https://github.com/ceramicnetwork/js-ceramic/issues/1063)) ([c58f114](https://github.com/ceramicnetwork/js-ceramic/commit/c58f114253d50464c784e909c40dd43f89be72fb))
* **core:** Init TaskQueue differently in IncomingChannel ([#1065](https://github.com/ceramicnetwork/js-ceramic/issues/1065)) ([d0e9af0](https://github.com/ceramicnetwork/js-ceramic/commit/d0e9af036838930ee8713697bf6c319662d9f23d))


### Features

* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* **docid:** Custom instanceof predicate ([#1059](https://github.com/ceramicnetwork/js-ceramic/issues/1059)) ([cd31434](https://github.com/ceramicnetwork/js-ceramic/commit/cd31434dedc2a3795b98192c29ec3c6f3f7b2479))
* Introduce Repository ([#1044](https://github.com/ceramicnetwork/js-ceramic/issues/1044)) ([7d8ef3d](https://github.com/ceramicnetwork/js-ceramic/commit/7d8ef3d47dc187728a7cb934cf2530026326f30d))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* **core:** Remove 'exists' method from StateStore API ([#1011](https://github.com/ceramicnetwork/js-ceramic/issues/1011)) ([dd58039](https://github.com/ceramicnetwork/js-ceramic/commit/dd580395c1615807eb313619058dca147d784379))
* extract local pin api ([#991](https://github.com/ceramicnetwork/js-ceramic/issues/991)) ([bc53d72](https://github.com/ceramicnetwork/js-ceramic/commit/bc53d727045fc918e30462d3e7136699f405dbdc))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))





# [0.20.0-rc.6](/compare/@ceramicnetwork/core@0.20.0-rc.5...@ceramicnetwork/core@0.20.0-rc.6) (2021-02-24)


### Features

* **docid:** Custom instanceof predicate (#1059) cd31434, closes #1059





# [0.20.0-rc.5](/compare/@ceramicnetwork/core@0.20.0-rc.3...@ceramicnetwork/core@0.20.0-rc.5) (2021-02-23)


### Features

* Introduce Repository (#1044) 7d8ef3d, closes #1044
* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.20.0-rc.4](/compare/@ceramicnetwork/core@0.20.0-rc.3...@ceramicnetwork/core@0.20.0-rc.4) (2021-02-23)


### Features

* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.20.0-rc.3](/compare/@ceramicnetwork/core@0.20.0-rc.2...@ceramicnetwork/core@0.20.0-rc.3) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.20.0-rc.2](/compare/@ceramicnetwork/core@0.20.0-rc.0...@ceramicnetwork/core@0.20.0-rc.2) (2021-02-22)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.20.0-rc.0](/compare/@ceramicnetwork/core@0.19.7...@ceramicnetwork/core@0.20.0-rc.0) (2021-02-22)


### Features

* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig (#1021) a53c534, closes #1021
* Unbundle DocID into DocID and CommitID (#1009) c2707f2, closes #1009
* **core:** Remove 'exists' method from StateStore API (#1011) dd58039, closes #1011
* extract local pin api (#991) bc53d72, closes #991
* **core:** Add new logger package (#878) 9756868, closes #878





## [0.19.7](/compare/@ceramicnetwork/core@0.19.7-rc.0...@ceramicnetwork/core@0.19.7) (2021-02-04)


### Bug Fixes

* **core:** Add ipfs timeout everywhere we get from the dag (#886) e6d5e1b, closes #886





## [0.19.7-rc.0](/compare/@ceramicnetwork/core@0.19.6...@ceramicnetwork/core@0.19.7-rc.0) (2021-01-29)


### Bug Fixes

* **common:** Don't serialize null state fields (#867) 51b7375, closes #867





## [0.19.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.19.5...@ceramicnetwork/core@0.19.6) (2021-01-28)


### Bug Fixes

* **core:** Fully process incoming tips on first document load ([#862](https://github.com/ceramicnetwork/js-ceramic/issues/862)) ([5ba33ca](https://github.com/ceramicnetwork/js-ceramic/commit/5ba33ca381f296c6876a0ccd3a0f100bbf307177))





## [0.19.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.19.4...@ceramicnetwork/core@0.19.5) (2021-01-26)


### Bug Fixes

* Decrease pubsub resubscribe timeout ([#858](https://github.com/ceramicnetwork/js-ceramic/issues/858)) ([10bc991](https://github.com/ceramicnetwork/js-ceramic/commit/10bc9911ee3356370f5e1603b85e32ebe86ac5c6))
* **core:** Improve pubsub resubscribe logic ([#857](https://github.com/ceramicnetwork/js-ceramic/issues/857)) ([999cf6d](https://github.com/ceramicnetwork/js-ceramic/commit/999cf6d91b5016e5f9f636a0497c37b15e675f9f))





## [0.19.4](/compare/@ceramicnetwork/core@0.19.3...@ceramicnetwork/core@0.19.4) (2021-01-25)


### Bug Fixes

* **cli:** Add the peerlist for dev-unstable network (#853) 69ccb00, closes #853
* **core:** Don't delete message key from pubsub system object (#855) 3b77db1, closes #855
* **core:** Don't resubscribe to pubsub if using internal ipfs (#854) 24af0c2, closes #854
* **core:** Fix flaky test (#852) d1b6a64, closes #852





## [0.19.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.19.2...@ceramicnetwork/core@0.19.3) (2021-01-25)


### Bug Fixes

* **core:** Dedupe pubsub messages in dispatcher ([#846](https://github.com/ceramicnetwork/js-ceramic/issues/846)) ([fbb0f37](https://github.com/ceramicnetwork/js-ceramic/commit/fbb0f3700ed89a1d398268011c084d1ca88662cb))
* **core:** Don't erroneously set anchorStatus to FAILED when a later CID is anchored instead of an earlier one ([#839](https://github.com/ceramicnetwork/js-ceramic/issues/839)) ([aa961f0](https://github.com/ceramicnetwork/js-ceramic/commit/aa961f035617f4082288dd32edc241fb400cd04a))
* **core:** Properly ignore old FAILED anchor responses ([#844](https://github.com/ceramicnetwork/js-ceramic/issues/844)) ([9e4b5d6](https://github.com/ceramicnetwork/js-ceramic/commit/9e4b5d6fb2e710011e930d75f00d2e786d66dde6))





## [0.19.2](/compare/@ceramicnetwork/core@0.19.1...@ceramicnetwork/core@0.19.2) (2021-01-21)


### Bug Fixes

* **core:** Honor ethereumRpcUrl config option (#830) a440b59, closes #830





## [0.19.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.19.0...@ceramicnetwork/core@0.19.1) (2021-01-21)


### Bug Fixes

* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))





# [0.19.0](/compare/@ceramicnetwork/core@0.18.3...@ceramicnetwork/core@0.19.0) (2021-01-18)


### Bug Fixes

* **core:** Schema validation not enforced during update (#817) 7431fce, closes #817


### Features

* **core:** Do IPFS peer discovery by querying a github file containing a list of registered ceramic peers (#814) a2fa80f, closes #814





## [0.18.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.18.2...@ceramicnetwork/core@0.18.3) (2021-01-14)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.18.2](/compare/@ceramicnetwork/core@0.18.1...@ceramicnetwork/core@0.18.2) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.18.1](/compare/@ceramicnetwork/core@0.18.0...@ceramicnetwork/core@0.18.1) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.18.0](/compare/@ceramicnetwork/core@0.17.7...@ceramicnetwork/core@0.18.0) (2021-01-13)


### Features

* **cli:** Allow specifying pub/sub topic for 'local' ceramic network (#781) f3650b4, closes #781
* **core:** Disallow ceramic mainnet for now (#753) c352590, closes #753





## [0.17.7](/compare/@ceramicnetwork/core@0.17.6...@ceramicnetwork/core@0.17.7) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.17.6](/compare/@ceramicnetwork/core@0.17.5...@ceramicnetwork/core@0.17.6) (2021-01-07)


### Bug Fixes

* **core:** respect pinned status on createDocument call (#741) 1361390, closes #741





## [0.17.5](/compare/@ceramicnetwork/core@0.17.4...@ceramicnetwork/core@0.17.5) (2020-12-31)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.17.4](/compare/@ceramicnetwork/core@0.17.3...@ceramicnetwork/core@0.17.4) (2020-12-31)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.17.3](/compare/@ceramicnetwork/core@0.17.2...@ceramicnetwork/core@0.17.3) (2020-12-31)


### Bug Fixes

* **core:** Cannot call ipfs.block.stat on an IPLD path (#728) c756134, closes #728





## [0.17.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.17.1...@ceramicnetwork/core@0.17.2) (2020-12-29)


### Bug Fixes

* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))





## [0.17.1](/compare/@ceramicnetwork/core@0.17.0...@ceramicnetwork/core@0.17.1) (2020-12-23)


### Reverts

* Revert "chore(release):" 26ed474





# [0.17.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.17.0-alpha.0...@ceramicnetwork/core@0.17.0) (2020-12-17)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.17.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.16.2...@ceramicnetwork/core@0.17.0-alpha.0) (2020-12-14)


### Bug Fixes

* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))


### Features

* **core:** Add 'dev-unstable' ceramic network ([#644](https://github.com/ceramicnetwork/js-ceramic/issues/644)) ([2357034](https://github.com/ceramicnetwork/js-ceramic/commit/23570343316ab8d8ae123ca7692a0f2baaea75d8))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))





## [0.16.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.16.1...@ceramicnetwork/core@0.16.2) (2020-12-09)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.16.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.16.0...@ceramicnetwork/core@0.16.1) (2020-12-08)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.16.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.15.0...@ceramicnetwork/core@0.16.0) (2020-12-03)


### Features

* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Use randomized pub/sub topic for 'local' and 'inmemory' networks ([#583](https://github.com/ceramicnetwork/js-ceramic/issues/583)) ([ed31106](https://github.com/ceramicnetwork/js-ceramic/commit/ed31106ec40f3a4487d66342784b92704a50d825))





# [0.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.14.2...@ceramicnetwork/core@0.15.0) (2020-12-01)


### Features

* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))





## [0.14.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.14.1...@ceramicnetwork/core@0.14.2) (2020-11-30)

**Note:** Version bump only for package @ceramicnetwork/core





## [0.14.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.14.0...@ceramicnetwork/core@0.14.1) (2020-11-30)

**Note:** Version bump only for package @ceramicnetwork/core





# [0.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/core@0.13.0...@ceramicnetwork/core@0.14.0) (2020-11-26)


### Features

* **core:** Update pubsub messages to those defined in CIP-71 ([#542](https://github.com/ceramicnetwork/js-ceramic/issues/542)) ([ee30eb4](https://github.com/ceramicnetwork/js-ceramic/commit/ee30eb468ecd3937b1e2b80b1d5b0b492ffb9acc))





# 0.13.0 (2020-11-24)


### Bug Fixes

* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))
* **document:** Enforce schema when loading genesis record ([#472](https://github.com/ceramicnetwork/js-ceramic/issues/472)) ([37fc1e6](https://github.com/ceramicnetwork/js-ceramic/commit/37fc1e6c18feccbaf16ce60b711c611e5ba7aeb4))
* **test:** Increase stability of schema validation tests ([#469](https://github.com/ceramicnetwork/js-ceramic/issues/469)) ([28da783](https://github.com/ceramicnetwork/js-ceramic/commit/28da783f6c6ca29dc925152ce4c3c5fc6e3c0bdd))


### Features

* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Bring conflict resolution approach into alignment with spec ([#512](https://github.com/ceramicnetwork/js-ceramic/issues/512)) ([901e957](https://github.com/ceramicnetwork/js-ceramic/commit/901e957119ea9d76dad0789d29e86430ae0b9342))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))





## [0.12.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.12.2-alpha.0...@ceramicnetwork/ceramic-core@0.12.2) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.12.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.12.1...@ceramicnetwork/ceramic-core@0.12.2-alpha.0) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.12.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.12.0...@ceramicnetwork/ceramic-core@0.12.1) (2020-11-11)


### Bug Fixes

* bump IDW dep, fix Dockerfile ([#474](https://github.com/ceramicnetwork/js-ceramic/issues/474)) ([79b39a4](https://github.com/ceramicnetwork/js-ceramic/commit/79b39a4e7212c22991805ae1b93f10b3d146d540))





# [0.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.12.0-alpha.1...@ceramicnetwork/ceramic-core@0.12.0) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.12.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.12.0-alpha.0...@ceramicnetwork/ceramic-core@0.12.0-alpha.1) (2020-10-28)


### Bug Fixes

* **core:** fix pin ls ([#433](https://github.com/ceramicnetwork/js-ceramic/issues/433)) ([fda9380](https://github.com/ceramicnetwork/js-ceramic/commit/fda9380568c3244cad1bfd9e6a5c989943737211))





# [0.12.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.11.0...@ceramicnetwork/ceramic-core@0.12.0-alpha.0) (2020-10-27)


### Features

* **core:** Rename owners to controllers ([#423](https://github.com/ceramicnetwork/js-ceramic/issues/423)) ([c94ff15](https://github.com/ceramicnetwork/js-ceramic/commit/c94ff155a10c7dd3c486846f6cd8e91d320485cc))





# [0.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.11.0-alpha.0...@ceramicnetwork/ceramic-core@0.11.0) (2020-10-26)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.11.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.10.2-alpha.0...@ceramicnetwork/ceramic-core@0.11.0-alpha.0) (2020-10-26)


### Bug Fixes

* fix tests and minor refactor ([71825e2](https://github.com/ceramicnetwork/js-ceramic/commit/71825e22282c5e9a8e53f431e82ff1fb9ce7eec5))
* improve generated api docs ([#419](https://github.com/ceramicnetwork/js-ceramic/issues/419)) ([1364aec](https://github.com/ceramicnetwork/js-ceramic/commit/1364aecdbf9209106627fb11e29a13132d4943d4))


### Features

* **core:** create docid, docid map ([65f730c](https://github.com/ceramicnetwork/js-ceramic/commit/65f730cf7831638ed06ad39996bda9bf405fba98))
* docids support ([1e48e9e](https://github.com/ceramicnetwork/js-ceramic/commit/1e48e9e88090463f27f831f4b47a3fab30ba8c5e))
* idw update, docid idw ([09c7c0d](https://github.com/ceramicnetwork/js-ceramic/commit/09c7c0dc8e6e60ca3cf190f6e3c2b6c51a2e52ae))





## [0.10.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.10.1...@ceramicnetwork/ceramic-core@0.10.2-alpha.0) (2020-10-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.10.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.10.1-alpha.0...@ceramicnetwork/ceramic-core@0.10.1) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.10.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.10.0...@ceramicnetwork/ceramic-core@0.10.1-alpha.0) (2020-10-13)


### Bug Fixes

* properly handle versions and key rotations ([#399](https://github.com/ceramicnetwork/js-ceramic/issues/399)) ([c70f04c](https://github.com/ceramicnetwork/js-ceramic/commit/c70f04c037929568e796cf4b7e523679c81818e1))
* **core:** fix anchor record verification ([#381](https://github.com/ceramicnetwork/js-ceramic/issues/381)) ([c134c42](https://github.com/ceramicnetwork/js-ceramic/commit/c134c4239b79347b14a5ea7384a96c2bbe77fba4))
* change identity-wallet version ([#384](https://github.com/ceramicnetwork/js-ceramic/issues/384)) ([9e0ba75](https://github.com/ceramicnetwork/js-ceramic/commit/9e0ba752b22c944b827edcecd68cb987905fd4d6))





# [0.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.9.1-alpha.1...@ceramicnetwork/ceramic-core@0.10.0) (2020-10-07)


### Bug Fixes

* add todos to remove logToFile ([5f5433a](https://github.com/ceramicnetwork/js-ceramic/commit/5f5433a7636bba134457a9b264c7e88bf3ad4aed))
* handle message data as string or buffer ([d9eeb7b](https://github.com/ceramicnetwork/js-ceramic/commit/d9eeb7bb9fe704fdfdc96a80b4e27708d3b3c5be))
* parse message data in dispatcher log ([d5771a3](https://github.com/ceramicnetwork/js-ceramic/commit/d5771a33f10f3d6fb2d4dfbaf7292b805b5c9a20))
* remove logToFile in favor of plugin and update file names ([5bbdd27](https://github.com/ceramicnetwork/js-ceramic/commit/5bbdd27922d8b873a42fb18a83e2bb0815b4052f))


### Features

* add log to file ([b342226](https://github.com/ceramicnetwork/js-ceramic/commit/b3422261c7ec34495140cbc39fdbdcde456b3110))
* add timestamp to pubsub logs ([6ed6a94](https://github.com/ceramicnetwork/js-ceramic/commit/6ed6a94595ea06de18fc061a1da2053084536396))
* make log to file optional and config path ([581bba8](https://github.com/ceramicnetwork/js-ceramic/commit/581bba8c91f963893fb5509b97b939cfee0bd68d))





## [0.9.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.9.1-alpha.0...@ceramicnetwork/ceramic-core@0.9.1-alpha.1) (2020-10-06)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.9.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.9.0...@ceramicnetwork/ceramic-core@0.9.1-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.9.0-alpha.1...@ceramicnetwork/ceramic-core@0.9.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.9.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.2-alpha.0...@ceramicnetwork/ceramic-core@0.9.0-alpha.1) (2020-10-05)


### Bug Fixes

* pass string instead of CID instance ([#336](https://github.com/ceramicnetwork/js-ceramic/issues/336)) ([3bf7313](https://github.com/ceramicnetwork/js-ceramic/commit/3bf7313590a059f09bf0c3da47fd37d996b1868a))


### Features

* add dag-jose format to ipfs-http-client ([#341](https://github.com/ceramicnetwork/js-ceramic/issues/341)) ([18cbec8](https://github.com/ceramicnetwork/js-ceramic/commit/18cbec8fddc63c63cd02459f1dc6ff4e068f202f))
* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))





# [0.9.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.2-alpha.0...@ceramicnetwork/ceramic-core@0.9.0-alpha.0) (2020-09-28)


### Features

* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))


## [0.8.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.2-alpha.0...@ceramicnetwork/ceramic-core@0.8.2) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.8.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.1-alpha.1...@ceramicnetwork/ceramic-core@0.8.2-alpha.0) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.8.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.1-alpha.0...@ceramicnetwork/ceramic-core@0.8.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core


## [0.8.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.1-alpha.0...@ceramicnetwork/ceramic-core@0.8.1-alpha.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core


## [0.8.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.8.0...@ceramicnetwork/ceramic-core@0.8.1-alpha.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.7.0...@ceramicnetwork/ceramic-core@0.8.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.8.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.7.0...@ceramicnetwork/ceramic-core@0.8.0-alpha.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.7.0-alpha.1...@ceramicnetwork/ceramic-core@0.7.0) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.7.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.7.0-alpha.0...@ceramicnetwork/ceramic-core@0.7.0-alpha.1) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.7.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.6.1...@ceramicnetwork/ceramic-core@0.7.0-alpha.0) (2020-09-17)


### Features

* **cli:** disable CLI logs ([#311](https://github.com/ceramicnetwork/js-ceramic/issues/311)) ([2a2494d](https://github.com/ceramicnetwork/js-ceramic/commit/2a2494d24bb58853b61d2f6444f62bbb7f81e1d7))





## [0.6.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.6.1-alpha.0...@ceramicnetwork/ceramic-core@0.6.1) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.6.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.6.0...@ceramicnetwork/ceramic-core@0.6.1-alpha.0) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.6.0-alpha.0...@ceramicnetwork/ceramic-core@0.6.0) (2020-09-11)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.6.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.11...@ceramicnetwork/ceramic-core@0.6.0-alpha.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))





## [0.5.11](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.11-alpha.0...@ceramicnetwork/ceramic-core@0.5.11) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.5.11-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.10...@ceramicnetwork/ceramic-core@0.5.11-alpha.0) (2020-09-09)


### Bug Fixes

* set DID when requesting a signature ([#283](https://github.com/ceramicnetwork/js-ceramic/issues/283)) ([416b639](https://github.com/ceramicnetwork/js-ceramic/commit/416b639eb534655ebe3bc648b2321f0432e4eb6e))
* verify that signatures where made by correct DID ([#276](https://github.com/ceramicnetwork/js-ceramic/issues/276)) ([309a808](https://github.com/ceramicnetwork/js-ceramic/commit/309a8089191e4fbe80f705806f57d6068fdd6ba9))





## [0.5.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.9...@ceramicnetwork/ceramic-core@0.5.10) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.10-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.9...@ceramicnetwork/ceramic-core@0.5.10-alpha.0) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.9-alpha.0...@ceramicnetwork/ceramic-core@0.5.9) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.5.9-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.8...@ceramicnetwork/ceramic-core@0.5.9-alpha.0) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.5.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.7...@ceramicnetwork/ceramic-core@0.5.8) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.5.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.3...@ceramicnetwork/ceramic-core@0.5.7) (2020-09-01)


### Bug Fixes

* **core:** fix document creation ([#253](https://github.com/ceramicnetwork/js-ceramic/issues/253)) ([67e0f23](https://github.com/ceramicnetwork/js-ceramic/commit/67e0f2314c471bde59912fa577ed4b89240ce211))
* **core:** properly pin from context ([#251](https://github.com/ceramicnetwork/js-ceramic/issues/251)) ([5dded96](https://github.com/ceramicnetwork/js-ceramic/commit/5dded968ed59b16c536566f0902d710c9d64b33c))





## [0.5.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.3...@ceramicnetwork/ceramic-core@0.5.6) (2020-09-01)


### Bug Fixes

* **core:** fix document creation ([#253](https://github.com/ceramicnetwork/js-ceramic/issues/253)) ([67e0f23](https://github.com/ceramicnetwork/js-ceramic/commit/67e0f2314c471bde59912fa577ed4b89240ce211))
* **core:** properly pin from context ([#251](https://github.com/ceramicnetwork/js-ceramic/issues/251)) ([5dded96](https://github.com/ceramicnetwork/js-ceramic/commit/5dded968ed59b16c536566f0902d710c9d64b33c))





## [0.5.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.3...@ceramicnetwork/ceramic-core@0.5.5) (2020-09-01)


### Bug Fixes

* **core:** fix document creation ([#253](https://github.com/ceramicnetwork/js-ceramic/issues/253)) ([67e0f23](https://github.com/ceramicnetwork/js-ceramic/commit/67e0f2314c471bde59912fa577ed4b89240ce211))
* **core:** properly pin from context ([#251](https://github.com/ceramicnetwork/js-ceramic/issues/251)) ([5dded96](https://github.com/ceramicnetwork/js-ceramic/commit/5dded968ed59b16c536566f0902d710c9d64b33c))





## [0.5.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.3...@ceramicnetwork/ceramic-core@0.5.4) (2020-09-01)


### Bug Fixes

* **core:** fix document creation ([#253](https://github.com/ceramicnetwork/js-ceramic/issues/253)) ([67e0f23](https://github.com/ceramicnetwork/js-ceramic/commit/67e0f2314c471bde59912fa577ed4b89240ce211))
* **core:** properly pin from context ([#251](https://github.com/ceramicnetwork/js-ceramic/issues/251)) ([5dded96](https://github.com/ceramicnetwork/js-ceramic/commit/5dded968ed59b16c536566f0902d710c9d64b33c))





## [0.5.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.2...@ceramicnetwork/ceramic-core@0.5.3) (2020-08-31)


### Bug Fixes

* doctype getters now returns next state ([#248](https://github.com/ceramicnetwork/js-ceramic/issues/248)) ([d32ab16](https://github.com/ceramicnetwork/js-ceramic/commit/d32ab165a7771e543e8d1e08e64fe2994fb3db34))





## [0.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.5.2-alpha.0...@ceramicnetwork/ceramic-core@0.5.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.5.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@5.0.2...@ceramicnetwork/ceramic-core@0.5.2-alpha.0) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [5.0.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@5.0.1...@ceramicnetwork/ceramic-core@5.0.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [5.0.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.4.0...@ceramicnetwork/ceramic-core@5.0.1) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.8...@ceramicnetwork/ceramic-core@0.4.0) (2020-08-28)


### Bug Fixes

* Pinning, not pinnings ([#209](https://github.com/ceramicnetwork/js-ceramic/issues/209)) ([49688b2](https://github.com/ceramicnetwork/js-ceramic/commit/49688b2b6b698c57683bf16a1a36ffe013187e6b))
* Use `ipfs+connection` string to use IPFS connection from context. ([#227](https://github.com/ceramicnetwork/js-ceramic/issues/227)) ([3af56fc](https://github.com/ceramicnetwork/js-ceramic/commit/3af56fccc912413bb89906f5cc0af0c6ede05fbd))
* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))
* **core:** Powergate pinning ([#201](https://github.com/ceramicnetwork/js-ceramic/issues/201)) ([b8cd3ea](https://github.com/ceramicnetwork/js-ceramic/commit/b8cd3ea91d67ae151ce7bca004e63696c16c31c6))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.8...@ceramicnetwork/ceramic-core@0.3.0) (2020-08-28)


### Bug Fixes

* Pinning, not pinnings ([#209](https://github.com/ceramicnetwork/js-ceramic/issues/209)) ([49688b2](https://github.com/ceramicnetwork/js-ceramic/commit/49688b2b6b698c57683bf16a1a36ffe013187e6b))
* Use `ipfs+connection` string to use IPFS connection from context. ([#227](https://github.com/ceramicnetwork/js-ceramic/issues/227)) ([3af56fc](https://github.com/ceramicnetwork/js-ceramic/commit/3af56fccc912413bb89906f5cc0af0c6ede05fbd))
* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))
* **core:** Powergate pinning ([#201](https://github.com/ceramicnetwork/js-ceramic/issues/201)) ([b8cd3ea](https://github.com/ceramicnetwork/js-ceramic/commit/b8cd3ea91d67ae151ce7bca004e63696c16c31c6))





## [0.2.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.7...@ceramicnetwork/ceramic-core@0.2.8) (2020-08-05)


### Bug Fixes

* **core:** fix content and schema update ([#197](https://github.com/ceramicnetwork/js-ceramic/issues/197)) ([b16b229](https://github.com/ceramicnetwork/js-ceramic/commit/b16b229d23d788c8cce39fbf883850f0716e83b0))





## [0.2.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.6...@ceramicnetwork/ceramic-core@0.2.7) (2020-07-21)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.2.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.5...@ceramicnetwork/ceramic-core@0.2.6) (2020-07-21)


### Bug Fixes

* fix conflicts with master ([1077bdb](https://github.com/ceramicnetwork/js-ceramic/commit/1077bdb81ce10bfeafa5a53922eb93dfcf4b23f6))
* **core:** change preconditions ([1604900](https://github.com/ceramicnetwork/js-ceramic/commit/1604900d210cf80f26169d4e12e022cd64115d35))
* **core:** fix state management ([#159](https://github.com/ceramicnetwork/js-ceramic/issues/159)) ([0c07c77](https://github.com/ceramicnetwork/js-ceramic/commit/0c07c771d0bf46f9e58a8f441fb59865fa26f0a7))
* **core:** increase test timeout ([5cc3cf2](https://github.com/ceramicnetwork/js-ceramic/commit/5cc3cf26ee5585ac4cafcf94b443ac6542f133e1))


### Features

* document versioning ([#176](https://github.com/ceramicnetwork/js-ceramic/issues/176)) ([5c138f0](https://github.com/ceramicnetwork/js-ceramic/commit/5c138f0ecd3433ef364b9a266607263ee97526d1))





## [0.2.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.5-alpha.0...@ceramicnetwork/ceramic-core@0.2.5) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.2.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.4...@ceramicnetwork/ceramic-core@0.2.5-alpha.0) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.2.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.3...@ceramicnetwork/ceramic-core@0.2.4) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.2.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.2...@ceramicnetwork/ceramic-core@0.2.3) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





## [0.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.1...@ceramicnetwork/ceramic-core@0.2.2) (2020-07-13)


### Bug Fixes

* **account-template:** fix import ([3a660d7](https://github.com/ceramicnetwork/js-ceramic/commit/3a660d72f654d7614f207587b5086888c9da6273))





## [0.2.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.0...@ceramicnetwork/ceramic-core@0.2.1) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-core





# [0.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.1.0...@ceramicnetwork/ceramic-core@0.2.0) (2020-04-17)


### Bug Fixes

* **core:** clone records to stop bad modifications ([cfdb6c7](https://github.com/ceramicnetwork/js-ceramic/commit/cfdb6c70bbab02a4c75cf0f54bc30c7013a0ead5))
* **core:** properly encode jwts for signature verification ([22a9cd0](https://github.com/ceramicnetwork/js-ceramic/commit/22a9cd0f1fbe3e6dd401d131ce6adc1476cf4711))
* **package:** explicitly set identity-wallet version for now ([22dee43](https://github.com/ceramicnetwork/js-ceramic/commit/22dee4363167a00c5a39a9b690f44d8b9e1a1221))
* on createDocument, return copy in _docmap ([#37](https://github.com/ceramicnetwork/js-ceramic/issues/37)) ([d978e2d](https://github.com/ceramicnetwork/js-ceramic/commit/d978e2d26a5f4335a0e7b96370ea3bfa3640ae9b))


### Features

* **cli:** add cli dockerfile, add ipfs-api daemon option ([#34](https://github.com/ceramicnetwork/js-ceramic/issues/34)) ([2822cb4](https://github.com/ceramicnetwork/js-ceramic/commit/2822cb4df0e2c4cdd9c9111100551191ceb85e86))





# 0.1.0 (2020-04-08)


### Bug Fixes

* build type check etc. ([89fa279](https://github.com/ceramicnetwork/js-ceramic/commit/89fa2799a496e7fa900b9769db5f85491837cad4))
* **core:** use correct CID format ([4ca5b8d](https://github.com/ceramicnetwork/js-ceramic/commit/4ca5b8d3d7866b70b8c3ad53d63afb1b5c141d35))


### Features

* **cli:** implemented most commands ([16c860e](https://github.com/ceramicnetwork/js-ceramic/commit/16c860e18784ee6a61701f99059ac927b0b19c2e))
* **core:** add anchor module and refactor doctype update mechanism ([bfc5515](https://github.com/ceramicnetwork/js-ceramic/commit/bfc551525079e288e3ec3e67b9c7bea26449edd4))
* **core:** implement 3id and tile doctypes ([c1fa90c](https://github.com/ceramicnetwork/js-ceramic/commit/c1fa90c61c8a1ea1dd61fdf23d50e40fc674f14b))
* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))





# 0.1.0-alpha.0 (2020-04-07)


### Bug Fixes

* build type check etc. ([89fa279](https://github.com/ceramicnetwork/js-ceramic/commit/89fa2799a496e7fa900b9769db5f85491837cad4))
* **core:** use correct CID format ([4ca5b8d](https://github.com/ceramicnetwork/js-ceramic/commit/4ca5b8d3d7866b70b8c3ad53d63afb1b5c141d35))


### Features

* **cli:** implemented most commands ([16c860e](https://github.com/ceramicnetwork/js-ceramic/commit/16c860e18784ee6a61701f99059ac927b0b19c2e))
* **core:** add anchor module and refactor doctype update mechanism ([bfc5515](https://github.com/ceramicnetwork/js-ceramic/commit/bfc551525079e288e3ec3e67b9c7bea26449edd4))
* **core:** implement 3id and tile doctypes ([c1fa90c](https://github.com/ceramicnetwork/js-ceramic/commit/c1fa90c61c8a1ea1dd61fdf23d50e40fc674f14b))
* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))
