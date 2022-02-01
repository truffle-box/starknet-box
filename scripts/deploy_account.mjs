import fse from 'fse';
import { Image, StarkNetDocker } from './starknet-docker.js';
import starknetConfig from '../truffle-config.starknet.js';

// Docker configuration
const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

// Project configuration
const projectDir = process.cwd();
const accounts_dir = starknetConfig.starknet_accounts_directory;

// StarkNet network configuration
const network = starknetConfig.networks.testnet.network_id;

// Attempt to load the specified docker image
const imageLoaded = await starkNetDocker.loadImage(image);

if (imageLoaded){
    // Create the StarkNet accounts directory if it doesn't already exist.
    if (!fse.existsSync(accounts_dir)) {
        fse.mkdirSync(accounts_dir);
    }

    console.log(`Deploying StarkNet account. The account keys will be stored in ${accounts_dir}`);
    let result 
    try {
        result = await starkNetDocker.createAccount(accounts_dir, projectDir, network);
    } catch (error) {
        console.log(error.msg);
    }
    if (result[0].StatusCode !== 0) {
        console.log(`There was an error deploying the account.`);
    }
} else {
    console.log(`Unable to continue. The docker image could not be located. Requested image: ${image.getRepoTag()}`);
}
