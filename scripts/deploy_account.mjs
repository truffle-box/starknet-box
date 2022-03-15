import fse from 'fse';
import yargs from 'yargs';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';

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
const accounts_dir = starknetConfig.starknet_accounts_directory;

// StarkNet network configuration
const networks = starknetConfig.networks;
let defaultNetwork = "alpha-goerli";
const argv = yargs(process.argv.slice(2)).argv;
const networkArg = argv.network;

// If a default network is set in the config, set it here otherwise it will be set as above.
if (networks.hasOwnProperty("default")) {
    defaultNetwork = networks[starknetConfig.networks.default.network].network_id;
}

let network;
if (networkArg) {
    // The user has selected a specific network using the --network argument
    // Set the network to the selected network if it exists in the config - otherwise set it to the default network.
    if (networks.hasOwnProperty(networkArg)) {
        network = networks[networkArg].network_id;
    } else {
        logger.logInfo('The specified network is not configured. Using the default network: ', defaultNetwork);
        network = defaultNetwork;
    }
} else {
    // The user has not selected a specific network - use the default;
    logger.logInfo('No network specified. Using the default network: ', defaultNetwork);
    network = defaultNetwork;
}
logger.logInfo('Network: ', network);
logger.logHeader();

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
    logger.logError('An error occurred while attempting to load the Docker image: ', error.msg);
}

if (imageLoaded){
    // Create the StarkNet accounts directory if it doesn't already exist.
    if (!fse.existsSync(accounts_dir)) {
        fse.mkdirSync(accounts_dir);
    }

    logger.logWork('Deploying StarkNet account. The account keys will be stored in: ', accounts_dir + '\n');

    let result 
    try {
        result = await starkNetDocker.createAccount(accounts_dir, projectDir, network);
    } catch (error) {
        logger.logError(error.msg);
    }
    if (result[0].StatusCode !== 0) {
        logger.logError('\nThere was an error deploying the account.\n');
    }
} else {
    logger.logError('\nUnable to continue. The docker image could not be located. Requested image: ', image.getRepoTag() + '\n');
}
