import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';
import { setNetwork, networks } from './networks.mjs';

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

// Docker configuration
const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

// Project configuration
const projectDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;
const accounts_dir = starknetConfig.starknet_accounts_directory;

// Command arguments
const argv = yargs(hideBin(process.argv)).argv;
const networkArg = argv.network;
const contract =argv.contract;
const constructorParams = argv._;

// StarkNet network configuration
const network = setNetwork(networkArg);

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
    logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
}

if (imageLoaded) {
    logger.logInfo(`Deploying Cairo contracts from the ${buildDir} directory.`);
    logger.logHeader();
    
    const contractFile = contract + ".json";

    const commandArguments = [
      `--contract`, `${buildDir}/${contractFile}`
    ];

    if (network === 'devnet') {
        commandArguments.push(...[
          `--gateway_url`,
          networks.devnet.gateway_url,
          `--feeder_gateway_url`,
          networks.devnet.feeder_gateway_url,
          `--no_wallet`
        ]);
    }

    if (constructorParams.length >= 1) {
        commandArguments.push(`--inputs`);
        constructorParams.forEach(input => {
            commandArguments.push(input.toString());
        })
    }

    logger.logWork('Deploying: ', contractFile);

    let result;
    try {
        result = await starkNetDocker.deployContract(accounts_dir, projectDir, network, commandArguments);
    } catch (error) {
        logger.logError(`An error occurred while attempting to deploy a contract: ${error.message}`);
    }
    if (result[0].StatusCode !== 0) {
        logger.logError('There was an error deploying: ', contractFile);
    }
} else {
    logger.logError('Unable to continue. The docker image could not be located. Requested image: ', image.getRepoTag());
}
