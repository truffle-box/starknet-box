import { Image, StarkNetDocker } from './starknet-docker.js';

const image = new Image('dkillen/cairo-starknet-cli','0.6.2');
const starkNetDocker = new StarkNetDocker(image);

const currentDir = process.cwd();
starkNetDocker.runTests(currentDir);
