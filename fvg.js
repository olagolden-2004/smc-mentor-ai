function detectBullishFVG(candles, index) {
  if (index < 2 || index >= candles.length) {
    return null;
  }

  const candle1 = candles[index - 2];
  const candle3 = candles[index];

  // Bullish FVG:
  // candle 3 low is above candle 1 high
  if (candle3.low > candle1.high) {
    return {
      type: "BULLISH",
      high: candle3.low,
      low: candle1.high,
      index
    };
  }

  return null;
}

function detectBearishFVG(candles, index) {
  if (index < 2 || index >= candles.length) {
    return null;
  }

  const candle1 = candles[index - 2];
  const candle3 = candles[index];

  // Bearish FVG:
  // candle 3 high is below candle 1 low
  if (candle3.high < candle1.low) {
    return {
      type: "BEARISH",
      high: candle1.low,
      low: candle3.high,
      index
    };
  }

  return null;
}

function detectFVGs(candles) {
  if (!Array.isArray(candles) || candles.length < 3) {
    return [];
  }

  const fvgs = [];

  for (let i = 2; i < candles.length; i++) {
    const bullish = detectBullishFVG(candles, i);

    if (bullish) {
      fvgs.push(bullish);
    }

    const bearish = detectBearishFVG(candles, i);

    if (bearish) {
      fvgs.push(bearish);
    }
  }

  return fvgs;
}

/*
  Check whether an Order Block is close
  to an FVG.

  IMPORTANT:
  "Very close" is intentionally configurable.
  We are NOT inventing your mentor's exact
  distance yet.
*/

function isOBNearFVG(orderBlock, fvg, maxDistance) {
  if (!orderBlock || !fvg) {
    return false;
  }

  if (typeof maxDistance !== "number") {
    return false;
  }

  const obHigh = orderBlock.high;
  const obLow = orderBlock.low;

  const fvgHigh = fvg.high;
  const fvgLow = fvg.low;

  // Zones overlap/touch.
  if (
    obLow <= fvgHigh &&
    obHigh >= fvgLow
  ) {
    return true;
  }

  // Distance between zones.
  let distance = 0;

  if (obHigh < fvgLow) {
    distance = fvgLow - obHigh;
  } else if (fvgHigh < obLow) {
    distance = obLow - fvgHigh;
  }

  return distance <= maxDistance;
}

module.exports = {
  detectBullishFVG,
  detectBearishFVG,
  detectFVGs,
  isOBNearFVG
};
