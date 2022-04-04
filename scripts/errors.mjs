/**
 * Docker is not found running locally.
 * @extends Error
 */
 class DockerNotFoundError extends Error {
     /**
      * @constructor
      * @param {string} message - Error message.
      */
    constructor(message) {
        super(message);
        this.name = "DockerNotRunningError";
    }
}

/**
 * An operation with Docker fails.
 * @extends Error
 */
class DockerOperationError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message.
     */
    constructor(message) {
        super(message);
        this.name = "DockerOperationError";
    }
}

/**
 * There is a failure in pulling an image from Docker Hub.
 * @extends Error
 */
class DockerPullError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message.
     */
    constructor(message) {
        super(message);
        this.name = "DockerPullImageError"
    }
}

/**
 * The Docker Hub cannot be reached.
 * @extends Error
 */
class DockerHubError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
    constructor(message) {
        super(message);
        this.name = "DockerHubError";
    }
}

/**
 * There is an error deploying a StarkNet account.
 * @extends Error
 */
class StarkNetAccountCreationError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
     constructor(message) {
        super(message);
        this.name = "StarkNetAccountCreationError";
    }
}

/**
 * There is an error compiling a StarkNet contract.
 * @extends Error
 */
class StarkNetCompileError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
     constructor(message) {
        super(message);
        this.name = "StarkNetCompileError";
    }
}

/**
 * There is an error while deploying a StarkNet contract.
 * @extends Error
 */
class StarkNetDeploymentError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
     constructor(message) {
        super(message);
        this.name = "StarkNetDeploymentError";
    }
}

/**
 * There is an error while deploying a StarkNet contract.
 * @extends Error
 */
class StarkNetFunctionError extends Error {
  /**
   * @constructor
   * @param {string} message - Error message.
   */
  constructor(message) {
    super(message);
    this.name = "StarkNetFunctionError";
  }
}

/**
 * There is an error while running tests on StarkNet contracts.
 * @extends Error
 */
class StarkNetTestingError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
     constructor(message) {
        super(message);
        this.name = "StarkNetTestingError";
    }
}

/**
 * There is an error while running the StarkNet Devnet
 * @extends Error
 */
class StarkNetDevnetError extends Error {
    /**
     * @constructor
     * @param {string} message - Error message. 
     */
     constructor(message) {
        super(message);
        this.name = "StarkNetDevnetError";
    }
}

export {
  DockerHubError,
  DockerNotFoundError,
  DockerOperationError,
  DockerPullError,
  StarkNetAccountCreationError,
  StarkNetCompileError,
  StarkNetDeploymentError,
  StarkNetDevnetError,
  StarkNetFunctionError,
  StarkNetTestingError
};