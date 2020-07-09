# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-core@0.2.0...@ceramicnetwork/ceramic-core@0.3.0-alpha.0) (2020-07-09)


### Bug Fixes

* **core:** add prev verification for anchor record ([#68](https://github.com/ceramicnetwork/js-ceramic/issues/68)) ([95430a4](https://github.com/ceramicnetwork/js-ceramic/commit/95430a4712f1017f21b95e4d26c32c24deaf3534))
* **core:** emit processing state ([#64](https://github.com/ceramicnetwork/js-ceramic/issues/64)) ([d63fe3b](https://github.com/ceramicnetwork/js-ceramic/commit/d63fe3b9ab70386aa760bac9415caada909ae578))
* **core:** fix failing tests ([5008d60](https://github.com/ceramicnetwork/js-ceramic/commit/5008d6033ec23473090d1790755f096ff1a6a5e9))
* add node-fetch types to ceramic core ([0eb48b1](https://github.com/ceramicnetwork/js-ceramic/commit/0eb48b19c9387dc26dc9d04ac446142afedf1947))


### Features

* **core:** add local pinning ([#95](https://github.com/ceramicnetwork/js-ceramic/issues/95)) ([d1576b5](https://github.com/ceramicnetwork/js-ceramic/commit/d1576b5a853b99fafc28aa8a42b32df6ab1a53ab))
* allow legacy did docs to be used as genesis records ([#88](https://github.com/ceramicnetwork/js-ceramic/issues/88)) ([3012b55](https://github.com/ceramicnetwork/js-ceramic/commit/3012b559d6255685272b0af59730a802c6ab3326))
* **core:** add id property to signed records ([8f2f81a](https://github.com/ceramicnetwork/js-ceramic/commit/8f2f81ae16018730ac93a8a74f85300ad424b90d))
* **core:** implement anchor service module ([#23](https://github.com/ceramicnetwork/js-ceramic/issues/23)) ([2a7d9bf](https://github.com/ceramicnetwork/js-ceramic/commit/2a7d9bf37f8d92e48cdf6751e706d4f6af77fdbc))


### Reverts

* Revert "chore(deps): bump 3id-blockchain-utils from 0.3.3 to 0.4.0 (#122)" ([625c08b](https://github.com/ceramicnetwork/js-ceramic/commit/625c08b62a04ed76638956c879dce4b3425fc04a)), closes [#122](https://github.com/ceramicnetwork/js-ceramic/issues/122)
* Revert "chore(deps): bump cids from 0.8.0 to 0.8.1 (#121)" ([0385bf5](https://github.com/ceramicnetwork/js-ceramic/commit/0385bf56000b81336ecf19dc2f8578d8ac44b04e)), closes [#121](https://github.com/ceramicnetwork/js-ceramic/issues/121)





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
