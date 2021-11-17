# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.5.0-rc.0...@ceramicnetwork/http-client@1.5.0) (2021-11-17)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.5.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.4...@ceramicnetwork/http-client@1.5.0-rc.0) (2021-11-12)


### Bug Fixes

* Flaky doc test ([#1475](https://github.com/ceramicnetwork/js-ceramic/issues/1475)) ([5fd9f8e](https://github.com/ceramicnetwork/js-ceramic/commit/5fd9f8ed19ce244dc989c4e3f9ba2790c5afbf9a))
* **cli,http-client:** Fix pin API in CLI and http client ([#752](https://github.com/ceramicnetwork/js-ceramic/issues/752)) ([20fcd75](https://github.com/ceramicnetwork/js-ceramic/commit/20fcd7598e589c088bcc778bafd1304efa64edb7))
* **client:** fix resolver construction ([#549](https://github.com/ceramicnetwork/js-ceramic/issues/549)) ([f23ff93](https://github.com/ceramicnetwork/js-ceramic/commit/f23ff938e92e2f835f613e8e3162fe7795194ebf))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **http-client:** Allow just one stream of sync http calls ([#1406](https://github.com/ceramicnetwork/js-ceramic/issues/1406)) ([f089c41](https://github.com/ceramicnetwork/js-ceramic/commit/f089c41051b2d5829ac2cc3e3e6aaf30fec946be))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** Don't use the logger in the http-client ([#1138](https://github.com/ceramicnetwork/js-ceramic/issues/1138)) ([0dfdb27](https://github.com/ceramicnetwork/js-ceramic/commit/0dfdb27d3fbef92683ce4054acdcd09568805b19))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))


### Features

* **core,http-client:** Add 'force' option to pin API ([#1820](https://github.com/ceramicnetwork/js-ceramic/issues/1820)) ([7e2a742](https://github.com/ceramicnetwork/js-ceramic/commit/7e2a7425afaa0c0c4364ed0c052003ee39d6b40f))
* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* http client applyCommit respects cache ([#1355](https://github.com/ceramicnetwork/js-ceramic/issues/1355)) ([4cb0fe7](https://github.com/ceramicnetwork/js-ceramic/commit/4cb0fe7d6663a22b46ce14ef7a67bdb053305209))
* Named export of CeramicClient ([#1661](https://github.com/ceramicnetwork/js-ceramic/issues/1661)) ([2f5d8f8](https://github.com/ceramicnetwork/js-ceramic/commit/2f5d8f8a4da6201988c08818e360ec5988f5c043))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **cli,http-client:** Update HTTP API to use streams terminology ([#1237](https://github.com/ceramicnetwork/js-ceramic/issues/1237)) ([6c0a142](https://github.com/ceramicnetwork/js-ceramic/commit/6c0a1421623d5e0dd0ab5bc83413fcad75b14d66))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **http-client:** Remove ability to pin documents in local cache in http client ([#762](https://github.com/ceramicnetwork/js-ceramic/issues/762)) ([dcf7add](https://github.com/ceramicnetwork/js-ceramic/commit/dcf7add42affc340ff58951828186c960c144f0c))
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument ([#1225](https://github.com/ceramicnetwork/js-ceramic/issues/1225)) ([ce0694b](https://github.com/ceramicnetwork/js-ceramic/commit/ce0694b8405f29a6c54a2d214599d210e6f1e4de))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))


### Reverts

* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





## [1.4.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.4-rc.0...@ceramicnetwork/http-client@1.4.4) (2021-11-12)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.4-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.3...@ceramicnetwork/http-client@1.4.4-rc.0) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.3-rc.1...@ceramicnetwork/http-client@1.4.3) (2021-11-03)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.3-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.3-rc.0...@ceramicnetwork/http-client@1.4.3-rc.1) (2021-10-28)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.3-rc.0](/compare/@ceramicnetwork/http-client@1.4.2...@ceramicnetwork/http-client@1.4.3-rc.0) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.2](/compare/@ceramicnetwork/http-client@1.4.1...@ceramicnetwork/http-client@1.4.2) (2021-10-25)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.1-rc.0...@ceramicnetwork/http-client@1.4.1) (2021-10-20)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.4.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.0...@ceramicnetwork/http-client@1.4.1-rc.0) (2021-10-14)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.0-rc.1...@ceramicnetwork/http-client@1.4.0) (2021-10-14)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.4.0-rc.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.4.0-rc.0...@ceramicnetwork/http-client@1.4.0-rc.1) (2021-09-18)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.4.0-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.3.0...@ceramicnetwork/http-client@1.4.0-rc.0) (2021-09-17)


### Bug Fixes

* Flaky doc test ([#1475](https://github.com/ceramicnetwork/js-ceramic/issues/1475)) ([5fd9f8e](https://github.com/ceramicnetwork/js-ceramic/commit/5fd9f8ed19ce244dc989c4e3f9ba2790c5afbf9a))
* **cli,http-client:** Fix pin API in CLI and http client ([#752](https://github.com/ceramicnetwork/js-ceramic/issues/752)) ([20fcd75](https://github.com/ceramicnetwork/js-ceramic/commit/20fcd7598e589c088bcc778bafd1304efa64edb7))
* **client:** fix resolver construction ([#549](https://github.com/ceramicnetwork/js-ceramic/issues/549)) ([f23ff93](https://github.com/ceramicnetwork/js-ceramic/commit/f23ff938e92e2f835f613e8e3162fe7795194ebf))
* **common, logger:** Clean up dependencies ([#1164](https://github.com/ceramicnetwork/js-ceramic/issues/1164)) ([191ad31](https://github.com/ceramicnetwork/js-ceramic/commit/191ad310b87ac9aba97bb84b122908337f35aa11))
* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations ([#1391](https://github.com/ceramicnetwork/js-ceramic/issues/1391)) ([700221e](https://github.com/ceramicnetwork/js-ceramic/commit/700221e61ee3a1f3deb03766fffde49da12f8053))
* **http-client:** Allow just one stream of sync http calls ([#1406](https://github.com/ceramicnetwork/js-ceramic/issues/1406)) ([f089c41](https://github.com/ceramicnetwork/js-ceramic/commit/f089c41051b2d5829ac2cc3e3e6aaf30fec946be))
* Fix tests by using node environment for jest ([#1212](https://github.com/ceramicnetwork/js-ceramic/issues/1212)) ([0f04006](https://github.com/ceramicnetwork/js-ceramic/commit/0f04006098f9028c6750c9920c4b3af758b71235))
* **http-client:** Don't use the logger in the http-client ([#1138](https://github.com/ceramicnetwork/js-ceramic/issues/1138)) ([0dfdb27](https://github.com/ceramicnetwork/js-ceramic/commit/0dfdb27d3fbef92683ce4054acdcd09568805b19))
* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))
* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))
* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))


### Features

* **core,http-client:** Add 'publish' option to unpin command ([#1706](https://github.com/ceramicnetwork/js-ceramic/issues/1706)) ([0ad204e](https://github.com/ceramicnetwork/js-ceramic/commit/0ad204e26e9d097ce8647ed3fd9efaea5484eb03))
* Named export of CeramicClient ([#1661](https://github.com/ceramicnetwork/js-ceramic/issues/1661)) ([2f5d8f8](https://github.com/ceramicnetwork/js-ceramic/commit/2f5d8f8a4da6201988c08818e360ec5988f5c043))
* **core:** Add API to request an anchor ([#1622](https://github.com/ceramicnetwork/js-ceramic/issues/1622)) ([8473c6a](https://github.com/ceramicnetwork/js-ceramic/commit/8473c6a0554147912d76e4ed6edf50597a22a39c))
* Check signature of a lone genesis ([#1529](https://github.com/ceramicnetwork/js-ceramic/issues/1529)) ([b55e225](https://github.com/ceramicnetwork/js-ceramic/commit/b55e225682e57aace057fb9e5e8aec0d78d63b75))
* DocState contains type as number ([#1250](https://github.com/ceramicnetwork/js-ceramic/issues/1250)) ([56501e2](https://github.com/ceramicnetwork/js-ceramic/commit/56501e264aebb4e9b01ea31422dfd6f7827b1382))
* http client applyCommit respects cache ([#1355](https://github.com/ceramicnetwork/js-ceramic/issues/1355)) ([4cb0fe7](https://github.com/ceramicnetwork/js-ceramic/commit/4cb0fe7d6663a22b46ce14ef7a67bdb053305209))
* Pass issuer to verifyJWS ([#1542](https://github.com/ceramicnetwork/js-ceramic/issues/1542)) ([3c60b0c](https://github.com/ceramicnetwork/js-ceramic/commit/3c60b0c43267e29e17fd1f676f25bf11c2ab06d5))
* Pass time-information when checking a signature ([#1502](https://github.com/ceramicnetwork/js-ceramic/issues/1502)) ([913e091](https://github.com/ceramicnetwork/js-ceramic/commit/913e091827691f37a3e02ffcef569a22fd6f007d))
* **3id-did-resolver:** did metadata resolution ([#1139](https://github.com/ceramicnetwork/js-ceramic/issues/1139)) ([818bde1](https://github.com/ceramicnetwork/js-ceramic/commit/818bde130280f248e9d5e90954c620459a2392b6))
* **cli,http-client:** Update HTTP API to use streams terminology ([#1237](https://github.com/ceramicnetwork/js-ceramic/issues/1237)) ([6c0a142](https://github.com/ceramicnetwork/js-ceramic/commit/6c0a1421623d5e0dd0ab5bc83413fcad75b14d66))
* **common:** Change 'sync' option to an enum and refine sync behaviors ([#1269](https://github.com/ceramicnetwork/js-ceramic/issues/1269)) ([0b652fb](https://github.com/ceramicnetwork/js-ceramic/commit/0b652fb7bc37585bd8715fcfe4bc53d1fcc709ee))
* **common:** Miscellaneous renames from document-based to stream-based terminology ([#1290](https://github.com/ceramicnetwork/js-ceramic/issues/1290)) ([2ca935e](https://github.com/ceramicnetwork/js-ceramic/commit/2ca935ec22e7c7fb2f8b96180a4a791264ab57d3))
* **common:** Remove deprecated methods named with Records instead of Commits ([#1217](https://github.com/ceramicnetwork/js-ceramic/issues/1217)) ([43fa46a](https://github.com/ceramicnetwork/js-ceramic/commit/43fa46af31f71967426aa7ed2d93eb6b213ce1d3))
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis ([#1285](https://github.com/ceramicnetwork/js-ceramic/issues/1285)) ([0dbfbf3](https://github.com/ceramicnetwork/js-ceramic/commit/0dbfbf30621ae65be9ebb1f4d52b2ddb8a29fc4c))
* **common:** Rename Doctype to Stream ([#1266](https://github.com/ceramicnetwork/js-ceramic/issues/1266)) ([4ebb6ac](https://github.com/ceramicnetwork/js-ceramic/commit/4ebb6ac50bc17e48c471cbd36c19586549736a8c))
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string ([#1286](https://github.com/ceramicnetwork/js-ceramic/issues/1286)) ([967cf11](https://github.com/ceramicnetwork/js-ceramic/commit/967cf11ec95e5cd6650bfa49fa1efd9adab85d1b))
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts ([#1229](https://github.com/ceramicnetwork/js-ceramic/issues/1229)) ([85ccbb8](https://github.com/ceramicnetwork/js-ceramic/commit/85ccbb825f6ffca0ca2524f768b0019cd5379432))
* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() ([#1196](https://github.com/ceramicnetwork/js-ceramic/issues/1196)) ([e9b3c18](https://github.com/ceramicnetwork/js-ceramic/commit/e9b3c18d8786103589dafd268cba37694811d9b9))
* **core, http-client, common:** Doctype accepts Running State ([#1150](https://github.com/ceramicnetwork/js-ceramic/issues/1150)) ([0b708d4](https://github.com/ceramicnetwork/js-ceramic/commit/0b708d44beaa86b7fa121ce0afb5a4a59344fce1))
* **core,http-client,cli:** Update config options from document to stream-based terminology ([#1249](https://github.com/ceramicnetwork/js-ceramic/issues/1249)) ([5ce0969](https://github.com/ceramicnetwork/js-ceramic/commit/5ce09692f08f3e0a9b793232b7a97e24335f4f40))
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link ([#1264](https://github.com/ceramicnetwork/js-ceramic/issues/1264)) ([ed7ee3c](https://github.com/ceramicnetwork/js-ceramic/commit/ed7ee3c5fed7e93ceb5e543da967fe50052693f6))
* **http-client:** Remove ability to pin documents in local cache in http client ([#762](https://github.com/ceramicnetwork/js-ceramic/issues/762)) ([dcf7add](https://github.com/ceramicnetwork/js-ceramic/commit/dcf7add42affc340ff58951828186c960c144f0c))
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument ([#1225](https://github.com/ceramicnetwork/js-ceramic/issues/1225)) ([ce0694b](https://github.com/ceramicnetwork/js-ceramic/commit/ce0694b8405f29a6c54a2d214599d210e6f1e4de))
* **streamid:** Rename DocID to StreamID ([#1195](https://github.com/ceramicnetwork/js-ceramic/issues/1195)) ([65754d1](https://github.com/ceramicnetwork/js-ceramic/commit/65754d17ecfbdae9f110c71de91120200a6b4ef2))
* **tile-doctype:** Update Tile API ([#1180](https://github.com/ceramicnetwork/js-ceramic/issues/1180)) ([90973ee](https://github.com/ceramicnetwork/js-ceramic/commit/90973ee32352e260cb040e687720095b145b4702))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))
* upgrade 3id did resolver ([#1108](https://github.com/ceramicnetwork/js-ceramic/issues/1108)) ([24ef6d4](https://github.com/ceramicnetwork/js-ceramic/commit/24ef6d45c6ce1dae828447ffdaa9e57f3f5e9b00))


### Reverts

* Revert "chore(release):" ([26ed474](https://github.com/ceramicnetwork/js-ceramic/commit/26ed474717edaf2a276d5ffba063054f5a12e5e2))





# [1.3.0](/compare/@ceramicnetwork/http-client@1.3.0-rc.4...@ceramicnetwork/http-client@1.3.0) (2021-09-16)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.3.0-rc.4](/compare/@ceramicnetwork/http-client@1.2.2...@ceramicnetwork/http-client@1.3.0-rc.4) (2021-09-16)


### Features

* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





# [1.3.0-rc.2](/compare/@ceramicnetwork/http-client@1.2.2...@ceramicnetwork/http-client@1.3.0-rc.2) (2021-09-16)


### Features

* **core,http-client:** Add 'publish' option to unpin command (#1706) 0ad204e, closes #1706





## [1.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.1...@ceramicnetwork/http-client@1.2.2) (2021-09-14)

**Note:** Version bump only for package @ceramicnetwork/http-client



## [1.2.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.1-rc.0...@ceramicnetwork/http-client@1.2.1) (2021-09-08)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.2.1-rc.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0...@ceramicnetwork/http-client@1.2.1-rc.0) (2021-09-02)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0-rc.7...@ceramicnetwork/http-client@1.2.0) (2021-08-25)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.2.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0-rc.6...@ceramicnetwork/http-client@1.2.0-rc.7) (2021-08-24)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.2.0-rc.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0-rc.5...@ceramicnetwork/http-client@1.2.0-rc.6) (2021-08-23)

**Note:** Version bump only for package @ceramicnetwork/http-client





# 1.2.0-rc.5 (2021-08-23)


### Bug Fixes

* **ci:** remove private flag ([9974009](https://github.com/ceramicnetwork/js-ceramic/commit/9974009be69382f2a2caf59f4ff72bf6aa12491b))





# [1.2.0-rc.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0-rc.3...@ceramicnetwork/http-client@1.2.0-rc.4) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.2.0-rc.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@1.2.0-rc.2...@ceramicnetwork/http-client@1.2.0-rc.3) (2021-08-22)

**Note:** Version bump only for package @ceramicnetwork/http-client





# 1.2.0-rc.2 (2021-08-22)


### Bug Fixes

* **ci:** remove flag from npm ci cmd ([b8ca310](https://github.com/ceramicnetwork/js-ceramic/commit/b8ca3102963096626a46a3c78c705da26e977021))





# [1.2.0-rc.1](/compare/@ceramicnetwork/http-client@1.2.0-rc.0...@ceramicnetwork/http-client@1.2.0-rc.1) (2021-08-19)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.2.0-rc.0](/compare/@ceramicnetwork/http-client@1.1.1...@ceramicnetwork/http-client@1.2.0-rc.0) (2021-08-13)


### Features

* **core:** Add API to request an anchor (#1622) 8473c6a, closes #1622





## [1.1.1](/compare/@ceramicnetwork/http-client@1.1.0-rc.2...@ceramicnetwork/http-client@1.1.1) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.1.0](/compare/@ceramicnetwork/http-client@1.1.0-rc.2...@ceramicnetwork/http-client@1.1.0) (2021-08-11)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.1.0-rc.2](/compare/@ceramicnetwork/http-client@1.1.0-rc.1...@ceramicnetwork/http-client@1.1.0-rc.2) (2021-08-03)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.1.0-rc.1](/compare/@ceramicnetwork/http-client@1.1.0-rc.0...@ceramicnetwork/http-client@1.1.0-rc.1) (2021-07-30)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.1.0-rc.0](/compare/@ceramicnetwork/http-client@1.0.8-rc.0...@ceramicnetwork/http-client@1.1.0-rc.0) (2021-07-16)


### Features

* Check signature of a lone genesis (#1529) b55e225, closes #1529
* Pass issuer to verifyJWS (#1542) 3c60b0c, closes #1542
* Pass time-information when checking a signature (#1502) 913e091, closes #1502





## [1.0.8-rc.0](/compare/@ceramicnetwork/http-client@1.0.7...@ceramicnetwork/http-client@1.0.8-rc.0) (2021-06-30)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.7](/compare/@ceramicnetwork/http-client@1.0.7-rc.0...@ceramicnetwork/http-client@1.0.7) (2021-06-22)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.7-rc.0](/compare/@ceramicnetwork/http-client@1.0.6...@ceramicnetwork/http-client@1.0.7-rc.0) (2021-06-21)


### Bug Fixes

* Flaky doc test (#1475) 5fd9f8e, closes #1475





## [1.0.6](/compare/@ceramicnetwork/http-client@1.0.5...@ceramicnetwork/http-client@1.0.6) (2021-06-06)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.5](/compare/@ceramicnetwork/http-client@1.0.4...@ceramicnetwork/http-client@1.0.5) (2021-06-03)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.4](/compare/@ceramicnetwork/http-client@1.0.4-rc.0...@ceramicnetwork/http-client@1.0.4) (2021-05-31)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.4-rc.0](/compare/@ceramicnetwork/http-client@1.0.3...@ceramicnetwork/http-client@1.0.4-rc.0) (2021-05-28)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [1.0.3](/compare/@ceramicnetwork/http-client@1.0.2...@ceramicnetwork/http-client@1.0.3) (2021-05-25)


### Bug Fixes

* **http-client:** Allow just one stream of sync http calls (#1406) f089c41, closes #1406





## [1.0.2](/compare/@ceramicnetwork/http-client@1.0.1...@ceramicnetwork/http-client@1.0.2) (2021-05-20)


### Bug Fixes

* **core,http-client:** Add setter for 'did' property on CeramicApi implmentations (#1391) 700221e, closes #1391





## [1.0.1](/compare/@ceramicnetwork/http-client@1.0.0...@ceramicnetwork/http-client@1.0.1) (2021-05-13)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.0.0](/compare/@ceramicnetwork/http-client@1.0.0-rc.6...@ceramicnetwork/http-client@1.0.0) (2021-05-06)


### Features

* http client applyCommit respects cache (#1355) 4cb0fe7, closes #1355





# [1.0.0-rc.6](/compare/@ceramicnetwork/http-client@1.0.0-rc.5...@ceramicnetwork/http-client@1.0.0-rc.6) (2021-04-29)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.0.0-rc.5](/compare/@ceramicnetwork/http-client@1.0.0-rc.4...@ceramicnetwork/http-client@1.0.0-rc.5) (2021-04-28)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.0.0-rc.4](/compare/@ceramicnetwork/http-client@1.0.0-rc.3...@ceramicnetwork/http-client@1.0.0-rc.4) (2021-04-23)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.0.0-rc.3](/compare/@ceramicnetwork/http-client@1.0.0-rc.2...@ceramicnetwork/http-client@1.0.0-rc.3) (2021-04-20)


### Bug Fixes

* Fix tests by using node environment for jest (#1212) 0f04006, closes #1212


### Features

* **common:** Change 'sync' option to an enum and refine sync behaviors (#1269) 0b652fb, closes #1269
* **common:** Miscellaneous renames from document-based to stream-based terminology (#1290) 2ca935e, closes #1290
* **common:** Remove deprecated methods named with Records instead of Commits (#1217) 43fa46a, closes #1217
* **common:** Rename createDocumentFromGenesis to createStreamFromGenesis (#1285) 0dbfbf3, closes #1285
* **common:** Update createStreamFromGenesis to take 'type' number instead of 'doctype' string (#1286) 967cf11, closes #1286
* DocState contains type as number (#1250) 56501e2, closes #1250
* **cli,http-client:** Update HTTP API to use streams terminology (#1237) 6c0a142, closes #1237
* **common:** Rename Doctype to Stream (#1266) 4ebb6ac, closes #1266
* **common,core:** Split DocOpts into CreateOpts, LoadOpts, and UpdateOpts (#1229) 85ccbb8, closes #1229
* **core, http-client:** Remove default DID Resolver and make apps provide via CeramicAPI.setDID() (#1196) e9b3c18, closes #1196
* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **core,http-client,cli:** Update config options from document to stream-based terminology (#1249) 5ce0969, closes #1249
* **doctype-tile,doctype-caip10-link:** Rename TileDoctype and Caip10LinkDoctype to TileDocument and Caip10Link (#1264) ed7ee3c, closes #1264
* **http-client, cli:** Enable specifying DocOpts in CeramicClient.loadDocument (#1225) ce0694b, closes #1225
* **streamid:** Rename DocID to StreamID (#1195) 65754d1, closes #1195
* **tile-doctype:** Update Tile API (#1180) 90973ee, closes #1180





# [1.0.0-rc.2](/compare/@ceramicnetwork/http-client@1.0.0-rc.1...@ceramicnetwork/http-client@1.0.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [1.0.0-rc.1](/compare/@ceramicnetwork/http-client@0.11.0-rc.3...@ceramicnetwork/http-client@1.0.0-rc.1) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.11.0-rc.3](/compare/@ceramicnetwork/http-client@0.11.0-rc.2...@ceramicnetwork/http-client@0.11.0-rc.3) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.11.0-rc.2](/compare/@ceramicnetwork/http-client@0.10.1...@ceramicnetwork/http-client@0.11.0-rc.2) (2021-04-19)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.11.0-rc.1](/compare/@ceramicnetwork/http-client@0.10.1...@ceramicnetwork/http-client@0.11.0-rc.1) (2021-04-02)


### Features

* **core, http-client, common:** Doctype accepts Running State (#1150) 0b708d4, closes #1150
* **tile-doctype:** Update Tile API 48f30e1





## [0.10.1](/compare/@ceramicnetwork/http-client@0.10.0...@ceramicnetwork/http-client@0.10.1) (2021-04-02)


### Bug Fixes

* **common, logger:** Clean up dependencies (#1164) 191ad31, closes #1164





## [0.10.1-rc.4](/compare/@ceramicnetwork/http-client@0.10.0...@ceramicnetwork/http-client@0.10.1-rc.4) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.10.1-rc.3](/compare/@ceramicnetwork/http-client@0.10.0...@ceramicnetwork/http-client@0.10.1-rc.3) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.10.1-rc.2](/compare/@ceramicnetwork/http-client@0.10.0...@ceramicnetwork/http-client@0.10.1-rc.2) (2021-03-26)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.10.1-rc.1](/compare/@ceramicnetwork/http-client@0.10.1-rc.0...@ceramicnetwork/http-client@0.10.1-rc.1) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.10.1-rc.0](/compare/@ceramicnetwork/http-client@0.10.0...@ceramicnetwork/http-client@0.10.1-rc.0) (2021-03-25)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0](/compare/@ceramicnetwork/http-client@0.10.0-rc.11...@ceramicnetwork/http-client@0.10.0) (2021-03-22)


### Bug Fixes

* **http-client:** Don't use the logger in the http-client (#1138) 0dfdb27, closes #1138


### Features

* **3id-did-resolver:** did metadata resolution (#1139) 818bde1, closes #1139





# [0.10.0-rc.11](/compare/@ceramicnetwork/http-client@0.10.0-rc.10...@ceramicnetwork/http-client@0.10.0-rc.11) (2021-03-15)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.10](/compare/@ceramicnetwork/http-client@0.10.0-rc.9...@ceramicnetwork/http-client@0.10.0-rc.10) (2021-03-12)


### Features

* upgrade 3id did resolver (#1108) 24ef6d4, closes #1108





# [0.10.0-rc.9](/compare/@ceramicnetwork/http-client@0.10.0-rc.8...@ceramicnetwork/http-client@0.10.0-rc.9) (2021-03-10)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.8](/compare/@ceramicnetwork/http-client@0.10.0-rc.6...@ceramicnetwork/http-client@0.10.0-rc.8) (2021-03-09)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.9.6...@ceramicnetwork/http-client@0.10.0-rc.7) (2021-02-25)


### Features

* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig ([#1021](https://github.com/ceramicnetwork/js-ceramic/issues/1021)) ([a53c534](https://github.com/ceramicnetwork/js-ceramic/commit/a53c534f89baab0b2a31cc8cbe9694efcc5cfa3f))
* Unbundle DocID into DocID and CommitID ([#1009](https://github.com/ceramicnetwork/js-ceramic/issues/1009)) ([c2707f2](https://github.com/ceramicnetwork/js-ceramic/commit/c2707f212a9d23c88525b667944d24210e192f80))





# [0.10.0-rc.6](/compare/@ceramicnetwork/http-client@0.10.0-rc.5...@ceramicnetwork/http-client@0.10.0-rc.6) (2021-02-24)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.5](/compare/@ceramicnetwork/http-client@0.10.0-rc.3...@ceramicnetwork/http-client@0.10.0-rc.5) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.4](/compare/@ceramicnetwork/http-client@0.10.0-rc.3...@ceramicnetwork/http-client@0.10.0-rc.4) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.3](/compare/@ceramicnetwork/http-client@0.10.0-rc.2...@ceramicnetwork/http-client@0.10.0-rc.3) (2021-02-23)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.2](/compare/@ceramicnetwork/http-client@0.10.0-rc.0...@ceramicnetwork/http-client@0.10.0-rc.2) (2021-02-22)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.10.0-rc.0](/compare/@ceramicnetwork/http-client@0.9.6...@ceramicnetwork/http-client@0.10.0-rc.0) (2021-02-22)


### Features

* **core:** Clean up Ceramic.create() and accept LoggerProvider in CeramicConfig (#1021) a53c534, closes #1021
* Unbundle DocID into DocID and CommitID (#1009) c2707f2, closes #1009





## [0.9.6](/compare/@ceramicnetwork/http-client@0.9.6-rc.0...@ceramicnetwork/http-client@0.9.6) (2021-02-04)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.6-rc.0](/compare/@ceramicnetwork/http-client@0.9.5...@ceramicnetwork/http-client@0.9.6-rc.0) (2021-01-29)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.5](/compare/@ceramicnetwork/http-client@0.9.4...@ceramicnetwork/http-client@0.9.5) (2021-01-21)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.9.3...@ceramicnetwork/http-client@0.9.4) (2021-01-21)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.3](/compare/@ceramicnetwork/http-client@0.9.2...@ceramicnetwork/http-client@0.9.3) (2021-01-18)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.2](/compare/@ceramicnetwork/http-client@0.9.1...@ceramicnetwork/http-client@0.9.2) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.9.1](/compare/@ceramicnetwork/http-client@0.9.0...@ceramicnetwork/http-client@0.9.1) (2021-01-13)

**Note:** Version bump only for package @ceramicnetwork/http-client





# [0.9.0](/compare/@ceramicnetwork/http-client@0.8.12...@ceramicnetwork/http-client@0.9.0) (2021-01-13)


### Bug Fixes

* **cli,http-client:** Fix pin API in CLI and http client (#752) 20fcd75, closes #752


### Features

* **http-client:** Remove ability to pin documents in local cache in http client (#762) dcf7add, closes #762





## [0.8.12](/compare/@ceramicnetwork/http-client@0.8.11...@ceramicnetwork/http-client@0.8.12) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.11](/compare/@ceramicnetwork/http-client@0.8.10...@ceramicnetwork/http-client@0.8.11) (2021-01-07)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.9...@ceramicnetwork/http-client@0.8.10) (2020-12-29)


### Bug Fixes

* **http-client:** reload cached documents ([#719](https://github.com/ceramicnetwork/js-ceramic/issues/719)) ([6bc7dbf](https://github.com/ceramicnetwork/js-ceramic/commit/6bc7dbff31eaccfdbcb960effd850f069eb0d538))





## [0.8.9](/compare/@ceramicnetwork/http-client@0.8.8...@ceramicnetwork/http-client@0.8.9) (2020-12-23)


### Reverts

* Revert "chore(release):" 26ed474





## [0.8.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.8-alpha.0...@ceramicnetwork/http-client@0.8.8) (2020-12-17)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.8-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.7...@ceramicnetwork/http-client@0.8.8-alpha.0) (2020-12-14)


### Bug Fixes

* CID version fix ([#638](https://github.com/ceramicnetwork/js-ceramic/issues/638)) ([a4f4390](https://github.com/ceramicnetwork/js-ceramic/commit/a4f4390ea561e991cae93dd26b9b122d10caef32))





## [0.8.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.6...@ceramicnetwork/http-client@0.8.7) (2020-12-09)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.5...@ceramicnetwork/http-client@0.8.6) (2020-12-08)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.4...@ceramicnetwork/http-client@0.8.5) (2020-12-03)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.3...@ceramicnetwork/http-client@0.8.4) (2020-12-01)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.2...@ceramicnetwork/http-client@0.8.3) (2020-11-30)

**Note:** Version bump only for package @ceramicnetwork/http-client





## [0.8.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.1...@ceramicnetwork/http-client@0.8.2) (2020-11-30)


### Bug Fixes

* **client:** fix resolver construction ([#549](https://github.com/ceramicnetwork/js-ceramic/issues/549)) ([f23ff93](https://github.com/ceramicnetwork/js-ceramic/commit/f23ff938e92e2f835f613e8e3162fe7795194ebf))





## [0.8.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/http-client@0.8.0...@ceramicnetwork/http-client@0.8.1) (2020-11-26)

**Note:** Version bump only for package @ceramicnetwork/http-client





# 0.8.0 (2020-11-24)


### Bug Fixes

* fix merged conflicts ([ca20353](https://github.com/ceramicnetwork/js-ceramic/commit/ca20353da20038fdf6aab710f1a518bd0bd21e4d))


### Features

* **core:** Add chainId to genesis header ([#509](https://github.com/ceramicnetwork/js-ceramic/issues/509)) ([f916e63](https://github.com/ceramicnetwork/js-ceramic/commit/f916e633fcd61ad8fae8e1ac634f347b77302f06))
* **core:** Break up and rename DocOpts args ([#527](https://github.com/ceramicnetwork/js-ceramic/issues/527)) ([13ed725](https://github.com/ceramicnetwork/js-ceramic/commit/13ed7254db0fe467165098b2f3e2825cb5baa6fb))
* **core:** Remove doctype from genesis record ([#486](https://github.com/ceramicnetwork/js-ceramic/issues/486)) ([fbd68df](https://github.com/ceramicnetwork/js-ceramic/commit/fbd68df4664981a46596feffa68f85da742fbad2))
* **core:** Rename several packages to remove redundant "ceramic-" prefix ([#460](https://github.com/ceramicnetwork/js-ceramic/issues/460)) ([8a86fb6](https://github.com/ceramicnetwork/js-ceramic/commit/8a86fb68b5f895f64e79a2585a5f854dd6c42088))





## [0.7.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.3-alpha.0...@ceramicnetwork/ceramic-http-client@0.7.3) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.7.3-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.2...@ceramicnetwork/ceramic-http-client@0.7.3-alpha.0) (2020-11-20)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.7.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.1...@ceramicnetwork/ceramic-http-client@0.7.2) (2020-11-11)


### Bug Fixes

* bump IDW dep, fix Dockerfile ([#474](https://github.com/ceramicnetwork/js-ceramic/issues/474)) ([79b39a4](https://github.com/ceramicnetwork/js-ceramic/commit/79b39a4e7212c22991805ae1b93f10b3d146d540))





## [0.7.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.1-alpha.1...@ceramicnetwork/ceramic-http-client@0.7.1) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.7.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.1-alpha.0...@ceramicnetwork/ceramic-http-client@0.7.1-alpha.1) (2020-10-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.7.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.0...@ceramicnetwork/ceramic-http-client@0.7.1-alpha.0) (2020-10-27)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





# [0.7.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.7.0-alpha.0...@ceramicnetwork/ceramic-http-client@0.7.0) (2020-10-26)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





# [0.7.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.6-alpha.0...@ceramicnetwork/ceramic-http-client@0.7.0-alpha.0) (2020-10-26)


### Features

* docids support ([1e48e9e](https://github.com/ceramicnetwork/js-ceramic/commit/1e48e9e88090463f27f831f4b47a3fab30ba8c5e))





## [0.6.6-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.5...@ceramicnetwork/ceramic-http-client@0.6.6-alpha.0) (2020-10-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.5-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.5) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.4...@ceramicnetwork/ceramic-http-client@0.6.5-alpha.0) (2020-10-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.4-alpha.1...@ceramicnetwork/ceramic-http-client@0.6.4) (2020-10-07)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.4-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.4-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.4-alpha.1) (2020-10-06)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.4-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.3...@ceramicnetwork/ceramic-http-client@0.6.4-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.3-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.3) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.3-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.2-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.3-alpha.0) (2020-10-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.2-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.2) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client



## [0.6.2-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.2-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.2-alpha.1) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client



## [0.6.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.1-alpha.1...@ceramicnetwork/ceramic-http-client@0.6.2-alpha.0) (2020-09-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.6.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.1-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client



## [0.6.1-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.1-alpha.0...@ceramicnetwork/ceramic-http-client@0.6.1-alpha.1) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client


## [0.6.1-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.6.0...@ceramicnetwork/ceramic-http-client@0.6.1-alpha.0) (2020-09-25)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





# [0.6.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.14...@ceramicnetwork/ceramic-http-client@0.6.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





# [0.6.0-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.14...@ceramicnetwork/ceramic-http-client@0.6.0-alpha.0) (2020-09-25)


### Features

* implement initial key-did-resolver module ([#321](https://github.com/ceramicnetwork/js-ceramic/issues/321)) ([472283f](https://github.com/ceramicnetwork/js-ceramic/commit/472283f8419dd51c4725b77083df43abeb9ee387))
* remove 3id doctype ([#323](https://github.com/ceramicnetwork/js-ceramic/issues/323)) ([fdbd0ed](https://github.com/ceramicnetwork/js-ceramic/commit/fdbd0ed66a01f9521f631967b4438396ce197ace))





## [0.5.14](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.14-alpha.1...@ceramicnetwork/ceramic-http-client@0.5.14) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.14-alpha.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.14-alpha.0...@ceramicnetwork/ceramic-http-client@0.5.14-alpha.1) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.14-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.13...@ceramicnetwork/ceramic-http-client@0.5.14-alpha.0) (2020-09-17)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.13](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.13-alpha.0...@ceramicnetwork/ceramic-http-client@0.5.13) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.13-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.12...@ceramicnetwork/ceramic-http-client@0.5.13-alpha.0) (2020-09-16)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.12](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.11...@ceramicnetwork/ceramic-http-client@0.5.12) (2020-09-11)


### Bug Fixes

* **http-client:** return correct doc instance from createDocument ([#287](https://github.com/ceramicnetwork/js-ceramic/issues/287)) ([64ca4f5](https://github.com/ceramicnetwork/js-ceramic/commit/64ca4f55100cd259f51002254aa6a4f528c60c63))





## [0.5.12-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.11...@ceramicnetwork/ceramic-http-client@0.5.12-alpha.0) (2020-09-11)


### Bug Fixes

* **http-client:** return correct doc instance from createDocument ([#287](https://github.com/ceramicnetwork/js-ceramic/issues/287)) ([64ca4f5](https://github.com/ceramicnetwork/js-ceramic/commit/64ca4f55100cd259f51002254aa6a4f528c60c63))





## [0.5.11](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.11-alpha.0...@ceramicnetwork/ceramic-http-client@0.5.11) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.11-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.10...@ceramicnetwork/ceramic-http-client@0.5.11-alpha.0) (2020-09-09)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.10](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.9...@ceramicnetwork/ceramic-http-client@0.5.10) (2020-09-04)


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.10-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.9...@ceramicnetwork/ceramic-http-client@0.5.10-alpha.0) (2020-09-04)


### Reverts

* Revert "chore(deps): bump cids from 0.8.3 to 1.0.0 (#204)" ([d29a032](https://github.com/ceramicnetwork/js-ceramic/commit/d29a032726a4beec5fa12fba528b2d520b4ca690)), closes [#204](https://github.com/ceramicnetwork/js-ceramic/issues/204)





## [0.5.9](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.9-alpha.0...@ceramicnetwork/ceramic-http-client@0.5.9) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.9-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.8...@ceramicnetwork/ceramic-http-client@0.5.9-alpha.0) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.7...@ceramicnetwork/ceramic-http-client@0.5.8) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.3...@ceramicnetwork/ceramic-http-client@0.5.7) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.3...@ceramicnetwork/ceramic-http-client@0.5.6) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.3...@ceramicnetwork/ceramic-http-client@0.5.5) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.3...@ceramicnetwork/ceramic-http-client@0.5.4) (2020-09-01)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.2...@ceramicnetwork/ceramic-http-client@0.5.3) (2020-08-31)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.5.2-alpha.0...@ceramicnetwork/ceramic-http-client@0.5.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.5.2-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@5.0.2...@ceramicnetwork/ceramic-http-client@0.5.2-alpha.0) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [5.0.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@5.0.1...@ceramicnetwork/ceramic-http-client@5.0.2) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [5.0.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.4.0...@ceramicnetwork/ceramic-http-client@5.0.1) (2020-08-28)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





# [0.4.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.8...@ceramicnetwork/ceramic-http-client@0.4.0) (2020-08-28)


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





# [0.3.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.8...@ceramicnetwork/ceramic-http-client@0.3.0) (2020-08-28)


### Features

* **cli:** enable js-ipfs ([#231](https://github.com/ceramicnetwork/js-ceramic/issues/231)) ([84fba0c](https://github.com/ceramicnetwork/js-ceramic/commit/84fba0c7deb36a1b75646282be2e7fef3840a53a))





## [0.2.8](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.7...@ceramicnetwork/ceramic-http-client@0.2.8) (2020-08-05)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.7](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.6...@ceramicnetwork/ceramic-http-client@0.2.7) (2020-07-21)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.6](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.5...@ceramicnetwork/ceramic-http-client@0.2.6) (2020-07-21)


### Bug Fixes

* fix conflicts with master ([1077bdb](https://github.com/ceramicnetwork/js-ceramic/commit/1077bdb81ce10bfeafa5a53922eb93dfcf4b23f6))
* **cli:** fix pin call ([#156](https://github.com/ceramicnetwork/js-ceramic/issues/156)) ([9e1f7b5](https://github.com/ceramicnetwork/js-ceramic/commit/9e1f7b5597a28649c4a2e64b32b5d7663c6539d0))


### Features

* document versioning ([#176](https://github.com/ceramicnetwork/js-ceramic/issues/176)) ([5c138f0](https://github.com/ceramicnetwork/js-ceramic/commit/5c138f0ecd3433ef364b9a266607263ee97526d1))





## [0.2.5](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.5-alpha.0...@ceramicnetwork/ceramic-http-client@0.2.5) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.5-alpha.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.4...@ceramicnetwork/ceramic-http-client@0.2.5-alpha.0) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.4](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.3...@ceramicnetwork/ceramic-http-client@0.2.4) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.3](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.2...@ceramicnetwork/ceramic-http-client@0.2.3) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





## [0.2.2](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.1...@ceramicnetwork/ceramic-http-client@0.2.2) (2020-07-13)


### Bug Fixes

* **account-template:** fix import ([3a660d7](https://github.com/ceramicnetwork/js-ceramic/commit/3a660d72f654d7614f207587b5086888c9da6273))





## [0.2.1](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.2.0...@ceramicnetwork/ceramic-http-client@0.2.1) (2020-07-13)

**Note:** Version bump only for package @ceramicnetwork/ceramic-http-client





# [0.2.0](https://github.com/ceramicnetwork/js-ceramic/compare/@ceramicnetwork/ceramic-http-client@0.1.0...@ceramicnetwork/ceramic-http-client@0.2.0) (2020-04-17)


### Bug Fixes

* **http-client:** support CIDs ([f4cd0bd](https://github.com/ceramicnetwork/js-ceramic/commit/f4cd0bdcd8dcb4808e95e653b9a91a455b914cc2))
* on createDocument, return copy in _docmap ([#37](https://github.com/ceramicnetwork/js-ceramic/issues/37)) ([d978e2d](https://github.com/ceramicnetwork/js-ceramic/commit/d978e2d26a5f4335a0e7b96370ea3bfa3640ae9b))


### Features

* **cli:** add cli dockerfile, add ipfs-api daemon option ([#34](https://github.com/ceramicnetwork/js-ceramic/issues/34)) ([2822cb4](https://github.com/ceramicnetwork/js-ceramic/commit/2822cb4df0e2c4cdd9c9111100551191ceb85e86))





# 0.1.0 (2020-04-08)


### Features

* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))





# 0.1.0-alpha.0 (2020-04-07)


### Features

* add account link doctype ([#11](https://github.com/ceramicnetwork/js-ceramic/issues/11)) ([f9778c9](https://github.com/ceramicnetwork/js-ceramic/commit/f9778c90eaf4da2bbecfdc0d9fd6dfa0adbdb2d2))
