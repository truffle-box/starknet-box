import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Image } from './truffle_docker.mjs';
import { StarkNetDevnetDocker } from './starknet_devnet_docker.mjs';

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

import starknetConfig from '../truffle-config.starknet.js';
// Command arguments
const argv = yargs(hideBin(process.argv)).argv;
const arm64Image = argv.arm64 ? true : false;

const devnet_repo = starknetConfig.devnet.repository;
let devnet_version = starknetConfig.devnet.version;
if (arm64Image) {
    devnet_version = devnet_version + `-arm`;
}
console.log(`${devnet_repo}${devnet_version}`);
const image = new Image(devnet_repo, devnet_version);
const starknetDevnetDocker = new StarkNetDevnetDocker(image);


// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starknetDevnetDocker.loadImage(image);
} catch (error) {
    logger.logError('An error occurred while attempting to load the Docker image: ', error.message);
}

if (imageLoaded) {
    try {
        await starknetDevnetDocker.runDevnet();
    } catch (error) {
        logger.logError('An error occurred while attempting to run devnet: ', error.message);
    }
} else {
    logger.logError('Unable to continue. The docker image could not be located. Requested image: ', image.getRepoTag());
}