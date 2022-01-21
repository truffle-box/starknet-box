# StarkNet Box
This Truffle StarkNet Box provides you with the boilerplate structure necessary to start coding for StarkWare's Ethereum L2 solution, StarNet. StarkNet is a permissionless decentralized Validity-Rollup (also known as a "ZK-Rollup"). For detailed information on StarkNet, please see their documentation [here](https://starknet.io/).

This box provides a simple cairo contract. The same contract found in the [Hello, StarkNet tutorial](https://starknet.io/docs/hello_starknet/intro.html#your-first-contract). This box will allow you to compile the StarkNet contract and then deploy it to StarkNet Alpha on the Goerli test network. The Box is configured to use the Cairo version 0.7.0 for contract compilation and deployment. A sample test script is also provided which simulates a StarkNet system and runs tests with the [pytest](https://docs.pytest.org/en/6.2.x/) testing framework.
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
Included with this Box is a StarkNet configuration file: `truffle-config.starknet.js`. This file contains a reference to the new file location of the contracts_build_directory and contracts_directory for StarkNet contracts. It also configures the StarkNet network on Goerli Testnet as the network to which compiled contracts will be deployed.

Please note, the classic truffle-config.js configuration file is included here as well, because you will eventually want to deploy contracts to Ethereum as well. All normal truffle commands (truffle compile, truffle migrate, etc.) will use this config file and save built files to build/ethereum-contracts. You can save Solidity contracts that you wish to deploy to Ethereum in the contracts/ethereum folder.
### New Directory Structure for Artifacts
When you compile StarkNet contracts, the resulting json files will be at build/starknet-contracts/. This is to distinguish them from any Ethereum contracts you build, which will live in build/ethereum-contracts. As we have included the appropriate contracts_build_directory in each configuration file, Truffle will know which set of built files to reference!
## StarkNet
The following commands used for compiling and deploying StarkNet contracts will use the `truffle-config.starknet.js` configuration file. Both commands make use of a docker image built to provide the Cairo compiler without the need for setting up a Python development environment. The scripts will first query docker for a local copy of the image, and if it isn't found will attempt to pull the image from a Docker Hub repository. The Docker container resulting from running the image should be removed after the compile or deploy operation is complete.
### Compiling
To compile your StarkNet contracts using the Cairo compiler, run the following in your terminal:
```bash
npm run compile:starknet
```

### Deploying
To deploy your compiled StarkNet contracts to the StarkNet network on Goerli Testnet, run the following in your terminal:
```bash
npm run deploy:starknet
```
## Basic Commands
The code here will allow you to compile, deploy, and test your code against a simulation of a StarkNet network. The following commands can be run:
To compile:
```bash
npm run compile:starknet
```
To deploy:
```bash
npm run deploy:starknet
```
To test:
```bash
npm run test:starknet
```
### Testing
Currently, this box supports testing via the [pytest](https://docs.pytest.org/en/6.2.x/) testing framework. The test script makes use of StarkNet's unit testing framework to instantiate a local simulation of a StarkNet network against which unit tests can be run. In order to run the test provided in the boilerplate, use the following command:
```bash
npm run test:starknet
``` 
### Communication between StarkNet Layer 1 and Layer 2
The information above should allow you to deploy to the StarkNet Layer 2 network. This is only the first step! Once you are ready to deploy your own contracts on Layer 1 to interact with contracts on Layer 2, you will need to be aware of the ways in which Layer 1 and Layer 2 are able to interact in the StarkNet ecosystem. Keep an eye out for additional Truffle tooling and examples that elucidate this second step to full StarkNet integration!
## Support
Support for this box is available via the Truffle community [here](https://www.trufflesuite.com/community)