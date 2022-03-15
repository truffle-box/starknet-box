import { execSync } from 'child_process';
import fetch from 'node-fetch';
import Docker from 'dockerode';
import { 
    DockerNotFoundError, 
    DockerOperationError, 
    DockerPullImageError, 
    DockerHubUnavailableError 
} from './errors.mjs';

/**
 * TruffleDocker
 * A class providing common methods for interacting with a Docker image/container.
 */
 class TruffleDocker {

    /**
     * Create a TruffleDocker object
     */
    constructor() {
        // If Docker is not running we can't continue.
        if (!this._isDockerRunning()) {
            throw new DockerNotFoundError("Could not find docker! Check that docker is running.");
        }
        // If Docker is running we cam instantiate a new Docker object.
        this._docker = new Docker();
    }

    /**
     * Checks for a local image and if not available pulls it from the Docker Hub
     * @param {Image} image - The Docker image to search Docker Hub for.
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
     * @param {Image} image - The Docker image to search Docker Hub for.
     * @returns {boolean} True if the image is found on the local machine.
     */
    isImageLocal = async (image) => {
        // Get the repo:tag string for the image and iterate through the images
        // in the local repo to check if the one we're interested in exists
        let isLocalImage = false;
        const repoTag = image.getRepoTag();
        const localImages = await this._listLocalImages();

        for (let image of localImages) {
            const tags = image.RepoTags;
            for (let tag of tags) {
                if (tag == repoTag) {
                    isLocalImage = true;
                }
            }
        }
        return isLocalImage;
    }

    /**
     * Check for the image in the Docker Hub registry. This assumes an image with a tag.
     * @param {Image} image - The Docker image to search Docker Hub for.
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
     * @param {Image} image - The image to pull from Docker Hub
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
     * Run a docker container from an image.
     * @param {string} repoTag - The docker repository and tag of the image to run
     * @param {Object} config - THe configuration to pass to the image
     */
    runContainer = async (repoTag, config) => {
        const data = await this._docker.run(repoTag, [], process.stdout, config);
        return data;
    }

    /**
     * Run a docker container from an image and execute a command
     * @param {string} repoTag - The image for the container to run 
     * @param {array} command - An array of commands to be run
     * @param {Object} config - Configuration for the container
     * @returns {Object} The result data from the container run
     */
    runContainerWithCommand = async (repoTag, command, config) => {
        const result = await this._docker.run(repoTag, command, process.stdout, config);
        return result;
    }

    /**
     * Stops a running docker container
     * @param {string} container - The id of the container to stop
     */
    stopContainer = (container) => {
        this._docker.getContainer(container).stop();
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
     * @returns {string} The repoository:tag string. 
     */
    getRepoTag() {
        return `${this.repository}:${this.tag}`;
    }
}

export { Image, TruffleDocker };