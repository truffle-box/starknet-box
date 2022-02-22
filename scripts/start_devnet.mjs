import { Image, StarkNetDevnetDocker } from './starknet-docker.js';
import starknetConfig from '../truffle-config.starknet.js';

const devnet_repo = starknetConfig.devnet.repository;
const devnet_version = starknetConfig.devnet.version;
const image = new Image(devnet_repo, devnet_version);
const starknetDevnetDocker = new StarkNetDevnetDocker(image);

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starknetDevnetDocker.loadImage(image);
} catch (error) {
    console.log(`An error occurred while attempting to load the Docker image: ${error.msg}`);
}

if (imageLoaded) {
    try {
        await starknetDevnetDocker.runDevnet();
    } catch (error) {
        console.log(`An error occurred while attempting to deploy a contract: ${error.msg}`);
    }
} else {
    console.log(`Unable to continue. The docker image could not be located. Requested image: ${image.getRepoTag()}`);
}