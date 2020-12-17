# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.12.4-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.12.3...@ceramicnetwork/doctype-tile@0.12.4-alpha.0) (2020-12-14)


### Bug Fixes

* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))





## [0.12.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.12.2...@ceramicnetwork/doctype-tile@0.12.3) (2020-12-09)


### Bug Fixes

* **doctype-tile:** unbreak tile makeGenesis metadata ([#608](https://github.com/ceramicnetwork/js-ceramic/issues/608)) ([760e214](https://github.com/ceramicnetwork/js-ceramic/commit/760e214639730bfa45a3e6c9cbaf58c7061d3a1c))





## [0.12.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.12.1...@ceramicnetwork/doctype-tile@0.12.2) (2020-12-08)

**Note:** Version bump only for package @ceramicnetwork/doctype-tile





## [0.12.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.12.0...@ceramicnetwork/doctype-tile@0.12.1) (2020-12-03)


### Bug Fixes

* **doctype-tile:** bug in squashing logic was mitigated ([#587](https://github.com/ceramicnetwork/js-ceramic/issues/587)) ([f8c1e77](https://github.com/ceramicnetwork/js-ceramic/commit/f8c1e77928bca8064a60864c15ab95f881e5acf4))
* **doctype-tile:** don't require auth when creating empty genesis records ([#588](https://github.com/ceramicnetwork/js-ceramic/issues/588)) ([b9745fa](https://github.com/ceramicnetwork/js-ceramic/commit/b9745fac3c9abd0b4e577f4e956966d2446c68a0))





# [0.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.11.3...@ceramicnetwork/doctype-tile@0.12.0) (2020-12-01)


### Features

* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))





## [0.11.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.11.2...@ceramicnetwork/doctype-tile@0.11.3) (2020-11-30)


### Bug Fixes

* **doctype-tile:** properly make new record when genesis is empty ([#566](https://github.com/ceramicnetwork/js-ceramic/issues/566)) ([eccde51](https://github.com/ceramicnetwork/js-ceramic/commit/eccde51abdd5dbd2a2655b33666a14698946fa4a))





## [0.11.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.11.1...@ceramicnetwork/doctype-tile@0.11.2) (2020-11-30)


### Bug Fixes

* **doctype-tile:** properly handle unsigned genesis records ([#564](https://github.com/ceramicnetwork/js-ceramic/issues/564)) ([c7df75c](https://github.com/ceramicnetwork/js-ceramic/commit/c7df75ce6c5ff84f01fe781e25578ed4cc271761))





## [0.11.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/doctype-tile@0.11.0...@ceramicnetwork/doctype-tile@0.11.1) (2020-11-26)

**Note:** Version bump only for package @ceramicnetwork/doctype-tile





# 0.11.0 (2020-11-24)


### Features

* **3id-did-resolver:** resolve v0 and v1 3ids ([#511](https://github.com/ceramicnetwork/js-ceramic/issues/511)) ([eedeb98](https://github.com/ceramicnetwork/js-ceramic/commit/eedeb989855540445c8d693c01a5c26e5796e5b4))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Enforce that anchors happen on the chainId specified in the document metadata ([#521](https://github.com/ceramicnetwork/js-ceramic/issues/521)) ([3edb62d](https://github.com/ceramicnetwork/js-ceramic/commit/3edb62d6936605d786df681b3b92b48a961222bb))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **tile:** Enforce that schemas must always be assigned with a version ([#477](https://github.com/ceramicnetwork/js-ceramic/issues/477)) ([28d8212](https://github.com/ceramicnetwork/js-ceramic/commit/28d8212a7b8cab399a2e8af6ba525e908c4548ab))
* **tile:** Fix metadata handling and test schema enforcement behavior ([#459](https://github.com/ceramicnetwork/js-ceramic/issues/459)) ([3689228](https://github.com/ceramicnetwork/js-ceramic/commit/3689228aefd8799d3bad572a93bd75760c6cc7cd))





## [0.10.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.10.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.10.2) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.10.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.10.1...@ceramicnetwork/ceramic-doctype-tile@0.10.2-alpha.0) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.10.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.10.0...@ceramicnetwork/ceramic-doctype-tile@0.10.1) (2020-11-11)


### Bug Fixes

* bump IDW dep, fix Dockerfile ([#474](https://github.com/ceramicnetwork/js-ceramic/issues/474)) ([79b39a4](https://github.com/ceramicnetwork/js-ceramic/commit/79b39a4e7212c22991805ae1b93f10b3d146d540))





# [0.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.10.0-alpha.1...@ceramicnetwork/ceramic-doctype-tile@0.10.0) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.10.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.10.0-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.10.0-alpha.1) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.10.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.9.0...@ceramicnetwork/ceramic-doctype-tile@0.10.0-alpha.0) (2020-10-27)


### Bug Fixes

* **tile:** remove undefined nonce ([#425](https://github.com/ceramicnetwork/js-ceramic/issues/425)) ([12b3f5b](https://github.com/ceramicnetwork/js-ceramic/commit/12b3f5b58310806c234da1adc254d84380317883))


### Features

* **core:** Rename owners to controllers ([#423](https://github.com/ceramicnetwork/js-ceramic/issues/423)) ([c94ff15](https://github.com/ceramicnetwork/js-ceramic/commit/c94ff155a10c7dd3c486846f6cd8e91d320485cc))





# [0.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.9.0-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.9.0) (2020-10-26)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.9.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.3-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.9.0-alpha.0) (2020-10-26)


### Features

* docids support ([1e48e9e](https://github.com/ceramicnetwork/js-ceramic/commit/1e48e9e88090463f27f831f4b47a3fab30ba8c5e))
* idw update, docid idw ([09c7c0d](https://github.com/ceramicnetwork/js-ceramic/commit/09c7c0dc8e6e60ca3cf190f6e3c2b6c51a2e52ae))





## [0.8.3-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.2...@ceramicnetwork/ceramic-doctype-tile@0.8.3-alpha.0) (2020-10-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.8.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.8.2) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.8.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.1...@ceramicnetwork/ceramic-doctype-tile@0.8.2-alpha.0) (2020-10-13)


### Bug Fixes

* change identity-wallet version ([#384](https://github.com/ceramicnetwork/js-ceramic/issues/384)) ([9e0ba75](https://github.com/ceramicnetwork/js-ceramic/commit/9e0ba752b22c944b827edcecd68cb987905fd4d6))
* properly handle versions and key rotations ([#399](https://github.com/ceramicnetwork/js-ceramic/issues/399)) ([c70f04c](https://github.com/ceramicnetwork/js-ceramic/commit/c70f04c037929568e796cf4b7e523679c81818e1))





## [0.8.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.1-alpha.1...@ceramicnetwork/ceramic-doctype-tile@0.8.1) (2020-10-07)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.8.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.1-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.8.1-alpha.1) (2020-10-06)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.8.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.0...@ceramicnetwork/ceramic-doctype-tile@0.8.1-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.8.0-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.8.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.8.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.8.0-alpha.0) (2020-10-05)


### Features

* add dag-jose format to ipfs-http-client ([#341](https://github.com/ceramicnetwork/js-ceramic/issues/341)) ([18cbec8](https://github.com/ceramicnetwork/js-ceramic/commit/18cbec8fddc63c63cd02459f1dc6ff4e068f202f))





## [0.7.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.7.2) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile


## [0.7.2-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.7.2-alpha.1) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile



## [0.7.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.1-alpha.1...@ceramicnetwork/ceramic-doctype-tile@0.7.2-alpha.0) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.7.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.1-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.7.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile


## [0.7.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.1-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.7.1-alpha.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile


## [0.7.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.7.0...@ceramicnetwork/ceramic-doctype-tile@0.7.1-alpha.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.2...@ceramicnetwork/ceramic-doctype-tile@0.7.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.7.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.2...@ceramicnetwork/ceramic-doctype-tile@0.7.0-alpha.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





## [0.6.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.2-alpha.1...@ceramicnetwork/ceramic-doctype-tile@0.6.2) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.6.2-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.6.2-alpha.1) (2020-09-17)


### Bug Fixes

* **tile:** fix owners undefined ([#312](https://github.com/ceramicnetwork/js-ceramic/issues/312)) ([77bf331](https://github.com/ceramicnetwork/js-ceramic/commit/77bf331f16382b6551d6c6b4a69e8d6bd0d514f3))





## [0.6.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.1...@ceramicnetwork/ceramic-doctype-tile@0.6.2-alpha.0) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.6.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.1-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.6.1) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.6.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.0...@ceramicnetwork/ceramic-doctype-tile@0.6.1-alpha.0) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.6.0-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.6.0) (2020-09-11)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.6.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.11...@ceramicnetwork/ceramic-doctype-tile@0.6.0-alpha.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))





## [0.5.11](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.11-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.5.11) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.11-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.10...@ceramicnetwork/ceramic-doctype-tile@0.5.11-alpha.0) (2020-09-09)


### Bug Fixes

* set DID when requesting a signature ([#283](https://github.com/ceramicnetwork/js-ceramic/issues/283)) ([416b639](https://github.com/ceramicnetwork/js-ceramic/commit/416b639eb534655ebe3bc648b2321f0432e4eb6e))
* verify that signatures where made by correct DID ([#276](https://github.com/ceramicnetwork/js-ceramic/issues/276)) ([309a808](https://github.com/ceramicnetwork/js-ceramic/commit/309a8089191e4fbe80f705806f57d6068fdd6ba9))





## [0.5.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.9...@ceramicnetwork/ceramic-doctype-tile@0.5.10) (2020-09-04)


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.10-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.9...@ceramicnetwork/ceramic-doctype-tile@0.5.10-alpha.0) (2020-09-04)


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.9-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.5.9) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.9-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.8...@ceramicnetwork/ceramic-doctype-tile@0.5.9-alpha.0) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.7...@ceramicnetwork/ceramic-doctype-tile@0.5.8) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.3...@ceramicnetwork/ceramic-doctype-tile@0.5.7) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.3...@ceramicnetwork/ceramic-doctype-tile@0.5.6) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.3...@ceramicnetwork/ceramic-doctype-tile@0.5.5) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.3...@ceramicnetwork/ceramic-doctype-tile@0.5.4) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.2...@ceramicnetwork/ceramic-doctype-tile@0.5.3) (2020-08-31)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.5.2-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.5.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.5.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@5.0.2...@ceramicnetwork/ceramic-doctype-tile@0.5.2-alpha.0) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [5.0.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@5.0.1...@ceramicnetwork/ceramic-doctype-tile@5.0.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [5.0.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.4.0...@ceramicnetwork/ceramic-doctype-tile@5.0.1) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





# [0.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.8...@ceramicnetwork/ceramic-doctype-tile@0.4.0) (2020-08-28)


### Bug Fixes

* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.8...@ceramicnetwork/ceramic-doctype-tile@0.3.0) (2020-08-28)


### Bug Fixes

* use forked did-resolver ([033ab2a](https://github.com/ceramicnetwork/js-ceramic/commit/033ab2a65ef59159f375864610fa9d5ad9f1e7ea))


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





## [0.2.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.7...@ceramicnetwork/ceramic-doctype-tile@0.2.8) (2020-08-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.6...@ceramicnetwork/ceramic-doctype-tile@0.2.7) (2020-07-21)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.5...@ceramicnetwork/ceramic-doctype-tile@0.2.6) (2020-07-21)


### Bug Fixes

* fix conflicts with master ([1077bdb](https://github.com/ceramicnetwork/js-ceramic/commit/1077bdb81ce10bfeafa5a53922eb93dfcf4b23f6))


### Features

* document versioning ([#176](https://github.com/ceramicnetwork/js-ceramic/issues/176)) ([5c138f0](https://github.com/ceramicnetwork/js-ceramic/commit/5c138f0ecd3433ef364b9a266607263ee97526d1))





## [0.2.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.5-alpha.0...@ceramicnetwork/ceramic-doctype-tile@0.2.5) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.4...@ceramicnetwork/ceramic-doctype-tile@0.2.5-alpha.0) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.3...@ceramicnetwork/ceramic-doctype-tile@0.2.4) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.2...@ceramicnetwork/ceramic-doctype-tile@0.2.3) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile





## [0.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-doctype-tile@0.2.1...@ceramicnetwork/ceramic-doctype-tile@0.2.2) (2020-07-13)


### Bug Fixes

* **account-template:** fix import ([3a660d7](https://github.com/ceramicnetwork/js-ceramic/commit/3a660d72f654d7614f207587b5086888c9da6273))





## 0.2.1 (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-doctype-tile
