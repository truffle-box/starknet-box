import fs from 'fs';
import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const network = starknetConfig.networks.testnet.network_id;
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const currentDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;

// Get list of compiled contract files from the starknet contracts build directory
// It is exptected that the compiled contract filenames will have the form contract-name_compiled.json
let directoryList = fs.readdirSync(buildDir);
for (let file of directoryList) {
    if (file.endsWith("_compiled.json")) {
        starkNetDocker.deployContract(file, currentDir, network);
    }
}
