const { execSync } = require('child_process');
const fetch = require('node-fetch');
const Docker = require("dockerode");

/**
 * TruffleDocker base class
 */
class TruffleDocker {

    /**
     * TruffleDocker is a base class providing common methods for interacting with a Docker image/container. 
     * @constructor
     */
    constructor() {
        // If Docker is not running we can't continue.
        if (!this._isDockerRunning()) {
            throw new DockerNotRunningError("Could not find docker! Check that docker is running.");
        }
        // If Docker is running we cam instantiate a new Docker object.
        this._docker = new Docker();
    }

    /**
     * Checks for a local image and if not available pulls it from the Docker Hub
     * @param {Image} image The Docker image to search Docker Hub for.
     * @returns {boolean} True if the image is found on the local machine or was pulled from Docker Hub.
     */
    loadImage = async (image) => {
        // Check for the image locally
        let isLocal;
        try {
            isLocal = await this.isImageLocal(image);
        } catch (error) {
            throw new DockerOperationError(`An error occurred while querying docker for local images: ${error}`);
        }

        // It's not local, try to pull from Docker Hub
        if (!isLocal) {
            console.log(`Image not available locally. Pulling image from ${image.repository}:${image.tag}`);
            try {
                await this.pullImage(image);
            } catch(error) {
                throw new DockerPullImageError(`An error occurred while attempting to pull the image from Docker Hub: ${error.msg}`);
            }
        }
        return true;
    }

    /**
     * Check for the image in the local docker registry
     * @param {Image} image The Docker image to search Docker Hub for.
     * @returns {boolean} True if the image is found on the local machine.
     */
    isImageLocal = async (image) => {
        // Get the repo:tag string for the image and iterate through the images
        // in the local repo to check if the one we're interested in exists
        const repoTag = image.getRepoTag();
        const localImages = await this._listLocalImages();

        for (let image of localImages) {
            const tags = image.RepoTags;
            for (let tag of tags) {
                if (tag == repoTag) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check for the image in the Docker Hub registry. This assumes an image with a tag.
     * @param {Image} image The Docker image to search Docker Hub for.
     * @returns {boolean} True if the image is available in the Docker Hub registry.
     */
    isImageAvailable = async (image) => {
        // Build Docker Hub registry url for the specific image
        const dockerRegistry = `https://registry.hub.docker.com/v2/repositories/${image.repository}/tags/${image.tag}/`
        const response = await fetch(dockerRegistry);

        // If we get a good response, the image was found in the Docker Hub registry.
        if (response.ok) {
            return true;
        }
        return false;
    }

    /**
     * Pulls the specified image from the Docker Hub
     * @param {Image} image The image to pull from Docker Hub
     * @returns {Promise} Resolves if the image is pulled successfully
     */
    pullImage = async (image) => {
        const repoTag = image.getRepoTag();

        // Pull the image if it is available in the Docker Hub
        let imageAvailable;
        try {
            imageAvailable = await this.isImageAvailable(image);
        } catch (error) {
            throw new DockerHubUnavailableError(`An error occurred while querying Docker Hub: ${error.msg}`);
        }

        let message;
        if (imageAvailable) {
            message = await this._docker.pull(repoTag);
        }
        return new Promise((resolve, reject) => {
            message.on("end", resolve);
            message.on("error", reject);

            // This is needed even if unused
            message.on("data", () => {});
        });    
    }

    /**
     * Run a docker container from an image
     * @param {string} repoTag The image for the container to run 
     * @param {array} command An array of commands to be run
     * @param {Object} config Configuration for the container
     * @returns {Object} The result data from the container run
     */
    runContainerWithCommand = async (repoTag, command, config) => {
        const result = await this._docker.run(repoTag, command, process.stdout, config);
        return result;
    }

    /**
     * Check if Docker is running
     * @returns {boolean} True if Docker is running otherwise false
     */
    _isDockerRunning = () => {
        // To determine whether Docker daemon is running we ask docker.
        // We have no need for any info returned.
        try {
            execSync('docker info', {stdio: 'ignore'});
        } catch(error) {
            return false;
        }
        return true;
    }

    /**
     * Lists images available in the local docker registry
     * @returns {ImageInfo[]} An array of information about images
     */
     _listLocalImages = async () => {
        const images = await this._docker.listImages();
        return images;
    }
}

/**
 * StarkNetDoocker class
 */
class StarkNetDocker extends TruffleDocker {

    /**
     * StarkNetDocker extneds TruffleDocker to provide methods for compiling 
     * and interacting with Cairo/StarkNet contracts.
     * @constructor
     * @param {Image} image - The Docker image to be used.
     */
    constructor(image) {
        super();
        this._image = image;
    }

    /**
     * Generates a StarkNet account for use in development and testing.
     * @param {string} accountsDir The path to the StarkNet acccounts directory.
     * @param {string} projectDir The path to the project root directory.
     * @param {string} network The StarkNet network to deploy the account to.
     * @param {string} accountName The name of the account to be created (optional).
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
     * @param {string} contractFile The filename of the contract to compile.
     * @param {string} projectDir The path to the project root directory.
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
     * @param {string} accountsDir The path to the StarkNet accounts directory. 
     * @param {string} compiledContractFile The filename of the compiled contract to deploy.
     * @param {string} projectDir The path to the project root directory.
     * @param {string} network The StarkNet network to deploy the contract to.
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
     * Run the StarkNet tests
     * @param {string} testFile The file name of the test file to run
     * @param {string} projectDir The path to the project root directory.
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

/**
 * Image class
 */
class Image {
    
    /**
     * Represents a Docker image found on the Docker Hub.
     * @constructor
     * @param {string} repository The Docker Hub repository for the image.
     * @param {string} tag The tag for the image.
     */
    constructor(repository, tag) {
        this.repository = repository;
        this.tag = tag;
    }

    /**
     * Build and return a repository:tag string for the image.
     * @returns {string} The repoository:tag string. 
     */
    getRepoTag() {
        return `${this.repository}:${this.tag}`;
    }
}


/**
 * DockerNotRunningError
 * This error is thrown if the Docker is not running locally.
 */
class DockerNotRunningError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerNotRunningError";
    }
}

/**
 * DockerOperationError
 * Thrown if an operation with Docker fails.
 */
class DockerOperationError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerOperationError";
    }
}

/**
 * DockerPullError
 * Thrown if there is a failure in pulling an image from Docker Hub.
 */
class DockerPullImageError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerPullImageError"
    }
}

/**
 * DockerHubUnavailableError
 * Thrown if the Docker Hub cannot be reached.
 */
class DockerHubUnavailableError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerHubUnavailableError";
    }
}

/**
 * StarkNetAccountCreationError
 * Thrown if there is an error deploying a StarkNet account.
 */
class StarkNetAccountCreationError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "StarkNetAccountCreationError";
    }
}

/**
 * StarkNetCompilationError
 * Thrown if there is an error compiling a StarkNet contract.
 */
class StarkNetCompilationError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "StarkNetCompilationError";
    }
}

/**
 * StarkNetDeploymentError
 * Thrown if there is an error while deploying a StarkNet contract.
 */
class StarkNetDeploymentError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "StarkNetDeploymentError";
    }
}

/**
 * StarkNetTestingError
 * Thrown if there is an error while running tests on StarkNet contracts.
 */
class StarkNetTestingError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "StarkNetTestingError";
    }
}

module.exports = {Image, TruffleDocker, StarkNetDocker};