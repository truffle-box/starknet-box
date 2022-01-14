require('dotenv').config();

module.exports = {

  /**
  *  contracts_directory tells Truffle where to find your contracts
  */
  contracts_directory: './contracts/starknet',

  /**
  * contracts_build_directory tells Truffle where to store compiled contracts
  */
  contracts_build_directory: './build/starknet-contracts',

  networks: {
    testnet: {
      network_id: "alpha-goerli",       // Any network (default: none)
    },
    // mainnet: {
    //   network_id: "alpha-mainnet"
    // }
  },

  // Configure your Cairo compilers
  // Presently the only supported version of the Cairo/StarkNet compiler is 0.6.2
  compilers: {
    cairo: {
      repository: "dkillen/cairo-starknet-cli",   // Docker Hub repository
      version: "0.6.2",                           // Version tag
    }
  }
};
