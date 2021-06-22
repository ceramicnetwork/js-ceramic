# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.1.0](/compare/@ceramicnetwork/common@1.1.0-rc.0...@ceramicnetwork/common@1.1.0) (2021-06-22)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.1.0-rc.0](/compare/@ceramicnetwork/common@1.0.6...@ceramicnetwork/common@1.1.0-rc.0) (2021-06-21)


### Bug Fixes

* **core:** Only poll for anchors at startup, don't submit a new request (#1437) ec17446, closes #1437


### Features

* **core:** Loading a CommitID makes the node handle the commit CID as a potential new tip (#1484) 46e0f22, closes #1484





## [1.0.6](/compare/@ceramicnetwork/common@1.0.5...@ceramicnetwork/common@1.0.6) (2021-06-06)

**Note:** Version bump only for package @ceramicnetwork/common





## [1.0.5](/compare/@ceramicnetwork/common@1.0.4...@ceramicnetwork/common@1.0.5) (2021-06-03)


### Bug Fixes

* **core:** ipfs subscribe, pin version (#1454) fc9c5e7, closes #1454
* Pin dag-jose contents (#1451) a598c10, closes #1451





## [1.0.4](/compare/@ceramicnetwork/common@1.0.4-rc.0...@ceramicnetwork/common@1.0.4) (2021-05-31)

**Note:** Version bump only for package @ceramicnetwork/common





## [1.0.4-rc.0](/compare/@ceramicnetwork/common@1.0.3...@ceramicnetwork/common@1.0.4-rc.0) (2021-05-28)


### Bug Fixes

* **core:** only sync pinned streams the first time they are loaded (#1417) 76be682, closes #1417





## [1.0.3](/compare/@ceramicnetwork/common@1.0.2...@ceramicnetwork/common@1.0.3) (2021-05-25)

**Note:** Version bump only for package @ceramicnetwork/common





## [1.0.2](/compare/@ceramicnetwork/common@1.0.1...@ceramicnetwork/common@1.0.2) (2021-05-20)

**Note:** Version bump only for package @ceramicnetwork/common





## [1.0.1](/compare/@ceramicnetwork/common@1.0.0...@ceramicnetwork/common@1.0.1) (2021-05-13)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.0.0](/compare/@ceramicnetwork/common@1.0.0-rc.6...@ceramicnetwork/common@1.0.0) (2021-05-06)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.0.0-rc.6](/compare/@ceramicnetwork/common@1.0.0-rc.5...@ceramicnetwork/common@1.0.0-rc.6) (2021-04-29)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.0.0-rc.5](/compare/@ceramicnetwork/common@1.0.0-rc.4...@ceramicnetwork/common@1.0.0-rc.5) (2021-04-28)


### Bug Fixes

* **common:** CeramicApi compatibility (#1326) 1837c0d, closes #1326


### Features

* Make optional custom file name for service log (#1325) f8b3c6d, closes #1325





# [1.0.0-rc.4](/compare/@ceramicnetwork/common@1.0.0-rc.3...@ceramicnetwork/common@1.0.0-rc.4) (2021-04-23)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.0.0-rc.3](/compare/@ceramicnetwork/common@1.0.0-rc.2...@ceramicnetwork/common@1.0.0-rc.3) (2021-04-20)


### Bug Fixes

* **common:** Remove additional LF symbol introduced by Morgan logger (#1222) 838ce9c, closes #1222
* Fix tests by using node environment for jest (#1212) 0f04006, closes #1212


### Features

* **cli,http-client:** Update HTTP API to use streams terminology (#1237) 6c0a142, closes #1237
* **common:** Change 'sync' option to an enum and refine sync behaviors (#1269) 0b652fb, closes #1269
* **common:** Miscellaneous renames from document-based to stream-based terminology (#1290) 2ca935e, closes #1290
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis (#1285) 0dbfbf3, closes #1285
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string (#1286) 967cf11, closes #1286
* DocState contains type as number (#1250) 56501e2, closes #1250
* **common:** Remove deprecated methods named with Records instead of Commits (#1217) 43fa46a, closes #1217
* **common:** Rename Doctype to Stream (#1266) 4ebb6ac, closes #1266
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts (#1229) 85ccbb8, closes #1229
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() (#1196) e9b3c18, closes #1196
* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link (#1216) f594ff0, closes #1216
* **doctype-tile:** Log when DID is authenticated (#1199) 9d4a779, closes #1199
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument (#1225) ce0694b, closes #1225
* **streamid:** Rename DocID to StreamID (#1195) 65754d1, closes #1195
* seperate node and browser loggers 0532bee
* **tile-doctype:** Update Tile API (#1180) 90973ee, closes #1180





# [1.0.0-rc.2](/compare/@ceramicnetwork/common@1.0.0-rc.1...@ceramicnetwork/common@1.0.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/common





# [1.0.0-rc.1](/compare/@ceramicnetwork/common@0.18.0-rc.1...@ceramicnetwork/common@1.0.0-rc.1) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.18.0-rc.1](/compare/@ceramicnetwork/common@0.17.0...@ceramicnetwork/common@0.18.0-rc.1) (2021-04-19)


### Bug Fixes

* Fix tests by using node environment for jest (#1212) aff01c6, closes #1212





# [0.18.0-rc.0](/compare/@ceramicnetwork/common@0.17.0...@ceramicnetwork/common@0.18.0-rc.0) (2021-04-02)


### Features

* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **tile-doctype:** Update Tile API 48f30e1





# [0.17.0](/compare/@ceramicnetwork/common@0.16.0...@ceramicnetwork/common@0.17.0) (2021-04-02)


### Bug Fixes

* **common:** Don't use node packages at runtime in the logger if we might be running in-browser (#1165) 937c4f4, closes #1165
* **common, logger:** Clean up dependencies (#1164) 191ad31, closes #1164


### Features

* add networks enum and elp (#1187) 7a60b30, closes #1187





## [0.16.1-rc.4](/compare/@ceramicnetwork/common@0.16.0...@ceramicnetwork/common@0.16.1-rc.4) (2021-03-26)


### Bug Fixes

* **common, logger:** Clean up dependencies 57ffa67





## [0.16.1-rc.3](/compare/@ceramicnetwork/common@0.16.0...@ceramicnetwork/common@0.16.1-rc.3) (2021-03-26)


### Bug Fixes

* **common, logger:** Clean up dependencies 2243d05





## [0.16.1-rc.2](/compare/@ceramicnetwork/common@0.16.0...@ceramicnetwork/common@0.16.1-rc.2) (2021-03-26)


### Bug Fixes

* **common, logger:** Clean up dependencies 2243d05





## [0.16.1-rc.1](/compare/@ceramicnetwork/common@0.16.1-rc.0...@ceramicnetwork/common@0.16.1-rc.1) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.16.1-rc.0](/compare/@ceramicnetwork/common@0.16.0...@ceramicnetwork/common@0.16.1-rc.0) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.16.0](/compare/@ceramicnetwork/common@0.16.0-rc.11...@ceramicnetwork/common@0.16.0) (2021-03-22)


### Features

* **core:** Meat of State Refactor: final concurrency model (#1130) 345d3d1, closes #1130 #1141





# [0.16.0-rc.11](/compare/@ceramicnetwork/common@0.16.0-rc.10...@ceramicnetwork/common@0.16.0-rc.11) (2021-03-15)


### Features

* **core:** enable the use of timestamps (#1117) f417e27, closes #1117





# [0.16.0-rc.10](/compare/@ceramicnetwork/common@0.16.0-rc.9...@ceramicnetwork/common@0.16.0-rc.10) (2021-03-12)


### Features

* upgrade 3id did resolver (#1108) 24ef6d4, closes #1108





# [0.16.0-rc.9](/compare/@ceramicnetwork/common@0.16.0-rc.8...@ceramicnetwork/common@0.16.0-rc.9) (2021-03-10)


### Bug Fixes

* **core:** Don't display anchorScheduledFor at all when anchored (#1101) 3be9e74, closes #1101





# [0.16.0-rc.8](/compare/@ceramicnetwork/common@0.16.0-rc.6...@ceramicnetwork/common@0.16.0-rc.8) (2021-03-09)


### Features

* Feed of pubsub messages (#1058) 2d2bb5c, closes #1058





# [0.16.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.15.9...@ceramicnetwork/common@0.16.0-rc.7) (2021-02-25)


### Bug Fixes

* **common:** Show timezone with anchorScheduledFor property [#897](https://github.com/ceramicnetwork/js-ceramic/issues/897) ([#951](https://github.com/ceramicnetwork/js-ceramic/issues/951)) ([be2b472](https://github.com/ceramicnetwork/js-ceramic/commit/be2b472640d35165efeb61437b83a81f29e878be))


### Features

* Feed of pubsub messages ([#1058](https://github.com/ceramicnetwork/js-ceramic/issues/1058)) ([2d2bb5c](https://github.com/ceramicnetwork/js-ceramic/commit/2d2bb5c11082bd76d495817482e8ac21af20f6e5))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))





# [0.16.0-rc.6](/compare/@ceramicnetwork/common@0.16.0-rc.5...@ceramicnetwork/common@0.16.0-rc.6) (2021-02-24)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.16.0-rc.5](/compare/@ceramicnetwork/common@0.16.0-rc.3...@ceramicnetwork/common@0.16.0-rc.5) (2021-02-23)


### Features

* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.16.0-rc.4](/compare/@ceramicnetwork/common@0.16.0-rc.3...@ceramicnetwork/common@0.16.0-rc.4) (2021-02-23)


### Features

* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.16.0-rc.3](/compare/@ceramicnetwork/common@0.16.0-rc.2...@ceramicnetwork/common@0.16.0-rc.3) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.16.0-rc.2](/compare/@ceramicnetwork/common@0.16.0-rc.0...@ceramicnetwork/common@0.16.0-rc.2) (2021-02-22)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.16.0-rc.0](/compare/@ceramicnetwork/common@0.15.9...@ceramicnetwork/common@0.16.0-rc.0) (2021-02-22)


### Bug Fixes

* **common:** Show timezone with anchorScheduledFor property #897 (#951) be2b472, closes #897 #951


### Features

* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig (#1021) a53c534, closes #1021
* Unbundle DocID into DocID and CommitID (#1009) c2707f2, closes #1009
* **core:** Add new logger package (#878) 9756868, closes #878





## [0.15.9](/compare/@ceramicnetwork/common@0.15.9-rc.0...@ceramicnetwork/common@0.15.9) (2021-02-04)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.15.9-rc.0](/compare/@ceramicnetwork/common@0.15.8...@ceramicnetwork/common@0.15.9-rc.0) (2021-01-29)


### Bug Fixes

* **common:** Don't serialize null state fields (#867) 51b7375, closes #867





## [0.15.8](/compare/@ceramicnetwork/common@0.15.7...@ceramicnetwork/common@0.15.8) (2021-01-21)


### Bug Fixes

* **core:** Honor ethereumRpcUrl config option (#830) a440b59, closes #830





## [0.15.7](/compare/@ceramicnetwork/common@0.15.6...@ceramicnetwork/common@0.15.7) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.15.6](/compare/@ceramicnetwork/common@0.15.5...@ceramicnetwork/common@0.15.6) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.15.5](/compare/@ceramicnetwork/common@0.15.4...@ceramicnetwork/common@0.15.5) (2021-01-13)


### Bug Fixes

* **cli,http-client:** Fix pin API in CLI and http client (#752) 20fcd75, closes #752





## [0.15.4](/compare/@ceramicnetwork/common@0.15.3...@ceramicnetwork/common@0.15.4) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.15.3](/compare/@ceramicnetwork/common@0.15.2...@ceramicnetwork/common@0.15.3) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/common





## [0.15.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.15.1...@ceramicnetwork/common@0.15.2) (2020-12-29)


### Bug Fixes

* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))





## [0.15.1](/compare/@ceramicnetwork/common@0.15.0...@ceramicnetwork/common@0.15.1) (2020-12-23)


### Reverts

* Revert "chore(release):" 26ed474





# [0.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.15.0-alpha.0...@ceramicnetwork/common@0.15.0) (2020-12-17)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.15.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.14.1...@ceramicnetwork/common@0.15.0-alpha.0) (2020-12-14)


### Bug Fixes

* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* **doctype-caip10-link:** solidify data structure ([#619](https://github.com/ceramicnetwork/js-ceramic/issues/619)) ([d1e3b98](https://github.com/ceramicnetwork/js-ceramic/commit/d1e3b98bda51ad3a7d2b7d31b253be3a181d91ae))


### Features

* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))





## [0.14.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.14.0...@ceramicnetwork/common@0.14.1) (2020-12-08)

**Note:** Version bump only for package @ceramicnetwork/common





# [0.14.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.13.2...@ceramicnetwork/common@0.14.0) (2020-12-01)


### Features

* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))





## [0.13.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.13.1...@ceramicnetwork/common@0.13.2) (2020-11-30)


### Bug Fixes

* **common:** fix IpfsApi import ([#565](https://github.com/ceramicnetwork/js-ceramic/issues/565)) ([802c284](https://github.com/ceramicnetwork/js-ceramic/commit/802c284657c3d03df4268c1cf1f6d445e6b7218d))





## [0.13.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/common@0.13.0...@ceramicnetwork/common@0.13.1) (2020-11-26)

**Note:** Version bump only for package @ceramicnetwork/common





# 0.13.0 (2020-11-24)


### Features

* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))





## [0.12.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.12.2-alpha.0...@ceramicnetwork/ceramic-common@0.12.2) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.12.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.12.1...@ceramicnetwork/ceramic-common@0.12.2-alpha.0) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.12.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.12.0...@ceramicnetwork/ceramic-common@0.12.1) (2020-11-11)


### Bug Fixes

* bump IDW dep, fix Dockerfile ([#474](https://github.com/ceramicnetwork/js-ceramic/issues/474)) ([79b39a4](https://github.com/ceramicnetwork/js-ceramic/commit/79b39a4e7212c22991805ae1b93f10b3d146d540))





# [0.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.12.0-alpha.0...@ceramicnetwork/ceramic-common@0.12.0) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.12.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.11.0...@ceramicnetwork/ceramic-common@0.12.0-alpha.0) (2020-10-27)


### Features

* **core:** Rename owners to controllers ([#423](https://github.com/ceramicnetwork/js-ceramic/issues/423)) ([c94ff15](https://github.com/ceramicnetwork/js-ceramic/commit/c94ff155a10c7dd3c486846f6cd8e91d320485cc))





# [0.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.11.0-alpha.0...@ceramicnetwork/ceramic-common@0.11.0) (2020-10-26)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.11.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.10.2-alpha.0...@ceramicnetwork/ceramic-common@0.11.0-alpha.0) (2020-10-26)


### Bug Fixes

* fix tests and minor refactor ([71825e2](https://github.com/ceramicnetwork/js-ceramic/commit/71825e22282c5e9a8e53f431e82ff1fb9ce7eec5))


### Features

* docids support ([1e48e9e](https://github.com/ceramicnetwork/js-ceramic/commit/1e48e9e88090463f27f831f4b47a3fab30ba8c5e))
* idw update, docid idw ([09c7c0d](https://github.com/ceramicnetwork/js-ceramic/commit/09c7c0dc8e6e60ca3cf190f6e3c2b6c51a2e52ae))





## [0.10.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.10.1...@ceramicnetwork/ceramic-common@0.10.2-alpha.0) (2020-10-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.10.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.10.1-alpha.0...@ceramicnetwork/ceramic-common@0.10.1) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.10.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.10.0...@ceramicnetwork/ceramic-common@0.10.1-alpha.0) (2020-10-13)


### Bug Fixes

* change identity-wallet version ([#384](https://github.com/ceramicnetwork/js-ceramic/issues/384)) ([9e0ba75](https://github.com/ceramicnetwork/js-ceramic/commit/9e0ba752b22c944b827edcecd68cb987905fd4d6))
* properly handle versions and key rotations ([#399](https://github.com/ceramicnetwork/js-ceramic/issues/399)) ([c70f04c](https://github.com/ceramicnetwork/js-ceramic/commit/c70f04c037929568e796cf4b7e523679c81818e1))





# [0.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.9.1-alpha.1...@ceramicnetwork/ceramic-common@0.10.0) (2020-10-07)


### Bug Fixes

* add todos to remove logToFile ([5f5433a](https://github.com/ceramicnetwork/js-ceramic/commit/5f5433a7636bba134457a9b264c7e88bf3ad4aed))
* log errors and refactor http logging ([da1f777](https://github.com/ceramicnetwork/js-ceramic/commit/da1f777ecea1507eb58662132d0db48c9dba2de8))
* remove logToFile in favor of plugin and update file names ([5bbdd27](https://github.com/ceramicnetwork/js-ceramic/commit/5bbdd27922d8b873a42fb18a83e2bb0815b4052f))


### Features

* add log to file ([b342226](https://github.com/ceramicnetwork/js-ceramic/commit/b3422261c7ec34495140cbc39fdbdcde456b3110))
* add logger plugin to write to files ([54a1e13](https://github.com/ceramicnetwork/js-ceramic/commit/54a1e13a62b4d0bf348379a3f82670307fa45e91))
* make log to file optional and config path ([581bba8](https://github.com/ceramicnetwork/js-ceramic/commit/581bba8c91f963893fb5509b97b939cfee0bd68d))





## [0.9.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.9.1-alpha.0...@ceramicnetwork/ceramic-common@0.9.1-alpha.1) (2020-10-06)


### Bug Fixes

* **common:** fix check ([#379](https://github.com/ceramicnetwork/js-ceramic/issues/379)) ([d3a050a](https://github.com/ceramicnetwork/js-ceramic/commit/d3a050aba0cc32b3a97050146c4e0b88a964d1d5))





## [0.9.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.9.0...@ceramicnetwork/ceramic-common@0.9.1-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.9.0-alpha.1...@ceramicnetwork/ceramic-common@0.9.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.9.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.2-alpha.0...@ceramicnetwork/ceramic-common@0.9.0-alpha.1) (2020-10-05)


### Features

* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))





# [0.9.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.2-alpha.0...@ceramicnetwork/ceramic-common@0.9.0-alpha.0) (2020-09-28)


### Features

* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))


## [0.8.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.2-alpha.0...@ceramicnetwork/ceramic-common@0.8.2) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common



## [0.8.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.1-alpha.1...@ceramicnetwork/ceramic-common@0.8.2-alpha.0) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.8.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.1-alpha.0...@ceramicnetwork/ceramic-common@0.8.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common


## [0.8.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.1-alpha.0...@ceramicnetwork/ceramic-common@0.8.1-alpha.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common


## [0.8.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.0...@ceramicnetwork/ceramic-common@0.8.1-alpha.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.8.0-alpha.0...@ceramicnetwork/ceramic-common@0.8.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.8.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.7.0...@ceramicnetwork/ceramic-common@0.8.0-alpha.0) (2020-09-25)


### Features

* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.7.0-alpha.0...@ceramicnetwork/ceramic-common@0.7.0) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.7.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.6.1...@ceramicnetwork/ceramic-common@0.7.0-alpha.0) (2020-09-17)


### Features

* **cli:** disable CLI logs ([#311](https://github.com/ceramicnetwork/js-ceramic/issues/311)) ([2a2494d](https://github.com/ceramicnetwork/js-ceramic/commit/2a2494d24bb58853b61d2f6444f62bbb7f81e1d7))





## [0.6.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.6.1-alpha.0...@ceramicnetwork/ceramic-common@0.6.1) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.6.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.6.0...@ceramicnetwork/ceramic-common@0.6.1-alpha.0) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.11...@ceramicnetwork/ceramic-common@0.6.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))
* **cli:** add config option to CLI, fix seed generation ([#293](https://github.com/ceramicnetwork/js-ceramic/issues/293)) ([4543d4e](https://github.com/ceramicnetwork/js-ceramic/commit/4543d4e298663eacc981c3d07e64bf0334f84076))





# [0.6.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.11...@ceramicnetwork/ceramic-common@0.6.0-alpha.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))
* **cli:** add config option to CLI, fix seed generation ([#293](https://github.com/ceramicnetwork/js-ceramic/issues/293)) ([4543d4e](https://github.com/ceramicnetwork/js-ceramic/commit/4543d4e298663eacc981c3d07e64bf0334f84076))





## [0.5.11](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.11-alpha.0...@ceramicnetwork/ceramic-common@0.5.11) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.11-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.10...@ceramicnetwork/ceramic-common@0.5.11-alpha.0) (2020-09-09)


### Bug Fixes

* **common:** Output time in local timezone ([#273](https://github.com/ceramicnetwork/js-ceramic/issues/273)) ([c6ca9e3](https://github.com/ceramicnetwork/js-ceramic/commit/c6ca9e38b9d4eb5481f4677d0b6064a0fc48a5bf))





## [0.5.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.9...@ceramicnetwork/ceramic-common@0.5.10) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.10-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.9...@ceramicnetwork/ceramic-common@0.5.10-alpha.0) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.9-alpha.0...@ceramicnetwork/ceramic-common@0.5.9) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.9-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.7...@ceramicnetwork/ceramic-common@0.5.9-alpha.0) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.3...@ceramicnetwork/ceramic-common@0.5.7) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.3...@ceramicnetwork/ceramic-common@0.5.6) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.3...@ceramicnetwork/ceramic-common@0.5.5) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.3...@ceramicnetwork/ceramic-common@0.5.4) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.2...@ceramicnetwork/ceramic-common@0.5.3) (2020-08-31)


### Bug Fixes

* doctype getters now returns next state ([#248](https://github.com/ceramicnetwork/js-ceramic/issues/248)) ([d32ab16](https://github.com/ceramicnetwork/js-ceramic/commit/d32ab165a7771e543e8d1e08e64fe2994fb3db34))





## [0.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.5.2-alpha.0...@ceramicnetwork/ceramic-common@0.5.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.5.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.4.0...@ceramicnetwork/ceramic-common@0.5.2-alpha.0) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





# [0.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.8...@ceramicnetwork/ceramic-common@0.4.0) (2020-08-28)


### Bug Fixes

* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.8...@ceramicnetwork/ceramic-common@0.3.0) (2020-08-28)


### Bug Fixes

* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





## [0.2.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.7...@ceramicnetwork/ceramic-common@0.2.8) (2020-08-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.6...@ceramicnetwork/ceramic-common@0.2.7) (2020-07-21)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.5...@ceramicnetwork/ceramic-common@0.2.6) (2020-07-21)


### Bug Fixes

* fix conflicts with master ([1077bdb](https://github.com/ceramicnetwork/js-ceramic/commit/1077bdb81ce10bfeafa5a53922eb93dfcf4b23f6))


### Features

* document versioning ([#176](https://github.com/ceramicnetwork/js-ceramic/issues/176)) ([5c138f0](https://github.com/ceramicnetwork/js-ceramic/commit/5c138f0ecd3433ef364b9a266607263ee97526d1))





## [0.2.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.5-alpha.0...@ceramicnetwork/ceramic-common@0.2.5) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.4...@ceramicnetwork/ceramic-common@0.2.5-alpha.0) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.3...@ceramicnetwork/ceramic-common@0.2.4) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.2...@ceramicnetwork/ceramic-common@0.2.3) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common





## [0.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-common@0.2.1...@ceramicnetwork/ceramic-common@0.2.2) (2020-07-13)


### Bug Fixes

* **account-template:** fix import ([3a660d7](https://github.com/ceramicnetwork/js-ceramic/commit/3a660d72f654d7614f207587b5086888c9da6273))





## 0.2.1 (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-common
