import { EthereumAnchorValidator } from '../ethereum-anchor-validator'
import {
    LoggerProvider,
    DiagnosticsLogger
} from '@ceramicnetwork/common'
import ganache from "ganache"
import { CID } from 'multiformats/cid'
import * as uint8arrays from 'uint8arrays'
import { create as createMultihash } from 'multiformats/hashes/digest'
import { ethers } from 'ethers'
import * as fs from 'fs';
import { jest } from '@jest/globals'

const KECCAK_256_CODE = 0x1b
const ETH_TX_CODE = 0x93

let ganacheServer: Ganache.Server = null

jest.setTimeout(30000)

describe('ETH Anchor Service Validation', () => {
    test(
        'Validate Anchor Version 0',

        async () => {
            const loggerProvider = new LoggerProvider()
            const _logger = loggerProvider.getDiagnosticsLogger()
            const DEFAULT_LOCAL_ETHEREUM_RPC = 'http://localhost:8545' // default Ganache port
            const ethereumRpcUrl = DEFAULT_LOCAL_ETHEREUM_RPC
            let e = new EthereumAnchorValidator(_logger, DEFAULT_LOCAL_ETHEREUM_RPC)
            const startTime = new Date(1586784002000)
            const g = ganache.server({
                gasLimit: 7000000,
                time: startTime,
                mnemonic: 'move sense much taxi wave hurry recall stairs thank brother nut woman',
                default_balance_ether: 100,
                debug: true,
                blockTime: 2,
                network_id: 1337,
            })
            let hash = "0x49bfc57020d964b38dda48ef7330a5586cf47bb27ee782b1932e818fe6e58c67"
            const bytes = Buffer.from(hash, 'hex')
            const multihash = createMultihash(KECCAK_256_CODE, bytes)
            const cidVersion = 1
            let cid = CID.create(cidVersion, ETH_TX_CODE, multihash)
            let root = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
            console.log(cid)
            console.log(root)
            console.log("before proof")
            const anchorProof = {
                blockNumber: 123456,
                blockTimestamp: 1615799679,
                chainId: 'eip155:1337',
                txhash: cid,
                root: root
              }
            console.log(anchorProof)
            e.validateChainInclusion(anchorProof)
        }
    )

    test(
        'Validate Anchor Version 1',
        async () => {
            const loggerProvider = new LoggerProvider()
            const _logger = loggerProvider.getDiagnosticsLogger()
            const DEFAULT_LOCAL_ETHEREUM_RPC = 'http://localhost:8545' // default Ganache port
            const ethereumRpcUrl = DEFAULT_LOCAL_ETHEREUM_RPC
            // let e = new EthereumAnchorValidator(_logger, DEFAULT_LOCAL_ETHEREUM_RPC)
            let e = new EthereumAnchorValidator(DEFAULT_LOCAL_ETHEREUM_RPC, _logger)
            const startTime = new Date(1586784002000)

            let mnemonic = 'move sense much taxi wave hurry recall stairs thank brother nut woman';
            let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
            const privKey = mnemonicWallet.privateKey
            console.log("private key")
            console.log(privKey);

            const g = ganache.server({
                gasLimit: 7000000,
                time: startTime,
                mnemonic: mnemonic,
                default_balance_ether: 100,
                debug: true,
                blockTime: 2,
                network_id: 1337
            })

            g.listen(8545)

            const options = {};

            // var privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
            const privateKey = privKey
            var wallet = new ethers.Wallet(privateKey);
            let p = new ethers.providers.JsonRpcProvider("http://localhost:8545");
            let walletWithProvider = new ethers.Wallet(privateKey, p);
            console.log("Address: " + wallet.address);

            ///////////////////////
            const metadata = JSON.parse( fs.readFileSync('/Users/0xjovi/Documents/projects/js-ceramic/packages/core/src/anchor/ethereum/CeramicAnchorServiceV2.json' ).toString())
            console.log("meta")
            console.log(metadata)
            console.log(metadata.abi)
            console.log(metadata.bytecode)
            console.log(Object.keys(metadata))
            console.log("^^^^^^metadata^^^^^^^")
            console.log(Object.keys(metadata))
            // const factory = new ethers.ContractFactory(metadata.abi, metadata.data.bytecode.object, wallet)
            const factory = new ethers.ContractFactory(metadata.abi, metadata.bytecode.object, walletWithProvider)
            const contract = await factory.deploy(options)
            const deployedContract = await contract.deployed()
            console.log("AFTER CONTRACT DEPLOYMENT")
            console.log(deployedContract.address)
            // const getAccountsAddress = await new ethers.Contract(JSON.parse(ABI))
            // .deploy({
            //     data: '0x' + bytecode, arguments: [initialString]
            // })
            // .send({from:accounts[0],gas:'1000000'});
            ////////////////////////////


            let encodedFunctionSignature = ethers.utils.abi.encodeFunctionSignature('anchor(bytes)');
            console.log(encodedFunctionSignature);
            // => 0xc48d6d5e

            let tx = {
                // to: "0x6E0d01A76C3Cf4288372a29124A26D4353EE51BE",
                to: deployedContract.address,
                value: ethers.utils.parseEther("0.0"),
                gasLimit: 1000000,
                gasPrice: "0x07f9acf02",
                nonce: 1,
                chainId: 1337,
                data: "0xf8660184000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000260f0185011220033574b823700603882cb47e253380a42a693189b579ab4e03e134e48457be140000000000000000000000000000000000000000000000000000"
            }

            // wallet.signTransaction(tx).then(async (signedTX)=>{
            const signedTx = await walletWithProvider.signTransaction(tx) 
            console.log("signedTX")
            console.log(signedTx)
            const sentTx = await g.provider.request({
                method: "eth_sendRawTransaction",
                params: [signedTx]
            });
            console.log(sentTx)
            console.log("^^^^^^sentTx^^^^^^^")

            // let hash = "0x49bfc57020d964b38dda48ef7330a5586cf47bb27ee782b1932e818fe6e58c67"
            let hash = sentTx

            const bytes = Buffer.from(hash.slice(2), 'hex')
            console.log("bytes")
            console.log(bytes)
            const multihash = createMultihash(KECCAK_256_CODE, bytes)
            console.log("multihash")
            console.log(multihash)
            const cidVersion = 1
            let cid = CID.create(cidVersion, ETH_TX_CODE, multihash)
            


            let root = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
            console.log(cid)
            console.log(root)
            console.log(hash)
            const anchorProof = {
                blockNumber: 123456,
                blockTimestamp: 1615799679,
                chainId: 'eip155:1337',
                // txhash: hash,
                txHash: cid,
                root: root,
                version: 1
            }        

            await e.validateChainInclusion(anchorProof)
            
        }
    )
})  
