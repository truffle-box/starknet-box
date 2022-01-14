import fs from 'fs';
import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const contractsDir = starknetConfig.contracts_directory;
const currentDir = process.cwd();

// Get list of cairo contract files from the contracts/starknet directory and compile them
let directoryList = fs.readdirSync(contractsDir);
for (let file of directoryList) {
    if (file.endsWith("cairo")) {
        starkNetDocker.compileContract(file, currentDir);
    }
}
