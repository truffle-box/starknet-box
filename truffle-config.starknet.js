require('dotenv').config();

module.exports = {

  /**
  *  contracts_directory tells Cairo where to find your contracts
  */
  contracts_directory: './contracts/starknet',

  /**
  * contracts_build_directory tells Cairo where to store compiled contracts
  */
  contracts_build_directory: './build/starknet-contracts',

  /**
   * starknet_accounts_directory tells Cairo where the StarkNet account keys are located.
   * WARNING: accounts deployed using keys stored in this directory are for development and testing only.
   * DO NOT use any account deployed using keys stored here in production, or you risk having all your funds stolen.
   * You should also add this directory to a .gitignore file to avoid making your keys publicly available.
   */
  starknet_accounts_directory: './starknet_accounts',

  networks: {
    testnet: {
      network_id: "alpha-goerli",
    },
    // mainnet: {
    //   network_id: "alpha-mainnet"
    // },
    devnet: {
      network_id: "devnet",
      gateway_url: "http://starknet-devnet:5050/gateway/",
      feeder_gateway_url: "http://starknet-devnet:5050/feeder_gateway/"
    },
    default: {
      network: "testnet",
    },
  },
  // Configure your Cairo compilers
  compilers: {
    cairo: {
      repository: "trufflesuite/cairo-starknet-cli",  // Docker Hub repository
      version: "0.8.1",                               // Version tag
    }
  },
  // Configuration for StarkNet DevNet
  devnet: {
    repository: "shardlabs/starknet-devnet",  // Docker Hub repository
    version: "0.2.0",                        // Version tag
  },
};
