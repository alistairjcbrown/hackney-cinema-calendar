const path = require("path");
const { setupPolly } = require("setup-polly-jest");
const FetchAdapter = require("@pollyjs/adapter-fetch");
const PersisterFs = require("@pollyjs/persister-fs");

global.navigator.onLine = true;

class FetchAdapterNoWarning extends FetchAdapter {
  constructor(...args) {
    super(...args);
    // Turn off the stupid deprecation message
    const logWarn = this.polly.logger.log.warn;
    this.polly.logger.log.warn = (message, ...rest) => {
      if (message.includes("Node has been deprecated")) return;
      logWarn(message, ...rest);
    };
  }
}

function setupPollyWrapper(mode, dirname) {
  return setupPolly({
    adapters: [FetchAdapterNoWarning],
    persister: PersisterFs,
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(dirname, "__recordings__"),
      },
    },
    mode, // "replay", "record", or "passthrough"
  });
}

module.exports = {
  setupPolly: setupPollyWrapper,
};
