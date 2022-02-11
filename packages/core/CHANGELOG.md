# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.13.2](/compare/@ceramicnetwork/core@1.13.1-rc.3...@ceramicnetwork/core@1.13.2) (2022-02-11)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.13.1-rc.3](/compare/@ceramicnetwork/core@1.13.1-rc.1...@ceramicnetwork/core@1.13.1-rc.3) (2022-02-09)

**Note:** Version bump only for package @ceramicnetwork/core





## [1.13.1-rc.1](/compare/@ceramicnetwork/core@1.13.1-rc.0...@ceramicnetwork/core@1.13.1-rc.1) (2022-02-09)

**Note:** Version bump only for package @ceramicnetwork/core





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
