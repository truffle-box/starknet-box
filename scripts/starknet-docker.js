const Docker = require("dockerode");
// const stream = require("stream");

/**
 * TruffleDocker class
 */
class TruffleDocker {

    constructor() {
        this._docker = new Docker();
    }

    /**
     * Check for the image in the local docker registry
     * @param {Image} image 
     * @returns {boolean}
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
     * Checks for the image in the Docker Hub registry
     * @param {Image} image
     * @returns {boolean}
     */
    isImageAvailable = (image) => {
        const dockerRegistry = `https://registry.hub.docker.com/v2/repositories/${image.repository}/tags/${image.tag}/`
        return true;   
    }

    /**
     * Pulls the specified image from the Docker Hub
     * @param {Image} image - the image to pull from Docker Hub
     */
    pullImage = (image) => {
        const repoTag = image.getRepoTag();
        this._docker.pull(repoTag, (err, stream) => {
            if (err) {
                console.log(err);
            } else {
                stream.pipe(process.stdout);
            }        
        });
    }

    /**
     * Run a docker container from an image
     * @param {string} repoTag - the image for the container to run 
     * @param {array} command - an array of commands to be run
     * @param {Object} config - configuration for the container
     */
    runContainer = (repoTag, command, config) => {
        this._docker.run(
            repoTag,
            command,
            process.stdout,
            config
        ).then((data) => {
            let output = data[0];
            console.log(output);
        }).catch((err) => {
            console.log(err);
        });
    }

    /**
     * Check if Docker is running
     */
    _isRunning = async () => {
        const result = await this._docker.ping();
        return result.toString('utf8') === "OK";
    }

    /**
     * Lists images available in the local docker registry
     * @returns {ImageInfo[]} - an array of information about images
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

    constructor(image) {
        super();
        this._image = image;
    }

    /**
     * Compiles a Cairo/StarkNet contract
     * @param {string} contractFile - filename of the contract to compile
     * @param {string} projectDir - path to the project root directory
     */
    compileContract = (contractFile, projectDir) => {
        const outputFilename = contractFile.substring(0, contractFile.indexOf(".cairo"));
        const compiledContractFile =  `${outputFilename}_compiled.json`;
        const contractAbiFile = `${outputFilename}_abi.json`;
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container
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
        this.runContainer(repoTag, command, config);
    }

    /**
     * Deploys a StarkNet contract
     * @param {string} compiledContractFile - filename of the compiled contract to deploy
     * @param {string} projectDir - path to the project root directory
     * @param {string} network - the StarkNet network to deploy the contract to
     */
    deployContract = (compiledContractFile, projectDir, network) => {
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container
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
        this.runContainer(repoTag, command, config);
    }

    /**
     * Run the StarkNet tests
     * @param {string} projectDir - the path to the project root directory 
     */
    runTests = (projectDir) => {
        
        // get the repo:tag string for the image to run
        const repoTag = this._image.getRepoTag();

        // Docker uses an array to construct the command to be run by the container
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
        this.runContainer(repoTag, command, config);
    }
}

class Image {
    constructor(repository, tag) {
        this.repository = repository;
        this.tag = tag;
    }

    /**
     * Build and return the repository:tag for the image.
     * @returns {string} the repoository:tag for the image
     */
    getRepoTag() {
        return `${this.repository}:${this.tag}`;
    }
}

class DockerNotRunningError extends Error {

}

class DockerHubUnavailableError extends Error {

}

module.exports = {Image, TruffleDocker, StarkNetDocker};
