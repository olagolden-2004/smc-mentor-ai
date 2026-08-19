const MARKET_CONFIG = {
  symbol: "XAUUSD",

  timeframes: {
    daily: "1D",
    fourHour: "4H",
    oneHour: "1H",
    entry: "15M",
    confirmation: "5M"
  },

  entryModes: {
    AGGRESSIVE: "AGGRESSIVE",
    CONFIRMATION: "CONFIRMATION",
    WAIT: "WAIT"
  }
};

module.exports = MARKET_CONFIG;
