import { TruffleDocker } from './truffle_docker.mjs';
import { StarkNetDevnetError } from './errors.mjs';

/**
 * A class providing methods for running a StarkNet Devnet container.
 * @extends TruffleDocker
 */
 class StarkNetDevnetDocker extends TruffleDocker {
    /**
     * Create a StarkNetDevnetDocker object.
     * @constructor
     * @param {Image} image - The Docker image to be run.
     */
    constructor(image) {
        super();
        this._image = image;
    }

    /**
     * Spins up the StarkNet Devnet container ready for use.
     * @method
     * @returns {Object} The results of running the Docker container.
     * @throws {StarkNetDevnetError} An error occurred while starting Devnet.
     */
    runDevnet = async () => {
        // Get the repo:tag string for the image to run.
        const repoTag = this._image.getRepoTag();

        // if the starknet-devnet docker network does not exist, create it.
        const opts = {
            "filters": {
                "name": ["starknet-devnet"]
            }
        };
        const networks = await this._docker.listNetworks(opts);
        if (networks.length === 0) {
            await this.createNetwork({"Name": "starknet-devnet"});
        }

        const config = {
            "name": "starknet-devnet",
            "AttachStdin": true,
            "AttachStdout": true,
            "AttachStderr": true,
            "Tty": true,
            "OpenStdin": true,
            "StdinOnce": true,
            "ExposedPorts": {
                "5000/tcp": {}
            },
            "Hostconfig": {
                "PortBindings": {
                    "5000/tcp": [
                        {
                            "HostIp": "127.0.0.1",
                            "HostPort": "5000"
                        }
                    ]
                },
                "NetworkMode": "starknet-devnet",
                "Autoremove": true
            }
        };

        let result;
        try {
            result = await this.runContainer(repoTag, config);            
        } catch (error) {
            throw new StarkNetDevnetError(`An error occurred while starting Devnet: ${error.message}`);
        }
        return result;
    };
} 

export { StarkNetDevnetDocker };