# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.10.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.2-rc.0...@ceramicnetwork/cli@1.10.0-rc.0) (2021-12-08)


### Features

* add client side timeout to http-requests ([a33356c](https://github.com/ceramicnetwork/js-ceramic/commit/a33356c8a518252af9d81d1136411725c429cc3b))





## [1.9.2-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.1...@ceramicnetwork/cli@1.9.2-rc.0) (2021-12-06)


### Bug Fixes

* **cli,http-client:** Properly serialize timeout for multiquery requests through the http client ([#1899](https://github.com/ceramicnetwork/js-ceramic/issues/1899)) ([cb968a5](https://github.com/ceramicnetwork/js-ceramic/commit/cb968a53b9cbad825c8c01828fac52eb52752323))





## [1.9.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.1-rc.10...@ceramicnetwork/cli@1.9.1) (2021-12-06)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.1-rc.9...@ceramicnetwork/cli@1.9.1-rc.10) (2021-12-06)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.9](/compare/@ceramicnetwork/cli@1.9.1-rc.8...@ceramicnetwork/cli@1.9.1-rc.9) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.8](/compare/@ceramicnetwork/cli@1.9.1-rc.6...@ceramicnetwork/cli@1.9.1-rc.8) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.6](/compare/@ceramicnetwork/cli@1.9.1-rc.4...@ceramicnetwork/cli@1.9.1-rc.6) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.4](/compare/@ceramicnetwork/cli@1.9.1-rc.2...@ceramicnetwork/cli@1.9.1-rc.4) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.2](/compare/@ceramicnetwork/cli@1.9.1-rc.1...@ceramicnetwork/cli@1.9.1-rc.2) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.1-rc.0...@ceramicnetwork/cli@1.9.1-rc.1) (2021-12-01)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.9.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.0...@ceramicnetwork/cli@1.9.1-rc.0) (2021-11-17)


### Bug Fixes

* resolve merge conflicts during merge from `main` ([#1848](https://github.com/ceramicnetwork/js-ceramic/issues/1848)) ([6772fc6](https://github.com/ceramicnetwork/js-ceramic/commit/6772fc6c61bc9daadfd3f6d6ecf3de2bb100450d))





# [1.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.9.0-rc.0...@ceramicnetwork/cli@1.9.0) (2021-11-17)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.9.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.8.1...@ceramicnetwork/cli@1.9.0-rc.0) (2021-11-12)


### Bug Fixes

* **cli:** Allow CommitID for show and state commands ([#1135](https://github.com/ceramicnetwork/js-ceramic/issues/1135)) ([b897b1e](https://github.com/ceramicnetwork/js-ceramic/commit/b897b1ede78480d2e45f248d2e98ce2c97b01e51))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** Allow specifying ethereumRpcUrl without anchorServiceUrl ([#1124](https://github.com/ceramicnetwork/js-ceramic/issues/1124)) ([ee59e1b](https://github.com/ceramicnetwork/js-ceramic/commit/ee59e1b69328dfe2dbea628edebc96a1c3e83143))
* **cli:** controllers should not default to empty array on update ([#803](https://github.com/ceramicnetwork/js-ceramic/issues/803)) ([d9bb420](https://github.com/ceramicnetwork/js-ceramic/commit/d9bb420c0fe4033a721e7fbd84d3d57a16dfd56b))
* **cli:** Disable DHT ([#806](https://github.com/ceramicnetwork/js-ceramic/issues/806)) ([6d6e432](https://github.com/ceramicnetwork/js-ceramic/commit/6d6e432ba4a0874b9265c8dc0bb23c7f2ac1a7cb))
* **cli:** Fix caeramic daemon test to use proper arg name for pinsetDirectory ([#836](https://github.com/ceramicnetwork/js-ceramic/issues/836)) ([c33dd2a](https://github.com/ceramicnetwork/js-ceramic/commit/c33dd2aaf1c7584fb38d589a5b5e3abfbe544d80))
* **cli:** Fix cli update function ([#1238](https://github.com/ceramicnetwork/js-ceramic/issues/1238)) ([b033038](https://github.com/ceramicnetwork/js-ceramic/commit/b0330388f699175134d53bc6f855ed0b2f203f3d))
* **cli:** fix conflicts ([99e297a](https://github.com/ceramicnetwork/js-ceramic/commit/99e297a3c8b7ddfb5e52881c19e8f20c833385b9))
* **cli:** Fix pinningEndpoint cli arg ([#840](https://github.com/ceramicnetwork/js-ceramic/issues/840)) ([2951d65](https://github.com/ceramicnetwork/js-ceramic/commit/2951d6592e4c945c21de842c69a16fee5367bb68))
* **cli:** Handle undefined docOpts in legacy http endpoints ([#1353](https://github.com/ceramicnetwork/js-ceramic/issues/1353)) ([a473ce5](https://github.com/ceramicnetwork/js-ceramic/commit/a473ce50fb3fb991502597dc3e09d456dad01735))
* **cli:** Make syncOverride option to CeramicDaemon optional ([#1554](https://github.com/ceramicnetwork/js-ceramic/issues/1554)) ([967b17d](https://github.com/ceramicnetwork/js-ceramic/commit/967b17d3bf631b51fa8376b2d4075044a95f13f3))
* **cli:** Properly connect to bootstrap nodes. ([#805](https://github.com/ceramicnetwork/js-ceramic/issues/805)) ([c0b8da0](https://github.com/ceramicnetwork/js-ceramic/commit/c0b8da0da730024dc13bc2f01e48eae0130501c6))
* **cli:** rename healthcheck endpoint ([#673](https://github.com/ceramicnetwork/js-ceramic/issues/673)) ([bdfe1d5](https://github.com/ceramicnetwork/js-ceramic/commit/bdfe1d566184d213fb1ccdffd59389ae7752aedf))
* **cli:** Set default anchor service URL when on dev-unstable network ([#724](https://github.com/ceramicnetwork/js-ceramic/issues/724)) ([c5091cb](https://github.com/ceramicnetwork/js-ceramic/commit/c5091cb88084b1b118afa4b50eb82627b7d0d3fb))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **cli:** set a DID with resolvers in daemon ([#1200](https://github.com/ceramicnetwork/js-ceramic/issues/1200)) ([f3c9c2d](https://github.com/ceramicnetwork/js-ceramic/commit/f3c9c2d6c4dc24704df329e5ed7e58a99cdac261))
* **cli:** update bootstrap peer list ([#834](https://github.com/ceramicnetwork/js-ceramic/issues/834)) ([ca2e108](https://github.com/ceramicnetwork/js-ceramic/commit/ca2e108d5fdc886707a76291860e5d479c37a30d))
* **cli,http-client:** Fix pin API in CLI and http client ([#752](https://github.com/ceramicnetwork/js-ceramic/issues/752)) ([20fcd75](https://github.com/ceramicnetwork/js-ceramic/commit/20fcd7598e589c088bcc778bafd1304efa64edb7))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Connect to bootstrap nodes even when using external ipfs ([#848](https://github.com/ceramicnetwork/js-ceramic/issues/848)) ([1169bc8](https://github.com/ceramicnetwork/js-ceramic/commit/1169bc84a90e59959d2123287c8b56fb46f02d97))
* disable randomWalk ([ed6fb39](https://github.com/ceramicnetwork/js-ceramic/commit/ed6fb39da06ecc5cb5a001ba388b1352f68bf457))
* log api errors with status and message ([#750](https://github.com/ceramicnetwork/js-ceramic/issues/750)) ([6c6445c](https://github.com/ceramicnetwork/js-ceramic/commit/6c6445ccc8018e965078657a5b7e4995ce73679e))
* send http error response as json ([#790](https://github.com/ceramicnetwork/js-ceramic/issues/790)) ([02e1dfc](https://github.com/ceramicnetwork/js-ceramic/commit/02e1dfcbe00a8508a6a2c5035b23156abbe723b8)), closes [#789](https://github.com/ceramicnetwork/js-ceramic/issues/789)
* surface express errors properly ([#706](https://github.com/ceramicnetwork/js-ceramic/issues/706)) ([b4d46d1](https://github.com/ceramicnetwork/js-ceramic/commit/b4d46d17053f7cdbc0618c391419fb83013e48f4))
* update dev peer ids ([#847](https://github.com/ceramicnetwork/js-ceramic/issues/847)) ([78b5817](https://github.com/ceramicnetwork/js-ceramic/commit/78b581792ebc74670c0ca566e2d4aa874111a8af))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))


### Features

* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* configure nft-did-resolver via config file ([#1656](https://github.com/ceramicnetwork/js-ceramic/issues/1656)) ([78baf4d](https://github.com/ceramicnetwork/js-ceramic/commit/78baf4d93bd3aad114ea7e392b186d1eb98a57e3))
* Include safe-did resolver ([#1756](https://github.com/ceramicnetwork/js-ceramic/issues/1756)) ([033b4c9](https://github.com/ceramicnetwork/js-ceramic/commit/033b4c91e5bc9617a26aed0792b40fcae61633fc))
* pkh-did-resolver ([#1624](https://github.com/ceramicnetwork/js-ceramic/issues/1624)) ([489719b](https://github.com/ceramicnetwork/js-ceramic/commit/489719b6dbd4e87d6f1d87c0d1b6967519ba46b1))
* Use latest nft and safe resolvers ([#1760](https://github.com/ceramicnetwork/js-ceramic/issues/1760)) ([d91aca4](https://github.com/ceramicnetwork/js-ceramic/commit/d91aca4c541a893f59e310013bb954fd0e0431a6))
* **cli:** Add daemon config file ([#1629](https://github.com/ceramicnetwork/js-ceramic/issues/1629)) ([642f071](https://github.com/ceramicnetwork/js-ceramic/commit/642f0711c271b8865939ca0c54e6f9d42dd23a71))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** allow daemon hostname to be configured ([#1329](https://github.com/ceramicnetwork/js-ceramic/issues/1329)) ([feba266](https://github.com/ceramicnetwork/js-ceramic/commit/feba266c67cc74092eacda7cab516ad8e650aeef))
* **cli:** ethr-did-resolver support for mainnet ([#1561](https://github.com/ceramicnetwork/js-ceramic/issues/1561)) ([7e53190](https://github.com/ceramicnetwork/js-ceramic/commit/7e531906eaae59997eee2da8899d1db1a924c72a))
* **cli:** Remove non-functional flags from CLI ([ccd8b45](https://github.com/ceramicnetwork/js-ceramic/commit/ccd8b45b6ec1846f3a0b71f0d4dd94dbf18fa166))
* **cli:** use 0 address for default hostname ([#1330](https://github.com/ceramicnetwork/js-ceramic/issues/1330)) ([50ea615](https://github.com/ceramicnetwork/js-ceramic/commit/50ea6151a06985c99035c2575c6df55cdcc95b30))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* Rely on default nft-did-resolver subgraphs ([#1635](https://github.com/ceramicnetwork/js-ceramic/issues/1635)) ([949aba1](https://github.com/ceramicnetwork/js-ceramic/commit/949aba19e5fbc57ef9939ccfdffd71a0df3489f9))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* Include nft-did-resolver ([#1620](https://github.com/ceramicnetwork/js-ceramic/issues/1620)) ([0615c62](https://github.com/ceramicnetwork/js-ceramic/commit/0615c62f2b38d11e0b67bd958b4c6ac5729fbb18))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Expose CeramicDaemon from cli package ([#1357](https://github.com/ceramicnetwork/js-ceramic/issues/1357)) ([28d0e65](https://github.com/ceramicnetwork/js-ceramic/commit/28d0e6591b0979c74d181225256656f40c2497ab))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** Use bootstrap nodes ([#801](https://github.com/ceramicnetwork/js-ceramic/issues/801)) ([0d24dfd](https://github.com/ceramicnetwork/js-ceramic/commit/0d24dfd7ba5116e80ba56a6bf2f308d0f424ed36))
* **cli,http-client:** Update HTTP API to use streams terminology ([#1237](https://github.com/ceramicnetwork/js-ceramic/issues/1237)) ([6c0a142](https://github.com/ceramicnetwork/js-ceramic/commit/6c0a1421623d5e0dd0ab5bc83413fcad75b14d66))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update default CAS URL to point to clay infra ([#669](https://github.com/ceramicnetwork/js-ceramic/issues/669)) ([85b6bcb](https://github.com/ceramicnetwork/js-ceramic/commit/85b6bcbc9852f116729496baf4b331e8152ca198))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument ([#1225](https://github.com/ceramicnetwork/js-ceramic/issues/1225)) ([ce0694b](https://github.com/ceramicnetwork/js-ceramic/commit/ce0694b8405f29a6c54a2d214599d210e6f1e4de))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* get origin in logs ([#1078](https://github.com/ceramicnetwork/js-ceramic/issues/1078)) ([560bf15](https://github.com/ceramicnetwork/js-ceramic/commit/560bf159b72b39cbc1e2791097d424fc75a0b0c0))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))


### Reverts

* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





## [1.8.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.8.1-rc.0...@ceramicnetwork/cli@1.8.1) (2021-11-12)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.8.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.8.0...@ceramicnetwork/cli@1.8.1-rc.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.8.0-rc.1...@ceramicnetwork/cli@1.8.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.8.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.8.0-rc.0...@ceramicnetwork/cli@1.8.0-rc.1) (2021-10-28)


### Bug Fixes

* **cli:** Allow CommitID for show and state commands ([#1135](https://github.com/ceramicnetwork/js-ceramic/issues/1135)) ([b897b1e](https://github.com/ceramicnetwork/js-ceramic/commit/b897b1ede78480d2e45f248d2e98ce2c97b01e51))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** Allow specifying ethereumRpcUrl without anchorServiceUrl ([#1124](https://github.com/ceramicnetwork/js-ceramic/issues/1124)) ([ee59e1b](https://github.com/ceramicnetwork/js-ceramic/commit/ee59e1b69328dfe2dbea628edebc96a1c3e83143))
* **cli:** controllers should not default to empty array on update ([#803](https://github.com/ceramicnetwork/js-ceramic/issues/803)) ([d9bb420](https://github.com/ceramicnetwork/js-ceramic/commit/d9bb420c0fe4033a721e7fbd84d3d57a16dfd56b))
* **cli:** Disable DHT ([#806](https://github.com/ceramicnetwork/js-ceramic/issues/806)) ([6d6e432](https://github.com/ceramicnetwork/js-ceramic/commit/6d6e432ba4a0874b9265c8dc0bb23c7f2ac1a7cb))
* **cli:** Fix caeramic daemon test to use proper arg name for pinsetDirectory ([#836](https://github.com/ceramicnetwork/js-ceramic/issues/836)) ([c33dd2a](https://github.com/ceramicnetwork/js-ceramic/commit/c33dd2aaf1c7584fb38d589a5b5e3abfbe544d80))
* **cli:** Fix cli update function ([#1238](https://github.com/ceramicnetwork/js-ceramic/issues/1238)) ([b033038](https://github.com/ceramicnetwork/js-ceramic/commit/b0330388f699175134d53bc6f855ed0b2f203f3d))
* **cli:** fix conflicts ([99e297a](https://github.com/ceramicnetwork/js-ceramic/commit/99e297a3c8b7ddfb5e52881c19e8f20c833385b9))
* **cli:** Fix pinningEndpoint cli arg ([#840](https://github.com/ceramicnetwork/js-ceramic/issues/840)) ([2951d65](https://github.com/ceramicnetwork/js-ceramic/commit/2951d6592e4c945c21de842c69a16fee5367bb68))
* **cli:** Handle undefined docOpts in legacy http endpoints ([#1353](https://github.com/ceramicnetwork/js-ceramic/issues/1353)) ([a473ce5](https://github.com/ceramicnetwork/js-ceramic/commit/a473ce50fb3fb991502597dc3e09d456dad01735))
* **cli:** Make syncOverride option to CeramicDaemon optional ([#1554](https://github.com/ceramicnetwork/js-ceramic/issues/1554)) ([967b17d](https://github.com/ceramicnetwork/js-ceramic/commit/967b17d3bf631b51fa8376b2d4075044a95f13f3))
* **cli:** Properly connect to bootstrap nodes. ([#805](https://github.com/ceramicnetwork/js-ceramic/issues/805)) ([c0b8da0](https://github.com/ceramicnetwork/js-ceramic/commit/c0b8da0da730024dc13bc2f01e48eae0130501c6))
* **cli:** rename healthcheck endpoint ([#673](https://github.com/ceramicnetwork/js-ceramic/issues/673)) ([bdfe1d5](https://github.com/ceramicnetwork/js-ceramic/commit/bdfe1d566184d213fb1ccdffd59389ae7752aedf))
* **cli:** Set default anchor service URL when on dev-unstable network ([#724](https://github.com/ceramicnetwork/js-ceramic/issues/724)) ([c5091cb](https://github.com/ceramicnetwork/js-ceramic/commit/c5091cb88084b1b118afa4b50eb82627b7d0d3fb))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **cli:** set a DID with resolvers in daemon ([#1200](https://github.com/ceramicnetwork/js-ceramic/issues/1200)) ([f3c9c2d](https://github.com/ceramicnetwork/js-ceramic/commit/f3c9c2d6c4dc24704df329e5ed7e58a99cdac261))
* **cli:** update bootstrap peer list ([#834](https://github.com/ceramicnetwork/js-ceramic/issues/834)) ([ca2e108](https://github.com/ceramicnetwork/js-ceramic/commit/ca2e108d5fdc886707a76291860e5d479c37a30d))
* **cli,http-client:** Fix pin API in CLI and http client ([#752](https://github.com/ceramicnetwork/js-ceramic/issues/752)) ([20fcd75](https://github.com/ceramicnetwork/js-ceramic/commit/20fcd7598e589c088bcc778bafd1304efa64edb7))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Connect to bootstrap nodes even when using external ipfs ([#848](https://github.com/ceramicnetwork/js-ceramic/issues/848)) ([1169bc8](https://github.com/ceramicnetwork/js-ceramic/commit/1169bc84a90e59959d2123287c8b56fb46f02d97))
* disable randomWalk ([ed6fb39](https://github.com/ceramicnetwork/js-ceramic/commit/ed6fb39da06ecc5cb5a001ba388b1352f68bf457))
* log api errors with status and message ([#750](https://github.com/ceramicnetwork/js-ceramic/issues/750)) ([6c6445c](https://github.com/ceramicnetwork/js-ceramic/commit/6c6445ccc8018e965078657a5b7e4995ce73679e))
* send http error response as json ([#790](https://github.com/ceramicnetwork/js-ceramic/issues/790)) ([02e1dfc](https://github.com/ceramicnetwork/js-ceramic/commit/02e1dfcbe00a8508a6a2c5035b23156abbe723b8)), closes [#789](https://github.com/ceramicnetwork/js-ceramic/issues/789)
* surface express errors properly ([#706](https://github.com/ceramicnetwork/js-ceramic/issues/706)) ([b4d46d1](https://github.com/ceramicnetwork/js-ceramic/commit/b4d46d17053f7cdbc0618c391419fb83013e48f4))
* update dev peer ids ([#847](https://github.com/ceramicnetwork/js-ceramic/issues/847)) ([78b5817](https://github.com/ceramicnetwork/js-ceramic/commit/78b581792ebc74670c0ca566e2d4aa874111a8af))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))


### Features

* **core:** Do not restore pinned streams at startup ([#1775](https://github.com/ceramicnetwork/js-ceramic/issues/1775)) ([72f6432](https://github.com/ceramicnetwork/js-ceramic/commit/72f64329ee33af8ef2d0c095a4249ebb064158d4))
* configure nft-did-resolver via config file ([#1656](https://github.com/ceramicnetwork/js-ceramic/issues/1656)) ([78baf4d](https://github.com/ceramicnetwork/js-ceramic/commit/78baf4d93bd3aad114ea7e392b186d1eb98a57e3))
* Include nft-did-resolver ([#1620](https://github.com/ceramicnetwork/js-ceramic/issues/1620)) ([0615c62](https://github.com/ceramicnetwork/js-ceramic/commit/0615c62f2b38d11e0b67bd958b4c6ac5729fbb18))
* Include safe-did resolver ([#1756](https://github.com/ceramicnetwork/js-ceramic/issues/1756)) ([033b4c9](https://github.com/ceramicnetwork/js-ceramic/commit/033b4c91e5bc9617a26aed0792b40fcae61633fc))
* pkh-did-resolver ([#1624](https://github.com/ceramicnetwork/js-ceramic/issues/1624)) ([489719b](https://github.com/ceramicnetwork/js-ceramic/commit/489719b6dbd4e87d6f1d87c0d1b6967519ba46b1))
* Rely on default nft-did-resolver subgraphs ([#1635](https://github.com/ceramicnetwork/js-ceramic/issues/1635)) ([949aba1](https://github.com/ceramicnetwork/js-ceramic/commit/949aba19e5fbc57ef9939ccfdffd71a0df3489f9))
* Use latest nft and safe resolvers ([#1760](https://github.com/ceramicnetwork/js-ceramic/issues/1760)) ([d91aca4](https://github.com/ceramicnetwork/js-ceramic/commit/d91aca4c541a893f59e310013bb954fd0e0431a6))
* **cli:** Add daemon config file ([#1629](https://github.com/ceramicnetwork/js-ceramic/issues/1629)) ([642f071](https://github.com/ceramicnetwork/js-ceramic/commit/642f0711c271b8865939ca0c54e6f9d42dd23a71))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** allow daemon hostname to be configured ([#1329](https://github.com/ceramicnetwork/js-ceramic/issues/1329)) ([feba266](https://github.com/ceramicnetwork/js-ceramic/commit/feba266c67cc74092eacda7cab516ad8e650aeef))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** ethr-did-resolver support for mainnet ([#1561](https://github.com/ceramicnetwork/js-ceramic/issues/1561)) ([7e53190](https://github.com/ceramicnetwork/js-ceramic/commit/7e531906eaae59997eee2da8899d1db1a924c72a))
* **cli:** Remove non-functional flags from CLI ([ccd8b45](https://github.com/ceramicnetwork/js-ceramic/commit/ccd8b45b6ec1846f3a0b71f0d4dd94dbf18fa166))
* **cli:** use 0 address for default hostname ([#1330](https://github.com/ceramicnetwork/js-ceramic/issues/1330)) ([50ea615](https://github.com/ceramicnetwork/js-ceramic/commit/50ea6151a06985c99035c2575c6df55cdcc95b30))
* **cli:** Use bootstrap nodes ([#801](https://github.com/ceramicnetwork/js-ceramic/issues/801)) ([0d24dfd](https://github.com/ceramicnetwork/js-ceramic/commit/0d24dfd7ba5116e80ba56a6bf2f308d0f424ed36))
* **cli,http-client:** Update HTTP API to use streams terminology ([#1237](https://github.com/ceramicnetwork/js-ceramic/issues/1237)) ([6c0a142](https://github.com/ceramicnetwork/js-ceramic/commit/6c0a1421623d5e0dd0ab5bc83413fcad75b14d66))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Expose CeramicDaemon from cli package ([#1357](https://github.com/ceramicnetwork/js-ceramic/issues/1357)) ([28d0e65](https://github.com/ceramicnetwork/js-ceramic/commit/28d0e6591b0979c74d181225256656f40c2497ab))
* get origin in logs ([#1078](https://github.com/ceramicnetwork/js-ceramic/issues/1078)) ([560bf15](https://github.com/ceramicnetwork/js-ceramic/commit/560bf159b72b39cbc1e2791097d424fc75a0b0c0))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update default CAS URL to point to clay infra ([#669](https://github.com/ceramicnetwork/js-ceramic/issues/669)) ([85b6bcb](https://github.com/ceramicnetwork/js-ceramic/commit/85b6bcbc9852f116729496baf4b331e8152ca198))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument ([#1225](https://github.com/ceramicnetwork/js-ceramic/issues/1225)) ([ce0694b](https://github.com/ceramicnetwork/js-ceramic/commit/ce0694b8405f29a6c54a2d214599d210e6f1e4de))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))


### Reverts

* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.8.0-rc.0](/compare/@ceramicnetwork/cli@1.6.1...@ceramicnetwork/cli@1.8.0-rc.0) (2021-10-25)


### Features

* pkh-did-resolver (#1624) 489719b, closes #1624





## [1.6.1](/compare/@ceramicnetwork/cli@1.6.0...@ceramicnetwork/cli@1.6.1) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/cli






# [1.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.6.0-rc.0...@ceramicnetwork/cli@1.6.0) (2021-10-20)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.6.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.5.0...@ceramicnetwork/cli@1.6.0-rc.0) (2021-10-14)


### Bug Fixes

* **cli:** Allow CommitID for show and state commands ([#1135](https://github.com/ceramicnetwork/js-ceramic/issues/1135)) ([b897b1e](https://github.com/ceramicnetwork/js-ceramic/commit/b897b1ede78480d2e45f248d2e98ce2c97b01e51))
* **cli:** Allow large requests to http API ([#1324](https://github.com/ceramicnetwork/js-ceramic/issues/1324)) ([714922d](https://github.com/ceramicnetwork/js-ceramic/commit/714922dfb9ea40097f71b71fa3f57d2895f775fa))
* **cli:** Allow specifying ethereumRpcUrl without anchorServiceUrl ([#1124](https://github.com/ceramicnetwork/js-ceramic/issues/1124)) ([ee59e1b](https://github.com/ceramicnetwork/js-ceramic/commit/ee59e1b69328dfe2dbea628edebc96a1c3e83143))
* **cli:** controllers should not default to empty array on update ([#803](https://github.com/ceramicnetwork/js-ceramic/issues/803)) ([d9bb420](https://github.com/ceramicnetwork/js-ceramic/commit/d9bb420c0fe4033a721e7fbd84d3d57a16dfd56b))
* **cli:** Disable DHT ([#806](https://github.com/ceramicnetwork/js-ceramic/issues/806)) ([6d6e432](https://github.com/ceramicnetwork/js-ceramic/commit/6d6e432ba4a0874b9265c8dc0bb23c7f2ac1a7cb))
* **cli:** Fix caeramic daemon test to use proper arg name for pinsetDirectory ([#836](https://github.com/ceramicnetwork/js-ceramic/issues/836)) ([c33dd2a](https://github.com/ceramicnetwork/js-ceramic/commit/c33dd2aaf1c7584fb38d589a5b5e3abfbe544d80))
* **cli:** Fix cli update function ([#1238](https://github.com/ceramicnetwork/js-ceramic/issues/1238)) ([b033038](https://github.com/ceramicnetwork/js-ceramic/commit/b0330388f699175134d53bc6f855ed0b2f203f3d))
* **cli:** fix conflicts ([99e297a](https://github.com/ceramicnetwork/js-ceramic/commit/99e297a3c8b7ddfb5e52881c19e8f20c833385b9))
* **cli:** Fix pinningEndpoint cli arg ([#840](https://github.com/ceramicnetwork/js-ceramic/issues/840)) ([2951d65](https://github.com/ceramicnetwork/js-ceramic/commit/2951d6592e4c945c21de842c69a16fee5367bb68))
* **cli:** Handle undefined docOpts in legacy http endpoints ([#1353](https://github.com/ceramicnetwork/js-ceramic/issues/1353)) ([a473ce5](https://github.com/ceramicnetwork/js-ceramic/commit/a473ce50fb3fb991502597dc3e09d456dad01735))
* **cli:** Make syncOverride option to CeramicDaemon optional ([#1554](https://github.com/ceramicnetwork/js-ceramic/issues/1554)) ([967b17d](https://github.com/ceramicnetwork/js-ceramic/commit/967b17d3bf631b51fa8376b2d4075044a95f13f3))
* **cli:** Properly connect to bootstrap nodes. ([#805](https://github.com/ceramicnetwork/js-ceramic/issues/805)) ([c0b8da0](https://github.com/ceramicnetwork/js-ceramic/commit/c0b8da0da730024dc13bc2f01e48eae0130501c6))
* **cli:** rename healthcheck endpoint ([#673](https://github.com/ceramicnetwork/js-ceramic/issues/673)) ([bdfe1d5](https://github.com/ceramicnetwork/js-ceramic/commit/bdfe1d566184d213fb1ccdffd59389ae7752aedf))
* **cli:** Set default anchor service URL when on dev-unstable network ([#724](https://github.com/ceramicnetwork/js-ceramic/issues/724)) ([c5091cb](https://github.com/ceramicnetwork/js-ceramic/commit/c5091cb88084b1b118afa4b50eb82627b7d0d3fb))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))
* **core:** ipfs subscribe, pin version ([#1454](https://github.com/ceramicnetwork/js-ceramic/issues/1454)) ([fc9c5e7](https://github.com/ceramicnetwork/js-ceramic/commit/fc9c5e77ef84be448744b92fb35d5e3bf06f264d))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **cli:** set a DID with resolvers in daemon ([#1200](https://github.com/ceramicnetwork/js-ceramic/issues/1200)) ([f3c9c2d](https://github.com/ceramicnetwork/js-ceramic/commit/f3c9c2d6c4dc24704df329e5ed7e58a99cdac261))
* **cli:** update bootstrap peer list ([#834](https://github.com/ceramicnetwork/js-ceramic/issues/834)) ([ca2e108](https://github.com/ceramicnetwork/js-ceramic/commit/ca2e108d5fdc886707a76291860e5d479c37a30d))
* **cli,http-client:** Fix pin API in CLI and http client ([#752](https://github.com/ceramicnetwork/js-ceramic/issues/752)) ([20fcd75](https://github.com/ceramicnetwork/js-ceramic/commit/20fcd7598e589c088bcc778bafd1304efa64edb7))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core:** Add ipfs timeout everywhere we get from the dag ([#886](https://github.com/ceramicnetwork/js-ceramic/issues/886)) ([e6d5e1b](https://github.com/ceramicnetwork/js-ceramic/commit/e6d5e1b20b82c9a59b67ce0f7cec3800fa71d3a9))
* **core:** Connect to bootstrap nodes even when using external ipfs ([#848](https://github.com/ceramicnetwork/js-ceramic/issues/848)) ([1169bc8](https://github.com/ceramicnetwork/js-ceramic/commit/1169bc84a90e59959d2123287c8b56fb46f02d97))
* disable randomWalk ([ed6fb39](https://github.com/ceramicnetwork/js-ceramic/commit/ed6fb39da06ecc5cb5a001ba388b1352f68bf457))
* log api errors with status and message ([#750](https://github.com/ceramicnetwork/js-ceramic/issues/750)) ([6c6445c](https://github.com/ceramicnetwork/js-ceramic/commit/6c6445ccc8018e965078657a5b7e4995ce73679e))
* send http error response as json ([#790](https://github.com/ceramicnetwork/js-ceramic/issues/790)) ([02e1dfc](https://github.com/ceramicnetwork/js-ceramic/commit/02e1dfcbe00a8508a6a2c5035b23156abbe723b8)), closes [#789](https://github.com/ceramicnetwork/js-ceramic/issues/789)
* surface express errors properly ([#706](https://github.com/ceramicnetwork/js-ceramic/issues/706)) ([b4d46d1](https://github.com/ceramicnetwork/js-ceramic/commit/b4d46d17053f7cdbc0618c391419fb83013e48f4))
* update dev peer ids ([#847](https://github.com/ceramicnetwork/js-ceramic/issues/847)) ([78b5817](https://github.com/ceramicnetwork/js-ceramic/commit/78b581792ebc74670c0ca566e2d4aa874111a8af))
* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))


### Features

* Include safe-did resolver ([#1756](https://github.com/ceramicnetwork/js-ceramic/issues/1756)) ([033b4c9](https://github.com/ceramicnetwork/js-ceramic/commit/033b4c91e5bc9617a26aed0792b40fcae61633fc))
* Use latest nft and safe resolvers ([#1760](https://github.com/ceramicnetwork/js-ceramic/issues/1760)) ([d91aca4](https://github.com/ceramicnetwork/js-ceramic/commit/d91aca4c541a893f59e310013bb954fd0e0431a6))
* **cli:** Add daemon config file ([#1629](https://github.com/ceramicnetwork/js-ceramic/issues/1629)) ([642f071](https://github.com/ceramicnetwork/js-ceramic/commit/642f0711c271b8865939ca0c54e6f9d42dd23a71))
* **cli:** add global sync override option ([#1541](https://github.com/ceramicnetwork/js-ceramic/issues/1541)) ([4806e92](https://github.com/ceramicnetwork/js-ceramic/commit/4806e9202d00cefc44f6ac275692170c74363a17))
* **cli:** Add hierarchy to daemon config ([#1633](https://github.com/ceramicnetwork/js-ceramic/issues/1633)) ([138b49d](https://github.com/ceramicnetwork/js-ceramic/commit/138b49dddd8bb0a4df383b731df8641a0451b1d9))
* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **cli:** allow daemon hostname to be configured ([#1329](https://github.com/ceramicnetwork/js-ceramic/issues/1329)) ([feba266](https://github.com/ceramicnetwork/js-ceramic/commit/feba266c67cc74092eacda7cab516ad8e650aeef))
* **cli:** Allow specifying pub/sub topic for 'local' ceramic network ([#781](https://github.com/ceramicnetwork/js-ceramic/issues/781)) ([f3650b4](https://github.com/ceramicnetwork/js-ceramic/commit/f3650b4a3596d1d851d1e99b8b904360e98204cb))
* **cli:** ethr-did-resolver support for mainnet ([#1561](https://github.com/ceramicnetwork/js-ceramic/issues/1561)) ([7e53190](https://github.com/ceramicnetwork/js-ceramic/commit/7e531906eaae59997eee2da8899d1db1a924c72a))
* **cli:** Remove non-functional flags from CLI ([ccd8b45](https://github.com/ceramicnetwork/js-ceramic/commit/ccd8b45b6ec1846f3a0b71f0d4dd94dbf18fa166))
* **cli:** use 0 address for default hostname ([#1330](https://github.com/ceramicnetwork/js-ceramic/issues/1330)) ([50ea615](https://github.com/ceramicnetwork/js-ceramic/commit/50ea6151a06985c99035c2575c6df55cdcc95b30))
* **cli:** Use bootstrap nodes ([#801](https://github.com/ceramicnetwork/js-ceramic/issues/801)) ([0d24dfd](https://github.com/ceramicnetwork/js-ceramic/commit/0d24dfd7ba5116e80ba56a6bf2f308d0f424ed36))
* **cli,http-client:** Update HTTP API to use streams terminology ([#1237](https://github.com/ceramicnetwork/js-ceramic/issues/1237)) ([6c0a142](https://github.com/ceramicnetwork/js-ceramic/commit/6c0a1421623d5e0dd0ab5bc83413fcad75b14d66))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))
* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Invalid commits don't prevent loading a stream ([#1597](https://github.com/ceramicnetwork/js-ceramic/issues/1597)) ([fb1dea1](https://github.com/ceramicnetwork/js-ceramic/commit/fb1dea15fb2587839dcca69bad829276fa790268))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Meat of State Refactor: final concurrency model ([#1130](https://github.com/ceramicnetwork/js-ceramic/issues/1130)) ([345d3d1](https://github.com/ceramicnetwork/js-ceramic/commit/345d3d1e16d4fe8f83e53a9c0d78228408f2b03c)), closes [#1141](https://github.com/ceramicnetwork/js-ceramic/issues/1141)
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))
* **core:** Update default CAS URL to point to clay infra ([#669](https://github.com/ceramicnetwork/js-ceramic/issues/669)) ([85b6bcb](https://github.com/ceramicnetwork/js-ceramic/commit/85b6bcbc9852f116729496baf4b331e8152ca198))
* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway ([#1513](https://github.com/ceramicnetwork/js-ceramic/issues/1513)) ([be397c8](https://github.com/ceramicnetwork/js-ceramic/commit/be397c84baff24c35230a5d03dbfa99eb4dbc161))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS ([#1490](https://github.com/ceramicnetwork/js-ceramic/issues/1490)) ([9dfc167](https://github.com/ceramicnetwork/js-ceramic/commit/9dfc167b4be82db79a99e3f34ddefeff49516721))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* configure nft-did-resolver via config file ([#1656](https://github.com/ceramicnetwork/js-ceramic/issues/1656)) ([78baf4d](https://github.com/ceramicnetwork/js-ceramic/commit/78baf4d93bd3aad114ea7e392b186d1eb98a57e3))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Expose CeramicDaemon from cli package ([#1357](https://github.com/ceramicnetwork/js-ceramic/issues/1357)) ([28d0e65](https://github.com/ceramicnetwork/js-ceramic/commit/28d0e6591b0979c74d181225256656f40c2497ab))
* Include nft-did-resolver ([#1620](https://github.com/ceramicnetwork/js-ceramic/issues/1620)) ([0615c62](https://github.com/ceramicnetwork/js-ceramic/commit/0615c62f2b38d11e0b67bd958b4c6ac5729fbb18))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Rely on default nft-did-resolver subgraphs ([#1635](https://github.com/ceramicnetwork/js-ceramic/issues/1635)) ([949aba1](https://github.com/ceramicnetwork/js-ceramic/commit/949aba19e5fbc57ef9939ccfdffd71a0df3489f9))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **daemon:** add raw_data endpoint ([#1395](https://github.com/ceramicnetwork/js-ceramic/issues/1395)) ([41b6109](https://github.com/ceramicnetwork/js-ceramic/commit/41b61091efc3c05ef7894ebb423fa5508cfcd689)), closes [ceramicnetwork#1394](https://github.com/ceramicnetwork/issues/1394)
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link ([#1216](https://github.com/ceramicnetwork/js-ceramic/issues/1216)) ([f594ff0](https://github.com/ceramicnetwork/js-ceramic/commit/f594ff081048f0966c4dc8a57a3952e4235639f8))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument ([#1225](https://github.com/ceramicnetwork/js-ceramic/issues/1225)) ([ce0694b](https://github.com/ceramicnetwork/js-ceramic/commit/ce0694b8405f29a6c54a2d214599d210e6f1e4de))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* add networks enum and elp ([#1187](https://github.com/ceramicnetwork/js-ceramic/issues/1187)) ([7a60b30](https://github.com/ceramicnetwork/js-ceramic/commit/7a60b309067f428d904b0eb3723069fc90a05a4d))
* get origin in logs ([#1078](https://github.com/ceramicnetwork/js-ceramic/issues/1078)) ([560bf15](https://github.com/ceramicnetwork/js-ceramic/commit/560bf159b72b39cbc1e2791097d424fc75a0b0c0))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))


### Reverts

* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.5.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.5.0-rc.0...@ceramicnetwork/cli@1.5.0) (2021-10-14)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.5.0-rc.0](/compare/@ceramicnetwork/cli@1.4.1-rc.2...@ceramicnetwork/cli@1.5.0-rc.0) (2021-10-07)


### Features

* Include safe-did resolver (#1756) 033b4c9, closes #1756





## [1.4.1-rc.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.4.1-rc.1...@ceramicnetwork/cli@1.4.1-rc.2) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.4.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.4.1-rc.0...@ceramicnetwork/cli@1.4.1-rc.1) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.4.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.4.0...@ceramicnetwork/cli@1.4.1-rc.0) (2021-09-17)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.4.0](/compare/@ceramicnetwork/cli@1.4.0-rc.4...@ceramicnetwork/cli@1.4.0) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.4.0-rc.4](/compare/@ceramicnetwork/cli@1.3.2...@ceramicnetwork/cli@1.4.0-rc.4) (2021-09-16)


### Features

* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





# [1.4.0-rc.2](/compare/@ceramicnetwork/cli@1.3.2...@ceramicnetwork/cli@1.4.0-rc.2) (2021-09-16)


### Features

* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





## [1.3.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.1...@ceramicnetwork/cli@1.3.2) (2021-09-14)

**Note:** Version bump only for package @ceramicnetwork/cli



## [1.3.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.1-rc.1...@ceramicnetwork/cli@1.3.1) (2021-09-08)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.3.1-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.1-rc.0...@ceramicnetwork/cli@1.3.1-rc.1) (2021-09-06)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.3.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0...@ceramicnetwork/cli@1.3.1-rc.0) (2021-09-02)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0-rc.7...@ceramicnetwork/cli@1.3.0) (2021-08-25)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.3.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0-rc.6...@ceramicnetwork/cli@1.3.0-rc.7) (2021-08-24)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.3.0-rc.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0-rc.5...@ceramicnetwork/cli@1.3.0-rc.6) (2021-08-23)

**Note:** Version bump only for package @ceramicnetwork/cli





# 1.3.0-rc.5 (2021-08-23)


### Bug Fixes

* **ci:** remove private flag ([9974009](https://github.com/ceramicnetwork/js-ceramic/commit/9974009be69382f2a2caf59f4ff72bf6aa12491b))





# [1.3.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0-rc.3...@ceramicnetwork/cli@1.3.0-rc.4) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.3.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@1.3.0-rc.2...@ceramicnetwork/cli@1.3.0-rc.3) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/cli





# 1.3.0-rc.2 (2021-08-22)


### Bug Fixes

* **ci:** remove flag from npm ci cmd ([b8ca310](https://github.com/ceramicnetwork/js-ceramic/commit/b8ca3102963096626a46a3c78c705da26e977021))





# [1.3.0-rc.1](/compare/@ceramicnetwork/cli@1.3.0-rc.0...@ceramicnetwork/cli@1.3.0-rc.1) (2021-08-19)


### Features

* configure nft-did-resolver via config file (#1656) 78baf4d, closes #1656
* **cli:** Add hierarchy to daemon config (#1633) 138b49d, closes #1633





# [1.3.0-rc.0](/compare/@ceramicnetwork/cli@1.2.1...@ceramicnetwork/cli@1.3.0-rc.0) (2021-08-13)


### Features

* Rely on default nft-did-resolver subgraphs (#1635) 949aba1, closes #1635
* **cli:** Add daemon config file (#1629) 642f071, closes #1629
* **core:** Add API to request an anchor (#1622) 8473c6a, closes #1622
* Include nft-did-resolver (#1620) 0615c62, closes #1620





## [1.2.1](/compare/@ceramicnetwork/cli@1.2.0-rc.5...@ceramicnetwork/cli@1.2.1) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.2.0](/compare/@ceramicnetwork/cli@1.2.0-rc.5...@ceramicnetwork/cli@1.2.0) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.2.0-rc.5](/compare/@ceramicnetwork/cli@1.2.0-rc.4...@ceramicnetwork/cli@1.2.0-rc.5) (2021-08-03)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.2.0-rc.4](/compare/@ceramicnetwork/cli@1.2.0-rc.3...@ceramicnetwork/cli@1.2.0-rc.4) (2021-07-30)


### Features

* **cli:** ethr-did-resolver support for mainnet (#1561) 7e53190, closes #1561
* **core:** Invalid commits don't prevent loading a stream (#1597) fb1dea1, closes #1597
* **daemon:** add raw_data endpoint (#1395) 41b6109, closes #1395 ceramicnetwork#1394





# [1.2.0-rc.3](/compare/@ceramicnetwork/cli@1.2.0-rc.2...@ceramicnetwork/cli@1.2.0-rc.3) (2021-07-19)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.2.0-rc.2](/compare/@ceramicnetwork/cli@1.2.0-rc.1...@ceramicnetwork/cli@1.2.0-rc.2) (2021-07-16)


### Bug Fixes

* **cli:** Make syncOverride option to CeramicDaemon optional (#1554) 967b17d, closes #1554





# [1.2.0-rc.1](/compare/@ceramicnetwork/cli@1.2.0-rc.0...@ceramicnetwork/cli@1.2.0-rc.1) (2021-07-16)


### Features

* **cli:** add global sync override option (#1541) 4806e92, closes #1541
* Check signature of a lone genesis (#1529) b55e225, closes #1529
* Pass issuer to verifyJWS (#1542) 3c60b0c, closes #1542
* Pass time-information when checking a signature (#1502) 913e091, closes #1502





# [1.2.0-rc.0](/compare/@ceramicnetwork/cli@1.1.0...@ceramicnetwork/cli@1.2.0-rc.0) (2021-06-30)


### Features

* **core, cli:** Remove --disable-anchors flag and fold its functionality into --gateway (#1513) be397c8, closes #1513





# [1.1.0](/compare/@ceramicnetwork/cli@1.1.0-rc.0...@ceramicnetwork/cli@1.1.0) (2021-06-22)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.1.0-rc.0](/compare/@ceramicnetwork/cli@1.0.6...@ceramicnetwork/cli@1.1.0-rc.0) (2021-06-21)


### Features

* **core,cli:** Add --disable-anchors flag to allow ceramic to start up without a working CAS (#1490) 9dfc167, closes #1490





## [1.0.6](/compare/@ceramicnetwork/cli@1.0.5...@ceramicnetwork/cli@1.0.6) (2021-06-06)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.0.5](/compare/@ceramicnetwork/cli@1.0.4...@ceramicnetwork/cli@1.0.5) (2021-06-03)


### Bug Fixes

* **core:** ipfs subscribe, pin version (#1454) fc9c5e7, closes #1454





## [1.0.4](/compare/@ceramicnetwork/cli@1.0.4-rc.0...@ceramicnetwork/cli@1.0.4) (2021-05-31)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.0.4-rc.0](/compare/@ceramicnetwork/cli@1.0.3...@ceramicnetwork/cli@1.0.4-rc.0) (2021-05-28)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.0.3](/compare/@ceramicnetwork/cli@1.0.2...@ceramicnetwork/cli@1.0.3) (2021-05-25)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.0.2](/compare/@ceramicnetwork/cli@1.0.1...@ceramicnetwork/cli@1.0.2) (2021-05-20)

**Note:** Version bump only for package @ceramicnetwork/cli





## [1.0.1](/compare/@ceramicnetwork/cli@1.0.0...@ceramicnetwork/cli@1.0.1) (2021-05-13)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0](/compare/@ceramicnetwork/cli@1.0.0-rc.13...@ceramicnetwork/cli@1.0.0) (2021-05-06)


### Bug Fixes

* **cli:** Handle undefined docOpts in legacy http endpoints (#1353) a473ce5, closes #1353


### Features

* Expose CeramicDaemon from cli package (#1357) 28d0e65, closes #1357





# [1.0.0-rc.13](/compare/@ceramicnetwork/cli@1.0.0-rc.12...@ceramicnetwork/cli@1.0.0-rc.13) (2021-05-03)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.12](/compare/@ceramicnetwork/cli@1.0.0-rc.11...@ceramicnetwork/cli@1.0.0-rc.12) (2021-04-30)


### Features

* **cli:** use 0 address for default hostname (#1330) 50ea615, closes #1330





# [1.0.0-rc.11](/compare/@ceramicnetwork/cli@1.0.0-rc.10...@ceramicnetwork/cli@1.0.0-rc.11) (2021-04-29)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.10](/compare/@ceramicnetwork/cli@1.0.0-rc.9...@ceramicnetwork/cli@1.0.0-rc.10) (2021-04-29)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.9](/compare/@ceramicnetwork/cli@1.0.0-rc.8...@ceramicnetwork/cli@1.0.0-rc.9) (2021-04-29)


### Features

* **cli:** allow daemon hostname to be configured (#1329) feba266, closes #1329





# [1.0.0-rc.8](/compare/@ceramicnetwork/cli@1.0.0-rc.7...@ceramicnetwork/cli@1.0.0-rc.8) (2021-04-28)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.7](/compare/@ceramicnetwork/cli@1.0.0-rc.6...@ceramicnetwork/cli@1.0.0-rc.7) (2021-04-28)


### Bug Fixes

* **cli:** Allow large requests to http API (#1324) 714922d, closes #1324





# [1.0.0-rc.6](/compare/@ceramicnetwork/cli@1.0.0-rc.5...@ceramicnetwork/cli@1.0.0-rc.6) (2021-04-26)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.5](/compare/@ceramicnetwork/cli@1.0.0-rc.4...@ceramicnetwork/cli@1.0.0-rc.5) (2021-04-23)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.4](/compare/@ceramicnetwork/cli@1.0.0-rc.3...@ceramicnetwork/cli@1.0.0-rc.4) (2021-04-23)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.3](/compare/@ceramicnetwork/cli@1.0.0-rc.2...@ceramicnetwork/cli@1.0.0-rc.3) (2021-04-20)


### Bug Fixes

* **cli:** Fix cli update function (#1238) b033038, closes #1238
* Fix tests by using node environment for jest (#1212) 0f04006, closes #1212
* **cli:** set a DID with resolvers in daemon (#1200) f3c9c2d, closes #1200


### Features

* **common:** Change 'sync' option to an enum and refine sync behaviors (#1269) 0b652fb, closes #1269
* **common:** Miscellaneous renames from document-based to stream-based terminology (#1290) 2ca935e, closes #1290
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis (#1285) 0dbfbf3, closes #1285
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string (#1286) 967cf11, closes #1286
* DocState contains type as number (#1250) 56501e2, closes #1250
* **cli,http-client:** Update HTTP API to use streams terminology (#1237) 6c0a142, closes #1237
* **common:** Remove deprecated methods named with Records instead of Commits (#1217) 43fa46a, closes #1217
* **common:** Rename Doctype to Stream (#1266) 4ebb6ac, closes #1266
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() (#1196) e9b3c18, closes #1196
* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **core,http-client,cli:** Update config options from document to stream-based terminology (#1249) 5ce0969, closes #1249
* **doctype-caip10-link:** Rename 'content' to 'did' for Caip10Link (#1216) f594ff0, closes #1216
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link (#1264) ed7ee3c, closes #1264
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument (#1225) ce0694b, closes #1225
* **streamid:** Rename DocID to StreamID (#1195) 65754d1, closes #1195
* **tile-doctype:** Update Tile API (#1180) 90973ee, closes #1180





# [1.0.0-rc.2](/compare/@ceramicnetwork/cli@1.0.0-rc.1...@ceramicnetwork/cli@1.0.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/cli





# [1.0.0-rc.1](/compare/@ceramicnetwork/cli@0.23.0-rc.2...@ceramicnetwork/cli@1.0.0-rc.1) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.23.0-rc.2](/compare/@ceramicnetwork/cli@0.23.0-rc.1...@ceramicnetwork/cli@0.23.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.23.0-rc.1](/compare/@ceramicnetwork/cli@0.22.0...@ceramicnetwork/cli@0.23.0-rc.1) (2021-04-19)


### Bug Fixes

* Fix tests by using node environment for jest (#1212) aff01c6, closes #1212





# [0.23.0-rc.0](/compare/@ceramicnetwork/cli@0.22.0...@ceramicnetwork/cli@0.23.0-rc.0) (2021-04-02)


### Features

* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **tile-doctype:** Update Tile API 48f30e1





# [0.22.0](/compare/@ceramicnetwork/cli@0.21.0...@ceramicnetwork/cli@0.22.0) (2021-04-02)


### Bug Fixes

* **common, logger:** Clean up dependencies (#1164) 191ad31, closes #1164


### Features

* add networks enum and elp (#1187) 7a60b30, closes #1187





## [0.21.1-rc.4](/compare/@ceramicnetwork/cli@0.21.0...@ceramicnetwork/cli@0.21.1-rc.4) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.21.1-rc.3](/compare/@ceramicnetwork/cli@0.21.0...@ceramicnetwork/cli@0.21.1-rc.3) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.21.1-rc.2](/compare/@ceramicnetwork/cli@0.21.0...@ceramicnetwork/cli@0.21.1-rc.2) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.21.1-rc.1](/compare/@ceramicnetwork/cli@0.21.1-rc.0...@ceramicnetwork/cli@0.21.1-rc.1) (2021-03-25)


### Reverts

* Revert "update some deps" 2f195fc





## [0.21.1-rc.0](/compare/@ceramicnetwork/cli@0.21.0...@ceramicnetwork/cli@0.21.1-rc.0) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.21.0](/compare/@ceramicnetwork/cli@0.21.0-rc.11...@ceramicnetwork/cli@0.21.0) (2021-03-22)


### Bug Fixes

* **cli:** Allow CommitID for show and state commands (#1135) b897b1e, closes #1135


### Features

* **core:** Meat of State Refactor: final concurrency model (#1130) 345d3d1, closes #1130 #1141





# [0.21.0-rc.11](/compare/@ceramicnetwork/cli@0.21.0-rc.10...@ceramicnetwork/cli@0.21.0-rc.11) (2021-03-15)


### Bug Fixes

* **cli:** Allow specifying ethereumRpcUrl without anchorServiceUrl (#1124) ee59e1b, closes #1124





# [0.21.0-rc.10](/compare/@ceramicnetwork/cli@0.21.0-rc.9...@ceramicnetwork/cli@0.21.0-rc.10) (2021-03-12)


### Features

* upgrade 3id did resolver (#1108) 24ef6d4, closes #1108





# [0.21.0-rc.9](/compare/@ceramicnetwork/cli@0.21.0-rc.8...@ceramicnetwork/cli@0.21.0-rc.9) (2021-03-10)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.21.0-rc.8](/compare/@ceramicnetwork/cli@0.21.0-rc.6...@ceramicnetwork/cli@0.21.0-rc.8) (2021-03-09)


### Features

* get origin in logs (#1078) 560bf15, closes #1078





# [0.21.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.8...@ceramicnetwork/cli@0.21.0-rc.7) (2021-02-25)


### Features

* **cli:** Add S3StateStore ([#1041](https://github.com/ceramicnetwork/js-ceramic/issues/1041)) ([45e9d27](https://github.com/ceramicnetwork/js-ceramic/commit/45e9d27d50d3bddf3c32e331542839fda682675e))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* **core:** Add new logger package ([#878](https://github.com/ceramicnetwork/js-ceramic/issues/878)) ([9756868](https://github.com/ceramicnetwork/js-ceramic/commit/9756868697344515635ca7fd634bd214bf419948))





# [0.21.0-rc.6](/compare/@ceramicnetwork/cli@0.21.0-rc.5...@ceramicnetwork/cli@0.21.0-rc.6) (2021-02-24)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.21.0-rc.5](/compare/@ceramicnetwork/cli@0.21.0-rc.3...@ceramicnetwork/cli@0.21.0-rc.5) (2021-02-23)


### Features

* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.21.0-rc.4](/compare/@ceramicnetwork/cli@0.21.0-rc.3...@ceramicnetwork/cli@0.21.0-rc.4) (2021-02-23)


### Features

* **cli:** Add S3StateStore (#1041) 45e9d27, closes #1041





# [0.21.0-rc.3](/compare/@ceramicnetwork/cli@0.21.0-rc.2...@ceramicnetwork/cli@0.21.0-rc.3) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.21.0-rc.2](/compare/@ceramicnetwork/cli@0.21.0-rc.0...@ceramicnetwork/cli@0.21.0-rc.2) (2021-02-22)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.21.0-rc.0](/compare/@ceramicnetwork/cli@0.20.8...@ceramicnetwork/cli@0.21.0-rc.0) (2021-02-22)


### Features

* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig (#1021) a53c534, closes #1021
* Unbundle DocID into DocID and CommitID (#1009) c2707f2, closes #1009
* **core:** Add new logger package (#878) 9756868, closes #878





## [0.20.8](/compare/@ceramicnetwork/cli@0.20.8-rc.0...@ceramicnetwork/cli@0.20.8) (2021-02-04)


### Bug Fixes

* **core:** Add ipfs timeout everywhere we get from the dag (#886) e6d5e1b, closes #886





## [0.20.8-rc.0](/compare/@ceramicnetwork/cli@0.20.7...@ceramicnetwork/cli@0.20.8-rc.0) (2021-01-29)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.20.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.6...@ceramicnetwork/cli@0.20.7) (2021-01-28)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.20.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.5...@ceramicnetwork/cli@0.20.6) (2021-01-26)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.20.5](/compare/@ceramicnetwork/cli@0.20.4...@ceramicnetwork/cli@0.20.5) (2021-01-25)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.20.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.3...@ceramicnetwork/cli@0.20.4) (2021-01-25)


### Bug Fixes

* **core:** Connect to bootstrap nodes even when using external ipfs ([#848](https://github.com/ceramicnetwork/js-ceramic/issues/848)) ([1169bc8](https://github.com/ceramicnetwork/js-ceramic/commit/1169bc84a90e59959d2123287c8b56fb46f02d97))
* update dev peer ids ([#847](https://github.com/ceramicnetwork/js-ceramic/issues/847)) ([78b5817](https://github.com/ceramicnetwork/js-ceramic/commit/78b581792ebc74670c0ca566e2d4aa874111a8af))





## [0.20.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.2...@ceramicnetwork/cli@0.20.3) (2021-01-25)


### Bug Fixes

* **cli:** Fix pinningEndpoint cli arg ([#840](https://github.com/ceramicnetwork/js-ceramic/issues/840)) ([2951d65](https://github.com/ceramicnetwork/js-ceramic/commit/2951d6592e4c945c21de842c69a16fee5367bb68))





## [0.20.2](/compare/@ceramicnetwork/cli@0.20.1...@ceramicnetwork/cli@0.20.2) (2021-01-21)


### Bug Fixes

* **cli:** Fix caeramic daemon test to use proper arg name for pinsetDirectory (#836) c33dd2a, closes #836





## [0.20.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.20.0...@ceramicnetwork/cli@0.20.1) (2021-01-21)


### Bug Fixes

* **cli:** update bootstrap peer list ([#834](https://github.com/ceramicnetwork/js-ceramic/issues/834)) ([ca2e108](https://github.com/ceramicnetwork/js-ceramic/commit/ca2e108d5fdc886707a76291860e5d479c37a30d))
* **core:** Encode network name into pin store directory name ([#775](https://github.com/ceramicnetwork/js-ceramic/issues/775)) ([2572f28](https://github.com/ceramicnetwork/js-ceramic/commit/2572f286baeb8ba41f7349b93d1399f432b420c8))





# [0.20.0](/compare/@ceramicnetwork/cli@0.19.3...@ceramicnetwork/cli@0.20.0) (2021-01-18)


### Bug Fixes

* **cli:** controllers should not default to empty array on update (#803) d9bb420, closes #803
* **cli:** Disable DHT (#806) 6d6e432, closes #806
* **cli:** Properly connect to bootstrap nodes. (#805) c0b8da0, closes #805


### Features

* **cli:** Use bootstrap nodes (#801) 0d24dfd, closes #801





## [0.19.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.19.2...@ceramicnetwork/cli@0.19.3) (2021-01-14)


### Bug Fixes

* send http error response as json ([#790](https://github.com/ceramicnetwork/js-ceramic/issues/790)) ([02e1dfc](https://github.com/ceramicnetwork/js-ceramic/commit/02e1dfcbe00a8508a6a2c5035b23156abbe723b8)), closes [#789](https://github.com/ceramicnetwork/js-ceramic/issues/789)





## [0.19.2](/compare/@ceramicnetwork/cli@0.19.1...@ceramicnetwork/cli@0.19.2) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.19.1](/compare/@ceramicnetwork/cli@0.19.0...@ceramicnetwork/cli@0.19.1) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.19.0](/compare/@ceramicnetwork/cli@0.18.6...@ceramicnetwork/cli@0.19.0) (2021-01-13)


### Bug Fixes

* **cli,http-client:** Fix pin API in CLI and http client (#752) 20fcd75, closes #752


### Features

* **cli:** Allow specifying pub/sub topic for 'local' ceramic network (#781) f3650b4, closes #781





## [0.18.6](/compare/@ceramicnetwork/cli@0.18.5...@ceramicnetwork/cli@0.18.6) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.18.5](/compare/@ceramicnetwork/cli@0.18.4...@ceramicnetwork/cli@0.18.5) (2021-01-07)


### Bug Fixes

* log api errors with status and message (#750) 6c6445c, closes #750





## [0.18.4](/compare/@ceramicnetwork/cli@0.18.3...@ceramicnetwork/cli@0.18.4) (2020-12-31)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.18.3](/compare/@ceramicnetwork/cli@0.18.2...@ceramicnetwork/cli@0.18.3) (2020-12-31)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.18.2](/compare/@ceramicnetwork/cli@0.18.1...@ceramicnetwork/cli@0.18.2) (2020-12-31)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.18.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.18.0...@ceramicnetwork/cli@0.18.1) (2020-12-29)


### Bug Fixes

* surface express errors properly ([#706](https://github.com/ceramicnetwork/js-ceramic/issues/706)) ([b4d46d1](https://github.com/ceramicnetwork/js-ceramic/commit/b4d46d17053f7cdbc0618c391419fb83013e48f4))
* **cli:** Set default anchor service URL when on dev-unstable network ([#724](https://github.com/ceramicnetwork/js-ceramic/issues/724)) ([c5091cb](https://github.com/ceramicnetwork/js-ceramic/commit/c5091cb88084b1b118afa4b50eb82627b7d0d3fb))
* **core:** Don't update document state before applying anchor record ([#714](https://github.com/ceramicnetwork/js-ceramic/issues/714)) ([294ed7c](https://github.com/ceramicnetwork/js-ceramic/commit/294ed7c1d065d2514d59f8f6116d17204ef64572))





# [0.18.0](/compare/@ceramicnetwork/cli@0.17.0...@ceramicnetwork/cli@0.18.0) (2020-12-23)


### Features

* **core:** Update default CAS URL to point to clay infra (#669) 85b6bcb, closes #669


### Reverts

* Revert "chore(release):" 26ed474





# [0.17.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.17.0-alpha.0...@ceramicnetwork/cli@0.17.0) (2020-12-17)


### Bug Fixes

* **cli:** rename healthcheck endpoint ([#673](https://github.com/ceramicnetwork/js-ceramic/issues/673)) ([bdfe1d5](https://github.com/ceramicnetwork/js-ceramic/commit/bdfe1d566184d213fb1ccdffd59389ae7752aedf))





# [0.17.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.16.2...@ceramicnetwork/cli@0.17.0-alpha.0) (2020-12-14)


### Bug Fixes

* **core:** Fail loading document at a commit if it is rejected by conflict resolution with known state of the document ([#634](https://github.com/ceramicnetwork/js-ceramic/issues/634)) ([5da5ac5](https://github.com/ceramicnetwork/js-ceramic/commit/5da5ac5251d9348699038f42857ff6bc4632fa41))


### Features

* **core:** Allow loading signed records as document versions ([#617](https://github.com/ceramicnetwork/js-ceramic/issues/617)) ([ecf6943](https://github.com/ceramicnetwork/js-ceramic/commit/ecf6943c0e475b973bd1081b85f9cb1c9622cfe7))
* **core:** Rename document "versions" to document "commits" ([#618](https://github.com/ceramicnetwork/js-ceramic/issues/618)) ([03bc30a](https://github.com/ceramicnetwork/js-ceramic/commit/03bc30a017662f3001ba855d1b73e1c245d0bfef))
* **core:** Unify implementations of Document.load and Document.loadVersion ([#594](https://github.com/ceramicnetwork/js-ceramic/issues/594)) ([ec5dd81](https://github.com/ceramicnetwork/js-ceramic/commit/ec5dd8142adf6f45fecc7adea14d0be6fd4fc589))





## [0.16.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.16.1...@ceramicnetwork/cli@0.16.2) (2020-12-09)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.16.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.16.0...@ceramicnetwork/cli@0.16.1) (2020-12-08)

**Note:** Version bump only for package @ceramicnetwork/cli





# [0.16.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.15.0...@ceramicnetwork/cli@0.16.0) (2020-12-03)


### Features

* **core:** Add default anchor service for 'testnet-clay' ([#580](https://github.com/ceramicnetwork/js-ceramic/issues/580)) ([650bf04](https://github.com/ceramicnetwork/js-ceramic/commit/650bf0413d9506c223b2148db46cf6ce7b4c25eb))





# [0.15.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.14.3...@ceramicnetwork/cli@0.15.0) (2020-12-01)


### Features

* **core:** Add ceramic network configurations ([#576](https://github.com/ceramicnetwork/js-ceramic/issues/576)) ([255d765](https://github.com/ceramicnetwork/js-ceramic/commit/255d76584e42264714fefb2a5224a656526cee93))
* **core:** Remove chainId from document metadata and stop enforcing of chainId when applying records ([#574](https://github.com/ceramicnetwork/js-ceramic/issues/574)) ([955d3f6](https://github.com/ceramicnetwork/js-ceramic/commit/955d3f6bd7348676d096cab8f32d932993690a6e))





## [0.14.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.14.2...@ceramicnetwork/cli@0.14.3) (2020-11-30)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.14.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.14.1...@ceramicnetwork/cli@0.14.2) (2020-11-30)

**Note:** Version bump only for package @ceramicnetwork/cli





## [0.14.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/cli@0.14.0...@ceramicnetwork/cli@0.14.1) (2020-11-26)

**Note:** Version bump only for package @ceramicnetwork/cli





# 0.14.0 (2020-11-24)


### Bug Fixes

* disable randomWalk ([ed6fb39](https://github.com/ceramicnetwork/js-ceramic/commit/ed6fb39da06ecc5cb5a001ba388b1352f68bf457))
* **cli:** fix conflicts ([99e297a](https://github.com/ceramicnetwork/js-ceramic/commit/99e297a3c8b7ddfb5e52881c19e8f20c833385b9))


### Features

* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Interpret anchorServiceURL as base URL of the CAS, without the full path to the API endpoint ([#491](https://github.com/ceramicnetwork/js-ceramic/issues/491)) ([75cffa7](https://github.com/ceramicnetwork/js-ceramic/commit/75cffa78911dad8aa9c63c43c9843d761839071d))
* **core:** Make isUnique default to true ([#427](https://github.com/ceramicnetwork/js-ceramic/issues/427)) ([cbd9041](https://github.com/ceramicnetwork/js-ceramic/commit/cbd90410865c3a7be00b0b153f682150dfd1ac91))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))





## [0.13.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.4-alpha.0...@ceramicnetwork/ceramic-cli@0.13.4) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.13.4-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.3...@ceramicnetwork/ceramic-cli@0.13.4-alpha.0) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.13.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.2...@ceramicnetwork/ceramic-cli@0.13.3) (2020-11-17)


### Bug Fixes

* disable random walk for DHT ([#504](https://github.com/ceramicnetwork/js-ceramic/issues/504)) ([fc931f7](https://github.com/ceramicnetwork/js-ceramic/commit/fc931f7c1d07a7b4f7ec261e9a03af39cfc8b0aa))





## [0.13.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.1...@ceramicnetwork/ceramic-cli@0.13.2) (2020-11-11)


### Bug Fixes

* bump IDW dep, fix Dockerfile ([#474](https://github.com/ceramicnetwork/js-ceramic/issues/474)) ([79b39a4](https://github.com/ceramicnetwork/js-ceramic/commit/79b39a4e7212c22991805ae1b93f10b3d146d540))





## [0.13.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.0...@ceramicnetwork/ceramic-cli@0.13.1) (2020-11-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.13.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.0-alpha.1...@ceramicnetwork/ceramic-cli@0.13.0) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.13.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.13.0-alpha.0...@ceramicnetwork/ceramic-cli@0.13.0-alpha.1) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.13.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.12.0...@ceramicnetwork/ceramic-cli@0.13.0-alpha.0) (2020-10-27)


### Features

* **core:** Rename owners to controllers ([#423](https://github.com/ceramicnetwork/js-ceramic/issues/423)) ([c94ff15](https://github.com/ceramicnetwork/js-ceramic/commit/c94ff155a10c7dd3c486846f6cd8e91d320485cc))





# [0.12.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.12.0-alpha.0...@ceramicnetwork/ceramic-cli@0.12.0) (2020-10-26)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.12.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.11.2-alpha.0...@ceramicnetwork/ceramic-cli@0.12.0-alpha.0) (2020-10-26)


### Bug Fixes

* fix tests and minor refactor ([71825e2](https://github.com/ceramicnetwork/js-ceramic/commit/71825e22282c5e9a8e53f431e82ff1fb9ce7eec5))


### Features

* **cli:** docid string handling, cid to docid path params ([508172c](https://github.com/ceramicnetwork/js-ceramic/commit/508172c4d5ef2740b96953935c9497c686e7b46a))
* docids support ([1e48e9e](https://github.com/ceramicnetwork/js-ceramic/commit/1e48e9e88090463f27f831f4b47a3fab30ba8c5e))
* idw update, docid idw ([09c7c0d](https://github.com/ceramicnetwork/js-ceramic/commit/09c7c0dc8e6e60ca3cf190f6e3c2b6c51a2e52ae))





## [0.11.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.11.1...@ceramicnetwork/ceramic-cli@0.11.2-alpha.0) (2020-10-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.11.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.11.1-alpha.0...@ceramicnetwork/ceramic-cli@0.11.1) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.11.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.11.0...@ceramicnetwork/ceramic-cli@0.11.1-alpha.0) (2020-10-13)


### Bug Fixes

* change identity-wallet version ([#384](https://github.com/ceramicnetwork/js-ceramic/issues/384)) ([9e0ba75](https://github.com/ceramicnetwork/js-ceramic/commit/9e0ba752b22c944b827edcecd68cb987905fd4d6))





# [0.11.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.10.1-alpha.1...@ceramicnetwork/ceramic-cli@0.11.0) (2020-10-07)


### Bug Fixes

* add todos to remove logToFile ([5f5433a](https://github.com/ceramicnetwork/js-ceramic/commit/5f5433a7636bba134457a9b264c7e88bf3ad4aed))
* initialize log level through ceramic config only ([0f5eb22](https://github.com/ceramicnetwork/js-ceramic/commit/0f5eb22963c0bc04ca08ab64929ef320b2b1b5b1))
* lint ([68d77bb](https://github.com/ceramicnetwork/js-ceramic/commit/68d77bb2c464226283b07345775efeead9136687))
* log errors and refactor http logging ([da1f777](https://github.com/ceramicnetwork/js-ceramic/commit/da1f777ecea1507eb58662132d0db48c9dba2de8))
* remove logToFile in favor of plugin and update file names ([5bbdd27](https://github.com/ceramicnetwork/js-ceramic/commit/5bbdd27922d8b873a42fb18a83e2bb0815b4052f))
* remove repeat request data from response log ([5df425f](https://github.com/ceramicnetwork/js-ceramic/commit/5df425f79ecf2deda03d29f73375e5d32dd2b053))


### Features

* make log to file optional and config path ([581bba8](https://github.com/ceramicnetwork/js-ceramic/commit/581bba8c91f963893fb5509b97b939cfee0bd68d))
* write daemon logs to files ([0738730](https://github.com/ceramicnetwork/js-ceramic/commit/073873013f55a3afb0aa24e8fba57c7b39be1e0a))





## [0.10.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.10.1-alpha.0...@ceramicnetwork/ceramic-cli@0.10.1-alpha.1) (2020-10-06)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.10.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.10.0...@ceramicnetwork/ceramic-cli@0.10.1-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.10.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.10.0-alpha.1...@ceramicnetwork/ceramic-cli@0.10.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.10.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.2-alpha.0...@ceramicnetwork/ceramic-cli@0.10.0-alpha.1) (2020-10-05)


### Bug Fixes

* add gateway to ceramic config and use pinningStorePath for cli ([#351](https://github.com/ceramicnetwork/js-ceramic/issues/351)) ([d374870](https://github.com/ceramicnetwork/js-ceramic/commit/d374870990048536aa780a5393c4c29cceac4a78))


### Features

* add dag-jose format to ipfs-http-client ([#341](https://github.com/ceramicnetwork/js-ceramic/issues/341)) ([18cbec8](https://github.com/ceramicnetwork/js-ceramic/commit/18cbec8fddc63c63cd02459f1dc6ff4e068f202f))
* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))





# [0.10.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.2-alpha.0...@ceramicnetwork/ceramic-cli@0.10.0-alpha.0) (2020-09-28)


### Features

* **common:** refactor logger, include component name ([#326](https://github.com/ceramicnetwork/js-ceramic/issues/326)) ([02e8d66](https://github.com/ceramicnetwork/js-ceramic/commit/02e8d66e25d7fb8887496cf6b3430be90b79d4f3))


## [0.9.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.2-alpha.0...@ceramicnetwork/ceramic-cli@0.9.2) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli



## [0.9.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.1-alpha.1...@ceramicnetwork/ceramic-cli@0.9.2-alpha.0) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.9.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.1-alpha.0...@ceramicnetwork/ceramic-cli@0.9.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli


## [0.9.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.1-alpha.0...@ceramicnetwork/ceramic-cli@0.9.1-alpha.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli


## [0.9.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.9.0...@ceramicnetwork/ceramic-cli@0.9.1-alpha.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.9.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.8.0...@ceramicnetwork/ceramic-cli@0.9.0) (2020-09-25)


### Features

* cors middleware, preflight/content type ([dd47f1d](https://github.com/ceramicnetwork/js-ceramic/commit/dd47f1da5517a655d5334802a7ec610ac13591d3))
* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.9.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.8.0...@ceramicnetwork/ceramic-cli@0.9.0-alpha.0) (2020-09-25)


### Features

* cors middleware, preflight/content type ([dd47f1d](https://github.com/ceramicnetwork/js-ceramic/commit/dd47f1da5517a655d5334802a7ec610ac13591d3))
* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.8.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.8.0-alpha.1...@ceramicnetwork/ceramic-cli@0.8.0) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.8.0-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.8.0-alpha.0...@ceramicnetwork/ceramic-cli@0.8.0-alpha.1) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.8.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.7.0...@ceramicnetwork/ceramic-cli@0.8.0-alpha.0) (2020-09-17)


### Features

* **cli:** disable CLI logs ([#311](https://github.com/ceramicnetwork/js-ceramic/issues/311)) ([2a2494d](https://github.com/ceramicnetwork/js-ceramic/commit/2a2494d24bb58853b61d2f6444f62bbb7f81e1d7))





# [0.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.7.0-alpha.0...@ceramicnetwork/ceramic-cli@0.7.0) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.7.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.6.0...@ceramicnetwork/ceramic-cli@0.7.0-alpha.0) (2020-09-16)


### Features

* add read only gateway option ([#282](https://github.com/ceramicnetwork/js-ceramic/issues/282)) ([08bb247](https://github.com/ceramicnetwork/js-ceramic/commit/08bb247e5e97e526a23d1a7af1913fac722d4019))





# [0.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.11...@ceramicnetwork/ceramic-cli@0.6.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))
* **cli:** add config option to CLI, fix seed generation ([#293](https://github.com/ceramicnetwork/js-ceramic/issues/293)) ([4543d4e](https://github.com/ceramicnetwork/js-ceramic/commit/4543d4e298663eacc981c3d07e64bf0334f84076))





# [0.6.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.11...@ceramicnetwork/ceramic-cli@0.6.0-alpha.0) (2020-09-11)


### Features

* bump IW deps ([#295](https://github.com/ceramicnetwork/js-ceramic/issues/295)) ([1276874](https://github.com/ceramicnetwork/js-ceramic/commit/1276874be36c578c41193180d02d597cbdd4302e))
* **cli:** add config option to CLI, fix seed generation ([#293](https://github.com/ceramicnetwork/js-ceramic/issues/293)) ([4543d4e](https://github.com/ceramicnetwork/js-ceramic/commit/4543d4e298663eacc981c3d07e64bf0334f84076))





## [0.5.11](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.11-alpha.0...@ceramicnetwork/ceramic-cli@0.5.11) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.11-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.10...@ceramicnetwork/ceramic-cli@0.5.11-alpha.0) (2020-09-09)


### Bug Fixes

* set DID when requesting a signature ([#283](https://github.com/ceramicnetwork/js-ceramic/issues/283)) ([416b639](https://github.com/ceramicnetwork/js-ceramic/commit/416b639eb534655ebe3bc648b2321f0432e4eb6e))





## [0.5.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.9...@ceramicnetwork/ceramic-cli@0.5.10) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))





## [0.5.10-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.9...@ceramicnetwork/ceramic-cli@0.5.10-alpha.0) (2020-09-04)


### Bug Fixes

* fix build issues ([#270](https://github.com/ceramicnetwork/js-ceramic/issues/270)) ([cd0dccb](https://github.com/ceramicnetwork/js-ceramic/commit/cd0dccbe97617288ada1720660fba7d249702271))





## [0.5.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.9-alpha.0...@ceramicnetwork/ceramic-cli@0.5.9) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.9-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.8...@ceramicnetwork/ceramic-cli@0.5.9-alpha.0) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.7...@ceramicnetwork/ceramic-cli@0.5.8) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.3...@ceramicnetwork/ceramic-cli@0.5.7) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.3...@ceramicnetwork/ceramic-cli@0.5.6) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.3...@ceramicnetwork/ceramic-cli@0.5.5) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.3...@ceramicnetwork/ceramic-cli@0.5.4) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.2...@ceramicnetwork/ceramic-cli@0.5.3) (2020-08-31)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.5.2-alpha.0...@ceramicnetwork/ceramic-cli@0.5.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.5.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@5.0.2...@ceramicnetwork/ceramic-cli@0.5.2-alpha.0) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [5.0.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@5.0.1...@ceramicnetwork/ceramic-cli@5.0.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [5.0.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.4.0...@ceramicnetwork/ceramic-cli@5.0.1) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.8...@ceramicnetwork/ceramic-cli@0.4.0) (2020-08-28)


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))
* **core:** Powergate pinning ([#201](https://github.com/ceramicnetwork/js-ceramic/issues/201)) ([b8cd3ea](https://github.com/ceramicnetwork/js-ceramic/commit/b8cd3ea91d67ae151ce7bca004e63696c16c31c6))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.8...@ceramicnetwork/ceramic-cli@0.3.0) (2020-08-28)


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))
* **core:** Powergate pinning ([#201](https://github.com/ceramicnetwork/js-ceramic/issues/201)) ([b8cd3ea](https://github.com/ceramicnetwork/js-ceramic/commit/b8cd3ea91d67ae151ce7bca004e63696c16c31c6))





## [0.2.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.7...@ceramicnetwork/ceramic-cli@0.2.8) (2020-08-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.6...@ceramicnetwork/ceramic-cli@0.2.7) (2020-07-21)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.5...@ceramicnetwork/ceramic-cli@0.2.6) (2020-07-21)


### Bug Fixes

* fix conflicts with master ([1077bdb](https://github.com/ceramicnetwork/js-ceramic/commit/1077bdb81ce10bfeafa5a53922eb93dfcf4b23f6))


### Features

* document versioning ([#176](https://github.com/ceramicnetwork/js-ceramic/issues/176)) ([5c138f0](https://github.com/ceramicnetwork/js-ceramic/commit/5c138f0ecd3433ef364b9a266607263ee97526d1))
* **cli:** remove hardcoded seed ([#151](https://github.com/ceramicnetwork/js-ceramic/issues/151)) ([063bd35](https://github.com/ceramicnetwork/js-ceramic/commit/063bd35b94ddc5f5f917c13bdaaa5fe4395c7baa))





## [0.2.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.5-alpha.0...@ceramicnetwork/ceramic-cli@0.2.5) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.4...@ceramicnetwork/ceramic-cli@0.2.5-alpha.0) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.3...@ceramicnetwork/ceramic-cli@0.2.4) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.2...@ceramicnetwork/ceramic-cli@0.2.3) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





## [0.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.1...@ceramicnetwork/ceramic-cli@0.2.2) (2020-07-13)


### Bug Fixes

* **account-template:** fix import ([3a660d7](https://github.com/ceramicnetwork/js-ceramic/commit/3a660d72f654d7614f207587b5086888c9da6273))





## [0.2.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.2.0...@ceramicnetwork/ceramic-cli@0.2.1) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-cli





# [0.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-cli@0.1.0...@ceramicnetwork/ceramic-cli@0.2.0) (2020-04-17)


### Bug Fixes

* **cli:** support CIDs ([efcc21e](https://github.com/ceramicnetwork/js-ceramic/commit/efcc21e906db5c032fcff421ce8d69b95e621058))
* **package:** explicitly set identity-wallet version for now ([22dee43](https://github.com/ceramicnetwork/js-ceramic/commit/22dee4363167a00c5a39a9b690f44d8b9e1a1221))
* on createDocument, return copy in _docmap ([#37](https://github.com/ceramicnetwork/js-ceramic/issues/37)) ([d978e2d](https://github.com/ceramicnetwork/js-ceramic/commit/d978e2d26a5f4335a0e7b96370ea3bfa3640ae9b))


### Features

* **cli:** add cli dockerfile, add ipfs-api daemon option ([#34](https://github.com/ceramicnetwork/js-ceramic/issues/34)) ([2822cb4](https://github.com/ceramicnetwork/js-ceramic/commit/2822cb4df0e2c4cdd9c9111100551191ceb85e86))





# 0.1.0 (2020-04-08)


### Features

* **ceramic-cli:** Implement CeramicDaemon ([cfe56aa](https://github.com/ceramicnetwork/js-ceramic/commit/cfe56aa9b0761f7870981f9f957e56da66382029))
* **cli:** implemented most commands ([16c860e](https://github.com/ceramicnetwork/js-ceramic/commit/16c860e18784ee6a61701f99059ac927b0b19c2e))
* **cli:** implemented watch command ([7c20e6a](https://github.com/ceramicnetwork/js-ceramic/commit/7c20e6a4762f6fcc41d5394d36e2c73951bf8dd5))
* **cli:** Proper error handling ([acbe044](https://github.com/ceramicnetwork/js-ceramic/commit/acbe044f634badd36d079d5125c41ad56163b57e))
* **cli:** Support signed doctypes ([3d2ad1f](https://github.com/ceramicnetwork/js-ceramic/commit/3d2ad1ff28638d064b6cecd298dc9b9f1b6a432c))
* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))





# 0.1.0-alpha.0 (2020-04-07)


### Features

* **ceramic-cli:** Implement CeramicDaemon ([cfe56aa](https://github.com/ceramicnetwork/js-ceramic/commit/cfe56aa9b0761f7870981f9f957e56da66382029))
* **cli:** implemented most commands ([16c860e](https://github.com/ceramicnetwork/js-ceramic/commit/16c860e18784ee6a61701f99059ac927b0b19c2e))
* **cli:** implemented watch command ([7c20e6a](https://github.com/ceramicnetwork/js-ceramic/commit/7c20e6a4762f6fcc41d5394d36e2c73951bf8dd5))
* **cli:** Proper error handling ([acbe044](https://github.com/ceramicnetwork/js-ceramic/commit/acbe044f634badd36d079d5125c41ad56163b57e))
* **cli:** Support signed doctypes ([3d2ad1f](https://github.com/ceramicnetwork/js-ceramic/commit/3d2ad1ff28638d064b6cecd298dc9b9f1b6a432c))
* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))
