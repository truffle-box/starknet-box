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
const buildDir = starknetConfig.contracts_build_directory;
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

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
    logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
}

if (imageLoaded){
    // Get list of compiled contract files from the starknet contracts build directory
    // It is exptected that the compiled contract filenames will have the form contract-name_compiled.json
    let directoryList = fse.readdirSync(buildDir);
    
    logger.logInfo(`Deploying all Cairo contracts in the ${buildDir} directory.`);
    logger.logHeader();
    
    for (let file of directoryList) {
        let result;
        if (file.endsWith("_compiled.json")) {
            logger.logWork('Deploying: ', file);
            let result;
            try {
                result = await starkNetDocker.deployContract(accounts_dir, file, projectDir, network);
            } catch (error) {
                logger.logError(`An error occurred while attempting to deploy a contract: ${error.message}`);
            }
            if (result[0].StatusCode !== 0) {
                logger.logError('There was an error deploying: ', file);
            }
        }
    }
} else {
    logger.logError('Unable to continue. The docker image could not be located. Requested image: ', image.getRepoTag());
}
