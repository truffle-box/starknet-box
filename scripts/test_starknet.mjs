import fse from 'fse';

import { Image, StarkNetDocker } from './starknet-docker.js';

import starknetConfig from '../truffle-config.starknet.js';

const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version;
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

const projectDir = process.cwd();
const testDir = projectDir + '/test/starknet';

// Attempt to load the specified docker image
const imageLoaded = await starkNetDocker.loadImage(image);

if (imageLoaded) {
    let directoryList = fse.readdirSync(testDir);

    for (let file of directoryList) {
        if (file.endsWith("_test.py")) {
            const result = await starkNetDocker.runTests(file, projectDir);
            if (result[0].StatusCode !== 0) {
                console.log(`There was an error running tests: ${file}`);
            }
        }
    }
} else {
    console.log(`Unable to continue. The requested image could not be located. Requested image: ${image.getRepoTag()}`);
}
