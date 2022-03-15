/**
 * DockerNotRunningError
 * This error is thrown if Docker is not found running locally.
 */
 class DockerNotFoundError extends Error {
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

/**
 * StarkNetDevnetError
 * Thrown if there is an error while running the StarkNet Devnet
 */
class StarkNetDevnetError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "StarkNetDevnetError";
    }
}

export { 
    DockerHubUnavailableError, 
    DockerNotFoundError, 
    DockerOperationError, 
    DockerPullImageError, 
    StarkNetAccountCreationError, 
    StarkNetCompilationError, 
    StarkNetDeploymentError, 
    StarkNetDevnetError, 
    StarkNetTestingError 
};