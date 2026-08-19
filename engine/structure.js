function findSwingHigh(candles, index, strength = 2) {
  if (
    index < strength ||
    index >= candles.length - strength
  ) {
    return false;
  }

  const currentHigh = candles[index].high;

  for (let i = 1; i <= strength; i++) {
    if (
      currentHigh <= candles[index - i].high ||
      currentHigh <= candles[index + i].high
    ) {
      return false;
    }
  }

  return true;
}

function findSwingLow(candles, index, strength = 2) {
  if (
    index < strength ||
    index >= candles.length - strength
  ) {
    return false;
  }

  const currentLow = candles[index].low;

  for (let i = 1; i <= strength; i++) {
    if (
      currentLow >= candles[index - i].low ||
      currentLow >= candles[index + i].low
    ) {
      return false;
    }
  }

  return true;
}

function detectStructure(candles) {
  if (!Array.isArray(candles) || candles.length < 5) {
    return {
      direction: "UNKNOWN",
      bos: false,
      message: "Not enough candle data"
    };
  }

  const swingHighs = [];
  const swingLows = [];

  for (let i = 2; i < candles.length - 2; i++) {
    if (findSwingHigh(candles, i)) {
      swingHighs.push({
        index: i,
        price: candles[i].high
      });
    }

    if (findSwingLow(candles, i)) {
      swingLows.push({
        index: i,
        price: candles[i].low
      });
    }
  }

  if (swingHighs.length < 1 || swingLows.length < 1) {
    return {
      direction: "UNKNOWN",
      bos: false,
      message: "No valid swing structure detected"
    };
  }

  const latestHigh =
    swingHighs[swingHighs.length - 1];

  const latestLow =
    swingLows[swingLows.length - 1];

  const lastCandle =
    candles[candles.length - 1];

  let direction = "NEUTRAL";
  let bos = false;
  let bosType = null;

  if (lastCandle.close > latestHigh.price) {
    direction = "BULLISH";
    bos = true;
    bosType = "BULLISH_BOS";
  }

  if (lastCandle.close < latestLow.price) {
    direction = "BEARISH";
    bos = true;
    bosType = "BEARISH_BOS";
  }

  return {
    direction,
    bos,
    bosType,
    latestSwingHigh: latestHigh,
    latestSwingLow: latestLow
  };
}

module.exports = {
  findSwingHigh,
  findSwingLow,
  detectStructure
};
