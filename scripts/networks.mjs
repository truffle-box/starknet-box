import starknetConfig from "../truffle-config.starknet.js";

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

const networks = starknetConfig.networks;
let defaultNetwork = "alpha-goerli";

/**
 * Sets the target network for a command.
 * @param {string} networkArg - the network argument passed in on the cli
 */
const setNetwork = (networkArg) => {
  // If a default network is set in the config, set it here otherwise it will be set as above.
  if (networks.hasOwnProperty("default")) {
    defaultNetwork = networks[starknetConfig.networks.default.network].network_id;
  }

  let network;
  if (networkArg) {
    // The user has selected a specific network using the --network argument
    // Set the network to the selected network if it exists in the config - otherwise set it to the default network.
    if (networks.hasOwnProperty(networkArg)) {
      network = networks[networkArg].network_id;
    } else {
      logger.logInfo('The specified network is not configured. Using the default network: ', defaultNetwork);
      network = defaultNetwork;
    }
  } else {
    // The user has not selected a specific network - use the default;
    logger.logInfo('No network specified. Using the default network: ', defaultNetwork);
    network = defaultNetwork;
  }
  logger.logInfo('Network: ', network);
  return network;
}

export { setNetwork, networks };