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
     */
    runDevnet = async () => {
        // Get the repo:tag string for the image to run.
        const repoTag = this._image.getRepoTag();
        // docker run -it -p 127.0.0.1:5000:5000 shardlabs/starknet-devnet
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
                "NetworkMode": "default",
                "Autoremove": true
            }
        };

        let result;
        try {
            result = await this.runContainer(repoTag, config);            
        } catch (error) {
            throw new StarkNetDevnetError(`An error occured while starting Devnet: ${error}`);
        }
        return result;
    };
} 

export { StarkNetDevnetDocker };