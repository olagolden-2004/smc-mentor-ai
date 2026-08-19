const MARKET_CONFIG = require("./marketConfig");

function makeDecision(setup) {
  if (!setup) {
    return MARKET_CONFIG.entryModes.WAIT;
  }

  if (setup.aggressiveValid === true) {
    return MARKET_CONFIG.entryModes.AGGRESSIVE;
  }

  if (setup.confirmationValid === true) {
    return MARKET_CONFIG.entryModes.CONFIRMATION;
  }

  return MARKET_CONFIG.entryModes.WAIT;
}

module.exports = {
  makeDecision
};
