import fse from 'fse';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

// Docker configurations
const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version;
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

// Project configuration
const projectDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;
const abiDir = buildDir + "/abis";
const contractsDir = starknetConfig.contracts_directory;

// Command arguments
const argv = yargs(hideBin(process.argv)).argv;
const disableHints = argv.disable_hints ? true : false;
logger.logInfo('Hint validation is: ', `${disableHints ? 'disabled' : 'enabled'}.`);

// Attempt to load the specified docker image
let imageLoaded = false;
try {
    imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
    logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
}

if (imageLoaded) {
    // Clean up or create build directory for compilation artifacts
    if (!fse.existsSync(abiDir)) {
        fse.mkdirSync(abiDir, {recursive: true});
    } else {
        fse.rmdirSync(abiDir, {recursive: true, force: true});
        fse.mkdirSync(abiDir, {recursive: true});
    }
    
    logger.logInfo(`Compiling all Cairo contracts in the ${contractsDir} directory.`);
    logger.logHeader();
    
    let directoryList = fse.readdirSync(contractsDir);
    for (let file of directoryList) {
        if (file.endsWith("cairo")) {
            logger.logWork(`Compiling ${file}`);
            const outputFilename = file.substring(0, file.indexOf(".cairo")) + ".json";
            const commandArguments = [
              `${contractsDir}/${file}`,
              `--output`, `${buildDir}/${outputFilename}`,
              `--abi`, `${buildDir}/abis/${outputFilename}`
            ];
            if (disableHints) {
                commandArguments.push(`--disable_hint_validation`);
            }
            let result;
            try {
                result = await starkNetDocker.compileContract(projectDir, commandArguments);
            } catch (error) {
                logger.logError(`An error occurred while trying to compile a contract: ${error.message}`);
            }
            if (result[0].StatusCode !== 0) {
                logger.logError('\nThere was an error compiling: ', file + '\n');
            }
        }
    }
    logger.logFooter();
    logger.logInfo('Compilation complete.');
} else {
    logger.logError('\nUnable to continue. The docker image could not be located. Requested image: ', image.getRepoTag() + '\n');
}
