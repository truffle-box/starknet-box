import fse from 'fse';
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
const contractsDir = starknetConfig.contracts_directory;

// Attempt to load the specified docker image
const imageLoaded = await starkNetDocker.loadImage(image);

if (imageLoaded) {
    // Clean up or create build directory for compilation artifacts
    if (!fse.existsSync(buildDir)) {
        fse.mkdirSync(buildDir, {recursive: true});
    } else {
        fse.rmdirSync(buildDir, {recursive: true, force: true});
        fse.mkdirSync(buildDir, {recursive: true});
    }
    
    logger.logInfo(`Compiling all Cairo contracts in the ${contractsDir} directory.`);
    logger.logHeader();
    
    let directoryList = fse.readdirSync(contractsDir);
    for (let file of directoryList) {
        if (file.endsWith("cairo")) {
            logger.logWork(`Compiling ${file}`);
            let result;
            try {
                result = await starkNetDocker.compileContract(file, projectDir);
            } catch (error) {
                logger.logError(error.msg);
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
