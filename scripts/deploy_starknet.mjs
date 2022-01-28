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
const buildDir = starknetConfig.contracts_build_directory;
const accounts_dir = starknetConfig.starknet_accounts_directory;

// StarkNet network configuration
const network = starknetConfig.networks.testnet.network_id;

// Attempt to load the specified docker image
const imageLoaded = starkNetDocker.loadImage(image);

if (imageLoaded){
    // Get list of compiled contract files from the starknet contracts build directory
    // It is exptected that the compiled contract filenames will have the form contract-name_compiled.json
    let directoryList = fse.readdirSync(buildDir);
    console.log(`Deploying all Cairo contracts in the ${buildDir} directory.`);
    for (let file of directoryList) {
        let result;
        if (file.endsWith("_compiled.json")) {
            console.log(`Deploying ${file}`);
            let result;
            try {
                result = await starkNetDocker.deployContract(accounts_dir, file, projectDir, network);
            } catch (error) {
                console.log(error.msg);
            }
            if (result[0].StatusCode !== 0) {
                console.log(`There was an error deploying ${contractFile}`);
            }
        }
    }
} else {
    console.log(`Unable to continue. The docker image could not be located. Requested image: ${image.getRepoTag()}`);
}
