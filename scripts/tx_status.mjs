import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';
import { setNetwork, networks } from './networks.mjs';

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

// Docker configuration
const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version;
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

// Project configuration
const projectDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;
const accounts_dir = starknetConfig.starknet_accounts_directory;

// Command arguments
const argv = yargs(hideBin(process.argv))
  .parserConfiguration({
    "parse-numbers": false
  })
  .argv;

const txHash = argv.hash;
const networkArg = argv.network;
const contractName = argv.contract;
const getErrorMsg = !!argv.error_message;

// StarkNet network configuration
const network = setNetwork(networkArg);

// Attempt to load the specified docker image
let imageLoaded = false;
try {
  imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
  logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
}

if (imageLoaded){
  logger.logInfo(`Getting status for transaction: `, `${txHash}`);
  logger.logHeader();

  let contractDefinition = '';
  if (contractName) {
    contractDefinition = `${contractName}.json`;
  }

  let result;
  try {
    if (network === 'devnet') {
      const gatewayUrl = networks.devnet.gateway_url;
      const feederGatewayUrl = networks.devnet.feeder_gateway_url;
      result = await starkNetDocker.getTransactionStatus(
        accounts_dir,
        projectDir,
        buildDir,
        txHash,
        network,
        gatewayUrl,
        feederGatewayUrl,
        contractDefinition,
        getErrorMsg
      );
    } else {
      result = await starkNetDocker.getTransactionStatus(
        accounts_dir,
        projectDir,
        buildDir,
        txHash,
        network,
        '',
        '',
        contractDefinition,
        getErrorMsg
      );
    }
  } catch (error) {
    logger.logError(`An error occurred while attempting to get the transaction status.`);
  }
  if (result[0].StatusCode !== 0) {
    logger.logError(`There was an error while attempting to get the transaction status`);
  }

} else {
  logger.logError('Unable to continue. The docker image could not be located. Requested image: ', image.getRepoTag());
}
