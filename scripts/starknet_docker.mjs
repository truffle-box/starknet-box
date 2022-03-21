import { Image } from './truffle_docker.mjs';
import { TruffleDocker } from './truffle_docker.mjs';
import { 
    StarkNetAccountCreationError,
    StarkNetCompilationError,
    StarkNetDeploymentError,
    StarkNetTestingError
} from './errors.mjs';

/**
 * A class providing methods for compiling and interacting with Cairo/StarkNet contracts.
 * @extends TruffleDocker
 */
 class StarkNetDocker extends TruffleDocker {
    /**
     * Create a StarkNetDocker object.
     * @constructor
     * @param {Image} image - The Docker image to be used.
     */
    constructor(image) {
        super();
        this._image = image;
    }

    /**
     * Generates a StarkNet account for use in development and testing.
     * @method
     * @param {string} accountsDir - The path to the StarkNet acccounts directory.
     * @param {string} projectDir - The path to the project root directory.
     * @param {string} network - The StarkNet network to deploy the account to.
     * @param {string} accountName - The name of the account to be created (optional).
     * @returns {Object} The results of running the Docker container.
     */
    createAccount = async (accountsDir, projectDir, network, accountName) => {
        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        const command = [
            `starknet`,
            `deploy_account`
        ];
        // If a name is provided for the account, push the argument on to the end of the command array.
        if (accountName) {
            command.push('--account');
            command.push(accountName);
        }
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            },
            'Env': [
                `STARKNET_NETWORK=${network}`,
                `STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount`,
                `STARKNET_ACCOUNT_DIR=${accountsDir}`
            ]
        }

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetAccountCreationError(`An error occurred while deploying the account: ${error}`);
        }
        return result;
    }

    /**
     * Compiles a Cairo/StarkNet contract.
     * @method
     * @param {string} contractFile - The filename of the contract to compile.
     * @param {string} projectDir - The path to the project root directory.
     * @returns {Object} The results of running the Docker container.
     */
    compileContract = async (contractFile, projectDir) => {
        const outputFilename = contractFile.substring(0, contractFile.indexOf(".cairo"));
        const compiledContractFile =  `${outputFilename}_compiled.json`;
        const contractAbiFile = `${outputFilename}_abi.json`;
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container.
        const command = [
            `starknet-compile`, 
            `contracts/starknet/${contractFile}`, 
            `--output`, `build/starknet-contracts/${compiledContractFile}`, 
            `--abi`, `build/starknet-contracts/${contractAbiFile}`
        ];
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            }
        };

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetCompilationError(`An error occurred while compiling ${contractFile}: ${error}`);
        }
        return result;
    }

    /**
     * Deploys a StarkNet contract.
     * @method
     * @param {string} accountsDir - The path to the StarkNet accounts directory. 
     * @param {string} compiledContractFile - The filename of the compiled contract to deploy.
     * @param {string} projectDir - The path to the project root directory.
     * @param {string} network - The StarkNet network to deploy the contract to.
     * @returns {Object} The results of running the Docker container.
     */
    deployContract = async (accountsDir, compiledContractFile, projectDir, network) => {
        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        const command = [
            `starknet`,
            `deploy`,
            `--contract`, `build/starknet-contracts/${compiledContractFile}`
        ];
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            },
            'Env': [
                `STARKNET_NETWORK=${network}`,
                `STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount`,
                `STARKNET_ACCOUNT_DIR=${accountsDir}`
            ]
        };

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetDeploymentError(`An error occurred while deploying ${compiledContractFile}: ${error}`);
        }
        return result;
    }

    /**
     * Run the StarkNet tests.
     * @method
     * @param {string} testFile - The file name of the test file to run.
     * @param {string} projectDir - The path to the project root directory.
     * @returns {Object} The results of running the Docker container.
     */
    runTests = async (testFile, projectDir) => {
        // Get the repo:tag string for the image to run.
        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        const command = [
            'pytest',
            `test/starknet/${testFile}`
        ];
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            }
        };

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetTestingError(`An error occurred while running tests in ${testFile}: ${error}`);
        }
        return result;
    }
}

export { StarkNetDocker };