const fs = require('fs');
const { execSync } = require('child_process');

const starknetConfig = require('../truffle-config.starknet');

const currentDir = process.cwd();
console.log(currentDir);
const contractsDir = starknetConfig.contracts_directory;
const buildDir = starknetConfig.contracts_build_directory;

// Get list of cairo contract files from the contracts/starknet directory and compile them
let directoryList = fs.readdirSync(contractsDir);
for (file of directoryList) {
    if (file.endsWith("cairo")) {
        const outputFilenames = buildOutputFilenames(file);
        compileContract(file, outputFilenames.outputFilename, outputFilenames.abiFilename);
    }
}

// Build output file names (compiled contract and abi) from the contract source file names
function buildOutputFilenames(filename) {
    const outputFilename = filename.substring(0, filename.indexOf(".cairo"));
    
    let compiledContract = outputFilename + "_compiled.json"
    let contractAbi =  outputFilename + "_abi.json";
    return {
        "outputFilename": compiledContract,
        "abiFilename": contractAbi
    }
}

// Compile the cairo contracts with the cairo-starknet-cli docker container
// It is expected that the cairo contract files will be in contracts/starknet and compilation output will go to build/starknet-contracts
function compileContract(contractFilename, compiledFilename, abiFilename) {
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, {recursive: true});
    } else {
        fs.rmdirSync(buildDir, {recursive: true, force: true})
        fs.mkdirSync(buildDir, {recursive: true});
    }
    execSync(
        `docker run -v ${currentDir}:/app cairo-starknet-cli:0.6.1 starknet-compile contracts/starknet/${contractFilename} --output build/starknet-contracts/${compiledFilename} --abi build/starknet-contracts/${abiFilename}`,
        {stdio: 'inherit'}
    );
}   