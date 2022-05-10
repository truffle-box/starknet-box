import { Image } from './truffle_docker.mjs';
import { TruffleDocker } from './truffle_docker.mjs';
import {
    StarkNetAccountCreationError,
    StarkNetCompileError,
    StarkNetDeploymentError,
    StarkNetFunctionError,
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
     * @param {string} accountsDir - The path to the StarkNet accounts directory.
     * @param {string} projectDir - The path to the project root directory.
     * @param {string} network - The StarkNet network to deploy the account to.
     * @param {string} [accountName] - The name of the account to be created (optional).
     * @returns {Promise<object>} The results of running the Docker container.
     * @throws {StarkNetAccountCreationError} An error occurred while deploying the account.
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
     * @param {string} contractsDir - The contract source code directory.
     * @param {string} buildDir - The contract compilation artifacts directory.
     * @param {boolean} disableHints - Disable hint validation during contract compilation.
     * @returns {Promise<object>} The results of running the Docker container.
     * @throws {StarkNetCompileError} An error occurred while compiling a contract.
     */
    compileContract = async (contractFile, projectDir, contractsDir, buildDir, disableHints = false) => {
        const outputFilename = contractFile.substring(0, contractFile.indexOf(".cairo")) + ".json";
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container.
        const command = [
            `starknet-compile`,
            `${contractsDir}/${contractFile}`,
            `--output`, `${buildDir}/${outputFilename}`,
            `--abi`, `${buildDir}/abis/${outputFilename}`
        ];
        if (disableHints) {
            command.push('--disable_hint_validation');
        }

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
            throw new StarkNetCompileError(`An error occurred while compiling ${contractFile}: ${error}`);
        }
        return result;
    }

    /**
     * Deploys a StarkNet contract.
     * @method
     * @param {string} accountsDir - The path to the StarkNet accounts directory. 
     * @param {string} projectDir - The path to the project root directory to bind the docker container's /app directory to.
     * @param {string} network - The StarkNet network to deploy the contract to. (optional)
     * @param {Array<string>} commandArguments - An array of starknet deploy command arguments.
     * @returns {Promise<object>} The results of running the Docker container.
     * @throws {StarkNetDeploymentError} An error occurred while deploying a contract.
     */
    deployContract = async (
      accountsDir,
      projectDir,
      network,
      commandArguments) => {

        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        const command = [
            `starknet`,
            `deploy`
        ];
        command.push(...commandArguments);

        // Set up host and environment configuration for the container
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            },
            'Env': [
                `STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount`,
                `STARKNET_ACCOUNT_DIR=${accountsDir}`
            ]
        };

        if (network !== 'devnet') {
            // If the target network is not devnet we need to set the STARKNET_NETWORK environment variable.
            config.Env.push(`STARKNET_NETWORK=${network}`);
        } else {
            // If the target network is devnet join the devnet docker network .
            config.Hostconfig.NetworkMode = 'starknet-devnet';
        }

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetDeploymentError(`An error occurred while deploying the contract}: ${error}`);
        }
        return result;
    }

    /**
     * Calls or invokes a function of a deployed StarkNet contract
     * @method
     * @param {string} accountsDir - The path to the StarkNet accounts directory.
     * @param {string} projectDir - The path to the project root directory to bind the docker container's /app directory to.
     * @param {string} network - The StarkNet network to deploy the contract to. (optional)
     * @param {string} starknetCommand - The StarkNet command (call or invoke).
     * @param {Array<string>} commandArguments - An array of starknet deploy command arguments.
     * @return {Promise<object>}
     */
    callOrInvokeFunction = async (
      accountsDir,
      projectDir,
      network,
      starknetCommand,
      commandArguments) => {
        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        // Set up a StarkNet command
        const command = [
            `starknet`
        ];
        if (starknetCommand === 'call') {
            command.push(`call`);
        } else if (starknetCommand === 'invoke') {
            command.push(`invoke`);
        }
        command.push(...commandArguments);

        // Set up host and environment configuration for the container
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            },
            'Env': [
                `STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount`,
                `STARKNET_ACCOUNT_DIR=${accountsDir}`
            ]
        };
        if (network !== 'devnet') {
            // If the target network is not devnet we need to set the STARKNET_NETWORK environment variable.
            config.Env.push(`STARKNET_NETWORK=${network}`);
        } else {
            // If the target network is devnet join the devnet docker network .
            config.Hostconfig.NetworkMode = 'starknet-devnet';
        }

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetFunctionError(`An error occurred while invoking the function : ${error.message}`);
        }
        return result;
    }

    /**
     * Get the status of a specific transaction
     * @param {string} accountsDir - The path to the StarkNet accounts directory.
     * @param {string} projectDir - The path to the project root directory to bind the docker container's /app directory to.
     * @param {string} network - The StarkNet network on which the transaction was made. (optional)
     * @param {Array<string>} commandArguments - An array of starknet deploy command arguments.
     * @return {Promise<void>}
     */
    getTransactionStatus = async (
      accountsDir,
      projectDir,
      network,
      commandArguments
    ) => {
        const repoTag = this._image.getRepoTag();
        // Docker uses an array to construct the command to be run by the container.
        // Set up a StarkNet command
        const command = [
            `starknet`, `tx_status`
        ];
        command.push(...commandArguments);

        // Set up host and environment configuration for the container
        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            },
            'Env': [
                `STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount`,
                `STARKNET_ACCOUNT_DIR=${accountsDir}`
            ]
        };
        if (network !== 'devnet') {
            // If the target network is not devnet we need to set the STARKNET_NETWORK environment variable.
            config.Env.push(`STARKNET_NETWORK=${network}`);
        } else {
            // If the target network is devnet join the devnet docker network .
            config.Hostconfig.NetworkMode = 'starknet-devnet';
        }

        let result;
        try {
            result = await this.runContainerWithCommand(repoTag, command, config);
        } catch (error) {
            throw new StarkNetFunctionError(`An error occurred while attempting to get the transaction status.`);
        }
        return result;
    }

    /**
     * Run the StarkNet tests.
     * @method
     * @param {string} testFile - The file name of the test file to run.
     * @param {string} projectDir - The path to the project root directory.
     * @returns {Promise<object>} The results of running the Docker container.
     * @throws {StarkNetTestingError} An error occurred while running tests.
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