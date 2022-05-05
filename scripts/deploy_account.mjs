import fse from 'fse';
import yargs from 'yargs';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';
import { setNetwork } from './networks.mjs';

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

// Command arguments
const argv = yargs(process.argv.slice(2)).argv;
const networkArg = argv.network;

// StarkNet network configuration
const network = setNetwork(networkArg);

logger.logHeader();

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
    logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
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
        logger.logError(`An error occurred while attempting to deploy the account contract: ${error.message}`);
    }
    if (result[0].StatusCode !== 0) {
        logger.logError('\nThere was an error deploying the account.\n');
    }
} else {
    logger.logError('\nUnable to continue. The docker image could not be located. Requested image: ', image.getRepoTag() + '\n');
}
