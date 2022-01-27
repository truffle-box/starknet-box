import fse from 'fse';

import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version; 
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const projectDir = process.cwd();
const contractsDir = starknetConfig.contracts_directory;
const buildDir = starknetConfig.contracts_build_directory;

// Attempt to load the specified docker image
const imageLoaded = starkNetDocker.loadImage(image);

if (imageLoaded) {
    let directoryList = fse.readdirSync(contractsDir);
    if (!fse.existsSync(buildDir)) {
        fse.mkdirSync(buildDir, {recursive: true});
    } else {
        fse.rmdirSync(buildDir, {recursive: true, force: true});
        fse.mkdirSync(buildDir, {recursive: true});
    }

    console.log(`\nCompiling contracts\n===================\n`);
    for (let file of directoryList) {
        if (file.endsWith("cairo")) {
            console.log(`Compiling ${file}`);
            const result = await starkNetDocker.compileContract(file, projectDir);
            if (result[0].StatusCode === 0) {
                console.log(`Compilation complete.\n`);
            } else {
                console.log(`There was an error compiling ${contractFile}`);
            }
        }
    }
} else {
    console.log(`Unable to continue. The requested image could not be located. Requested image: ${image.getRepoTag()}`);
}
