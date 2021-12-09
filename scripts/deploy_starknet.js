const fs = require('fs');
const { execSync } = require('child_process');

const starknetConfig = require('../truffle-config.starknet');

const currentDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;

// Get list of compiled contract files from the starknet contracts build directory
// It is exptected that the compiled contract filenames will have the form contract-name_compiled.json
let directoryList = fs.readdirSync(buildDir);
for (file of directoryList) {
    if (file.endsWith("_compiled.json")) {
        deployContract(file);
    }
}

// Deploy compiled contracts to the StarkNet Alpha testnet.
// It is expected that compiled contracts will be found in the build/starknet-contracts directory.
function deployContract(contractFile) {
    execSync(
        `docker run --env STARKNET_NETWORK=alpha -v ${currentDir}:/app cairo-starknet-cli:0.6.1 starknet deploy --contract build/starknet-contracts/${contractFile}`,
        {stdio: 'inherit'}
    );

}