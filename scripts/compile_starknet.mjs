import fs from 'fs';
import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const contractsDir = starknetConfig.contracts_directory;
const currentDir = process.cwd();

starkNetDocker.loadImage(image).then((result) => {
    // Get list of cairo contract files from the contracts/starknet directory and compile them
    // console.log(`Result: ${result}`);
    if (result) {
        let directoryList = fs.readdirSync(contractsDir);
        console.log(`\nCompiling contracts\n===================\n`);
        for (let file of directoryList) {
            if (file.endsWith("cairo")) {
                console.log(`Compiling ${file}`);
                starkNetDocker.compileContract(file, currentDir);
            }
        }
    } else {
        console.log(`Unable to continue. The requested image was not found locally of on Docker Hub.`);
    }
});

