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
        // If Docker is not running we can't continue. Throw an error.
        if (!this._isDockerRunning()) {
            throw new DockerNotRunningError("Could not find docker! Check that docker is running.");
        }
        this._docker = new Docker();
    }

    /**
     * Checks for a local image and if not available pulls it from the Docker Hub
     * @param {Image} image - The Docker image to search Docker Hub for.
     * @returns {boolean} - Returns true if the image is found on the local machine or was pulled from Docker Hub.
     */
    loadImage = async (image) => {

        // Check for the image locally
        const isLocal = await this.isImageLocal(image);

        if (!isLocal) {
            // It's not local, check image available on Docker Hub
            console.log(`Image not available locally. Attemtping to pull from Docker Hub.`);
            const isAvailable = await this.isImageAvailable(image);

            if (isAvailable) {
                // It's available on Docker Hub - pull it down.
                console.log(`Pulling image from ${image.repository}:${image.tag}`);
                try {
                    await this.pullImage(image);
                } catch(error) {
                    throw new DockerPullImageError(`Something went wrong while attempting to pull the image from Docker Hub: ${error.msg}`)
                }
            } else {
                console.log(`The requested image could not be found in the Docker Hub regsitry.`);
                return false;
            }
        }
        return true;
    }

    /**
     * Check for the image in the local docker registry
     * @param {Image} image - The Docker image to search Docker Hub for.
     * @returns {boolean} - Returns true if the image is found on the local machine.
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
     * @param {Image} image - The Docker image to search Docker Hub for.
     * @returns {boolean} - Returns true if the image is available in the Docker Hub registry.
     */
    isImageAvailable = async (image) => {
        // Build Docker Hub registry url for the specific image
        const dockerRegistry = `https://registry.hub.docker.com/v2/repositories/${image.repository}/tags/${image.tag}/`
        
        let response;
        try {
            response = await fetch(dockerRegistry);
        } catch(error) {
            throw new DockerHubUnavailableError(`Something went wrong while querying Docker Hub: ${error.msg}`);
        }

        // If we get a good response, the image was found in the Docker Hub registry.
        if (response.ok) {
            return true;
        }
        return false;
    }

    /**
     * Pulls the specified image from the Docker Hub
     * @param {Image} image - the image to pull from Docker Hub
     * @returns {Promise} 
     */
    pullImage = async (image) => {
        const repoTag = image.getRepoTag();

        // Pull the image if it is available in the Docker Hub
        const imageAvailable = await this.isImageAvailable(image);
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
     * @param {string} repoTag - the image for the container to run 
     * @param {array} command - an array of commands to be run
     * @param {Object} config - configuration for the container
     */
    runContainerWithCommand = (repoTag, command, config) => {
        this._docker.run(
            repoTag,
            command,
            process.stdout,
            config
        ).then((data) => {
            if (data[0].StatusCode === 0) {
                console.log(`Completed.\n`);
            }
        }).catch((error) => {
            throw new DockerContainerRunError(`Something went wrong while attempting to run the container: ${error.msg}`);
        });
    }

    /**
     * Check if Docker is running
     * @returns {boolean} - true if Docker is running otherwise false
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
     * @returns {ImageInfo[]} - an array of information about images
     */
     _listLocalImages = async () => {
        let images;
        try {
            images = await this._docker.listImages();
        } catch(error) {
            throw new DockerOperationError(`Something went wrong while querying docker for local images: ${error.msg}`);
        }
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
     * Compiles a Cairo/StarkNet contract.
     * @param {string} contractFile - The filename of the contract to compile.
     * @param {string} projectDir - The path to the project root directory.
     */
    compileContract = (contractFile, projectDir) => {
        const outputFilename = contractFile.substring(0, contractFile.indexOf(".cairo"));
        const compiledContractFile =  `${outputFilename}_compiled.json`;
        const contractAbiFile = `${outputFilename}_abi.json`;
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container.
        const command =             [
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
        this.runContainerWithCommand(repoTag, command, config);
    }

    /**
     * Deploys a StarkNet contract.
     * @param {string} compiledContractFile - The filename of the compiled contract to deploy.
     * @param {string} projectDir - The path to the project root directory.
     * @param {string} network - The StarkNet network to deploy the contract to.
     */
    deployContract = (compiledContractFile, projectDir, network) => {
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container.
        const command =             [
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
                `STARKNET_NETWORK=${network}`
            ]
        };
        this.runContainerWithCommand(repoTag, command, config);
    }

    /**
     * Run the StarkNet tests
     * @param {string} projectDir - The path to the project root directory.
     */
    runTests = (projectDir) => {
        
        // Get the repo:tag string for the image to run.
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container.
        const command = [
            'pytest',
            'test/starknet/contract_test.py'
        ];

        const config = {
            'Hostconfig': {
                'Binds': [`${projectDir}:/app`],
                'AutoRemove': true,
            }
        };
        this.runContainerWithCommand(repoTag, command, config);
    }
}

/**
 * Image class
 */
class Image {
    
    /**
     * Represents a Docker image found on the Docker Hub.
     * @constructor
     * @param {string} repository - The Docker Hub repository for the image.
     * @param {string} tag - The tag for the image.
     */
    constructor(repository, tag) {
        this.repository = repository;
        this.tag = tag;
    }

    /**
     * Build and return a repository:tag string for the image.
     * @returns {string} - The repoository:tag string. 
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
 * This error is thrown if an operation with Docker fails.
 */
class DockerOperationError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerOperationError";
    }
}

/**
 * DockerPullError
 * This error is thrown if there is a failure in pulling an image from Docker Hub
 */
class DockerPullImageError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerPullImageError"
    }
}

/**
 * DockerHubUnavailableError
 * This error is thrown if the Docker Hub cannot be reached.
 */
class DockerHubUnavailableError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerHubUnavailableError";
    }
}

/**
 * DockerContainerRunningError
 * This error is thrown if there is an error running a container
 */
class DockerContainerRunError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "DockerContainerRunError";
    }
}

module.exports = {Image, TruffleDocker, StarkNetDocker};