# StarkNet Box
- [Requirement](#requirements)
- [Installation](#installation)
- [Setup](#setup)
  - [Configuration](#configuration)
  - [Directory Structure for Artifacts](#directory-structure-for-artifacts)
- [StarkNet](#starknet)
  - [Networks](#networks)
  - [Accounts](#accounts)
  - [Compiling](#compiling)
  - [Deploying](#deploying)
- [Basic Commands](#basic-commands)
  - [Testing](#testing)
  - [Communication between StarkNet Layer 1 and Layer 2](#communication-between-starknet-layer-1-and-layer-2)
- [StarkNet Devnet](#starknet-devnet)
  - [Using Devnet](#using-devnet)
  - [Starting Devnet](#starting-devnet)
  - [Deploying a contract](#deploying-a-contract)
  - [Querying transaction status](#querying-transaction-status)
  - [Invoking a contract function](#invoking-a-contract-function)
  - [Calling a contract function](#calling-a-contract-function)
  - [Stopping Devnet](#stopping-devnet)
- [Support](#support)

This Truffle StarkNet Box provides you with the boilerplate structure necessary to start coding for StarkWare's Ethereum L2 solution, StarNet. StarkNet is a permissionless decentralized Validity-Rollup (also known as a "ZK-Rollup"). For detailed information on StarkNet, please see their documentation [here](https://starknet.io/).

This box provides a simple Cairo contract. The same contract found in the [Hello, StarkNet tutorial](https://starknet.io/docs/hello_starknet/intro.html#your-first-contract). This box will allow you to compile the StarkNet contract and then deploy it to StarkNet Alpha on the Goerli test network. The Box is configured to use the Cairo version 0.7.0 for contract compilation and deployment. A sample test script is also provided which simulates a StarkNet system and runs tests with the [pytest](https://docs.pytest.org/en/6.2.x/) testing framework.
## Requirements
The StarkNet Box has the following requirements:
- [Node.js](https://nodejs.org/) 14.18.2 or later
- [NPM](https://docs.npmjs.com/cli/) version 6.14.15 or later
- [docker](https://docs.docker.com/get-docker/), version 20.10.10 or later
- Recommended Docker memory allocation of >=8 GB.
- Windows, MacOS or Linux

**Important Note:** The scripts included in this Box rely on Docker being available and running. On Linux you may need to have Docker configured to [run the Docker daemon in 'rootless' mode](https://docs.docker.com/engine/security/rootless/).
 
## Installation

Note that this installation command will only work once the box is published (in the interim you can use `truffle unbox https://github.com/truffle-box/starknet-box`).

```bash
truffle unbox starknet
```
## Setup
### Configuration
Included with this Box is a StarkNet configuration file: `truffle-config.starknet.js`. This file contains a reference to the new file location of the contracts_build_directory and contracts_directory for StarkNet contracts, and the starknet_accounts_directory where the box will store keys for StarkNet accounts used during development. It also configures the StarkNet network on Goerli Testnet as the network to which compiled contracts will be deployed. The StarkNet Devnet, development network, is also configured here. This box is configured to use [Shard Labs' StarkNet devnet docker container](https://github.com/Shard-Labs/starknet-devnet).

Please note, the classic truffle-config.js configuration file is included here as well, because you will eventually want to deploy contracts to Ethereum as well. All normal truffle commands (truffle compile, truffle migrate, etc.) will use this config file and save built files to build/ethereum-contracts. You can save Solidity contracts that you wish to deploy to Ethereum in the contracts/ethereum folder.
### Directory Structure for Artifacts
When you compile StarkNet contracts, the resulting json files will be at build/starknet-contracts/. This is to distinguish them from any Ethereum contracts you build, which will live in build/ethereum-contracts. As we have included the appropriate contracts_build_directory in each configuration file, Truffle will know which set of built files to reference!
## StarkNet
The following commands will use the `truffle-config.starknet.js` configuration file. Each command makes use of a docker image built to provide the Cairo compiler without the need for setting up a Python development environment. The scripts will first query docker for a local copy of the image, and if it isn't found will attempt to pull the image from a Docker Hub repository. The Docker container resulting from running the image should be removed after an operation is complete.

### Networks
StarkNet, by default, defines two networks `alpha-goerli` and `alpha-mainnet`. In this box, networks are configured in the `truffle-config.starknet.js` configuration file. For example:
```bash
  networks: {
    testnet: {
      network_id: "alpha-goerli",
    },
    mainnet: {
      network_id: "alpha-mainnet"
    },
    devnet: {
      network_id: "devnet",
      gateway_url: "http://starknet-devnet:5000/gateway/",
      feeder_gateway_url: "http://starknet-devnet:5000/feeder_gateway/"
    },
    default: {
      network: "testnet",
    },
  },
```
A default network may also be configured. The default network is simply a reference to another network that has been configured and which the user wishes to use as the default network for all commands. A network can be specified on the command-line by using the `--network` argument. For example:
```bash
npm run starknet:deploy_account --network=testnet
```
If the `--network` argument is not supplied the default network will be used as the target for the command. If no default network is specified in the configuration the `alpha-goerli` network will be used.
### Accounts
Externally-owned (user) accounts on StarkNet differ from those of the Ethereum network. A StarkNet account requires the deployment of an account contract to the StarkNet network. The StarkNet CLI provides a simple method of deploying an account contract for development purposes. This currently uses the [OpenZeppelin Cairo account contract](https://github.com/OpenZeppelin/cairo-contracts/blob/main/contracts/Account.cairo). The `truffle-config.starknet.js` configuration file defines a location for storing account information for accounts deployed while using the box. By default this is the ./starknet_accounts directory. **You should ensure that this directory is included in your project's .gitignore file to avoid accidentally commiting your account keys to a public source code repository.**

Accounts deployed with this box have their own location and configuration seperate to any other StarkNet accounts that you may have deployed in another StarkNet environment. Currently, this box only supports the deployment of a single default account which will be used for any interactions where an account is necessary or desirable.

**WARNING: never use an account deployed with the StarkNet CLI in production as its private key is stored on your system in plaintext. It can be easily compromised and your funds stolen.**

To deploy a StarkNet account, run the following command in your terminal:
```bash
npm run starknet:deploy_account
```
or, you may specify a network target with the `--network` argument:
```bash
npm run starknet:deploy_account --network=testnet
```
### Compiling
To compile your StarkNet contracts using the Cairo compiler, run the following in your terminal:
```bash
npm run starknet:compile
```
### Deploying
To deploy your compiled StarkNet contracts, run the following in your terminal:
```bash
npm run starknet:deploy <contract_name>
```
or, you may specify a network target with the `--network` argument:
```bash
npm run starknet:deploy <contract_name> --network=testnet
```
## Basic Commands
The code here will allow you to compile, deploy, and test your code against a simulation of a StarkNet network. The following commands can be run:

To deploy an account:
```bash
npm run starknet:deploy_account
```
To compile:
```bash
npm run starknet:compile
```
To deploy:
```bash
npm run starknet:deploy <contract_name>
```
To test:
```bash
npm run starknet:test
```
### Testing
Currently, this box supports testing via the [pytest](https://docs.pytest.org/en/6.2.x/) testing framework. The test script makes use of StarkNet's unit testing framework to instantiate a local simulation of a StarkNet network against which unit tests can be run. In order to run the test provided in the boilerplate, use the following command:
```bash
npm run starknet:test
``` 
### Communication between StarkNet Layer 1 and Layer 2
The information above should allow you to deploy to the StarkNet Layer 2 network. This is only the first step! Once you are ready to deploy your own contracts on Layer 1 to interact with contracts on Layer 2, you will need to be aware of the ways in which Layer 1 and Layer 2 are able to interact in the StarkNet ecosystem. Keep an eye out for additional Truffle tooling and examples that elucidate this second step to full StarkNet integration!

## StarkNet Devnet
This box includes support for using the [Shard Labs StarkNet devnet docker image](https://github.com/Shard-Labs/starknet-devnet) for development testing.
 
**Important note:** Devnet should not be used in substitution for testing on Alpha testnet (Goerli). Devnet is useful for testing during development. However, Devnet hash calculations for transactions and blocks differ from those used on Alpha testnet. Be sure to test your contracts on Alpha testnet.
### Using Devnet
Once Devnet is started, you can deploy your contracts to it. Most of the StarkNet cli commands can then be used to interact with Devnet and your deployed contracts. You should note that Devnet, once started, will continue to run until stopped. As Devnet runs as a Docker container it must be stopped by docker as it will continue to run after you quit from Devnet's console. Further details on that follow below.
### Starting Devnet
To start Devnet, in a new terminal window navigate to your project's root directory and type the following command:
```bash
npm run starknet:start_devnet
```
This will run a Docker container named `starknet-devnet` from the Devnet image. If the Devnet image is not already present on your system an attempt will be made to pull it from the Docker Hub before being run. Once the container is running you should see console output similar to this:
```bash
> starknet-box@0.0.1 starknet:start_devnet /Users/username/dev/tarknet-box
> node ./scripts/start_devnet.mjs

 * Running on all addresses.
   WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://172.17.0.2:5000/ (Press CTRL+C to quit)
```
Despite the output in the console, the Devnet network will be available on http://127.0.0.1:5000/

When using Devnet rather that Alpha testnet, you must use the StarkNet cli gateway arguments rather than the --network argument or a STARKNET_NETWORK environment variable. At the time of writing this, account contracts were not yet implemented on Devnet, so you must also use the --no_wallet argument. Some examples are set out below. 

Once your Devnet is up and running as above, you can begin to interact with it by deploying your contracts and invoking and calling your contract functions. The following examples use the StarkNet cli to interact with Devnet. 
### Deploying a contract
```bash
npm run starknet:deploy <contract_name> --network=devnet
```
Output simlar to the following should then be displayed in the console:
```bash
Deploy transaction was sent.
Contract address: 0x040ac735fce2af86b335ac0db11ddf1d9d956cc577f02cf0ea6ed8c06119cdce
Transaction hash: 0x071f88ab03ea54985f1167d81eb59be023714cfcff6ab01a943e98fee27f5d0e
```
In the Devnet console, output similar to the following should be displayed:
```bash
192.168.176.3 - - [31/Mar/2022 05:55:16] "POST /gateway/add_transaction HTTP/1.1" 200 -
```
### Querying transaction status
```bash
starknet tx_status --no_wallet \
--gateway_url http://127.0.0.1:5000/gateway/ \
--feeder_gateway_url http://127.0.0.1:5000/feeder_gateway/ \
--hash 0x071f88ab03ea54985f1167d81eb59be023714cfcff6ab01a943e98fee27f5d0e
```
Again, the Devnet console will display output similar to the following:
```bash
192.168.176.3 - - [22/Feb/2022 04:02:46] "GET /feeder_gateway/get_transaction_status?transactionHash=0x071f88ab03ea54985f1167d81eb59be023714cfcff6ab01a943e98fee27f5d0e HTTP/1.1" 200 -
```
### Invoking a contract function
```bash
starknet invoke --no_wallet \
--gateway_url http://127.0.0.1:5000/gateway/ \
--feeder_gateway_url http://127.0.0.1:5000/feeder_gateway/ \
--address 0x040ac735fce2af86b335ac0db11ddf1d9d956cc577f02cf0ea6ed8c06119cdce \
--abi ./build/contract_abi.json \
--function increase_balance \
--inputs 1234
```
This will produce output similar to the following in the Devnet console:
```bash 
192.168.176.3 - - [22/Feb/2022 04:04:22] "POST /gateway/add_transaction HTTP/1.1" 200 -
```
### Calling a contract function
```bash
starknet call --no_wallet \
--gateway_url http://127.0.0.1:5000/gateway/ \
--feeder_gateway_url http://127.0.0.1:5000/feeder_gateway/ \
--abi ./build/contract_abi.json \
--address 0x040ac735fce2af86b335ac0db11ddf1d9d956cc577f02cf0ea6ed8c06119cdce \
--function get_balance
```
This will produce output similar to the following in the Devnet console:
```bash
192.168.176.3 - - [22/Feb/2022 04:06:09] "POST /feeder_gateway/call_contract?blockNumber=null HTTP/1.1" 200 -
```
### Stopping Devnet
The running Devnet container can be stopped with docker. First type CTRL+C to exit Devnet's console. This should take you back to your terminal in your project's root directory. The Devnet container is still running though. To stop the container, use the following docker command:
```bash
docker stop starknet-devnet
```
This will stop the running Devnet container. When the container is stopped it will be automatically cleaned up by Docker. So, no state will be saved at this stage for a subsequent session. The next time you run Devnet you will have a fresh network to use.
## Support
Support for this box is available via the Truffle community [here](https://www.trufflesuite.com/community)
