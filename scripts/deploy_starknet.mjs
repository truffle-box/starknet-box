import fse from 'fse';

import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const projectDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;

const network = starknetConfig.networks.testnet.network_id;

const imageLoaded = starkNetDocker.loadImage(image,projectDir);

if (imageLoaded){
    // Get list of compiled contract files from the starknet contracts build directory
    // It is exptected that the compiled contract filenames will have the form contract-name_compiled.json
    let directoryList = fse.readdirSync(buildDir);
    for (let file of directoryList) {
        let result;
        if (file.endsWith("_compiled.json")) {
            console.log(`\nDeploying ${file}`);
            const result = await starkNetDocker.deployContract(file, projectDir, network);
            if (result[0].StatusCode !== 0) {
                console.log(`There was an error deploying ${contractFile}`);
            }
        }
    }
} else {
    console.log(`Unable to continue. The requested image could not be located. Requested image: ${image.getRepoTag()}`);
}
