function candleBody(candle) {
  return Math.abs(candle.close - candle.open);
}

function candleRange(candle) {
  return candle.high - candle.low;
}

function bodyRatio(candle) {
  const range = candleRange(candle);

  if (range === 0) {
    return 0;
  }

  return candleBody(candle) / range;
}

function isBullishDisplacement(
  candle,
  minimumBodyRatio = 0.60
) {
  if (!candle) {
    return false;
  }

  const body = candleBody(candle);
  const range = candleRange(candle);

  if (range <= 0) {
    return false;
  }

  return (
    candle.close > candle.open &&
    body / range >= minimumBodyRatio
  );
}

function isBearishDisplacement(
  candle,
  minimumBodyRatio = 0.60
) {
  if (!candle) {
    return false;
  }

  const body = candleBody(candle);
  const range = candleRange(candle);

  if (range <= 0) {
    return false;
  }

  return (
    candle.close < candle.open &&
    body / range >= minimumBodyRatio
  );
}

/*
  Determine whether a candle represents
  an impulsive/displacement move.

  IMPORTANT:
  This is initially a technical filter.
  Later we can make the exact definition
  match your mentor's method.
*/

function isDisplacement(
  candle,
  direction,
  minimumBodyRatio = 0.60
) {
  if (direction === "BULLISH") {
    return isBullishDisplacement(
      candle,
      minimumBodyRatio
    );
  }

  if (direction === "BEARISH") {
    return isBearishDisplacement(
      candle,
      minimumBodyRatio
    );
  }

  return false;
}

module.exports = {
  candleBody,
  candleRange,
  bodyRatio,
  isBullishDisplacement,
  isBearishDisplacement,
  isDisplacement
};
