import chalk from 'chalk';

// Colours for log output
const info = chalk.hex('#32CD32'); // green
const work = chalk.hex('#FFEF00'); // yellow
const warn = chalk.hex('#FF8000'); // orange
const error = chalk.hex('#FF0000').bold; // bold red

/**
 * Logging class
 */
class Logger {
    /**
     * Output information to the console.
     * @param {string} msg - the message to be output
     * @param {string} detail - the message detail will be appended if supplied
     */
    logInfo(msg, detail = '') {
        console.info(info(msg) + info.bold(detail));
    }

    /**
     * Output information about work items to the console.
     * @param {string} msg - the message to be output
     * @param {string} detail - the message detail will be appended if supplied
     */
    logWork(msg, detail = '') {
        console.log(work(msg) + work.bold(detail));
    }

    /**
     * Output warnings to the console.
     * @param {string} msg - the message to be output
     * @param {string} detail - the message detail will be appended if supplied
     */
    logWarn(msg, detail = '') {
        console.warn(warn(msg) + warn.bold(detail));
    }
    
    /**
     * Output error information to the console.
     * @param {string} msg - the message to be output
     * @param {string} detail - the message detail will be appended if supplied
     */
    logError(msg, detail = '') {
        console.error(error(msg) + error.bold(detail));
    }

    /**
     * Sepearates a header from the logs below.
     */
    logHeader() {
        console.log(info('================================================================================\n'));
    }

    /**
     * Separates a footer from the logs above.
     */
    logFooter() {
        console.log(info('\n================================================================================'));
    }

    /**
     * Separate log output.
     */
    seperator() {
        console.log(info('================================================================================'));
    }
}

export { Logger };
