function findEqualHighs(candles, tolerance = 0.0005) {
  const results = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const current = candles[i].high;

    for (let j = i + 1; j < candles.length - 1; j++) {
      const next = candles[j].high;

      const difference =
        Math.abs(current - next);

      const average =
        (current + next) / 2;

      if (
        average > 0 &&
        difference / average <= tolerance
      ) {
        results.push({
          type: "EQUAL_HIGHS",
          price: average,
          firstIndex: i,
          secondIndex: j
        });
      }
    }
  }

  return results;
}

function findEqualLows(candles, tolerance = 0.0005) {
  const results = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const current = candles[i].low;

    for (let j = i + 1; j < candles.length - 1; j++) {
      const next = candles[j].low;

      const difference =
        Math.abs(current - next);

      const average =
        (current + next) / 2;

      if (
        average > 0 &&
        difference / average <= tolerance
      ) {
        results.push({
          type: "EQUAL_LOWS",
          price: average,
          firstIndex: i,
          secondIndex: j
        });
      }
    }
  }

  return results;
}

/*
  Determine whether liquidity is correctly
  positioned relative to the Order Block.

  BUY:
  Liquidity must be ABOVE the OB.

  SELL:
  Liquidity must be BELOW the OB.
*/

function isLiquidityCorrectSide(
  liquidityPrice,
  orderBlock,
  direction
) {
  if (!orderBlock) {
    return false;
  }

  if (direction === "BULLISH") {
    return liquidityPrice > orderBlock.high;
  }

  if (direction === "BEARISH") {
    return liquidityPrice < orderBlock.low;
  }

  return false;
}

/*
  Check whether liquidity is close enough
  to the Order Block.

  The exact distance will be defined later
  according to your mentor's rules.
*/

function isLiquidityNearOrderBlock(
  liquidityPrice,
  orderBlock,
  maxDistance
) {
  if (
    !orderBlock ||
    typeof maxDistance !== "number"
  ) {
    return false;
  }

  const distance =
    Math.min(
      Math.abs(
        liquidityPrice - orderBlock.high
      ),
      Math.abs(
        liquidityPrice - orderBlock.low
      )
    );

  return distance <= maxDistance;
}

/*
  Detect whether price swept liquidity.

  Bullish setup:
  price must trade ABOVE liquidity.

  Bearish setup:
  price must trade BELOW liquidity.
*/

function detectLiquiditySweep(
  candles,
  liquidityPrice,
  direction
) {
  if (
    !Array.isArray(candles) ||
    candles.length === 0
  ) {
    return false;
  }

  const lastCandle =
    candles[candles.length - 1];

  if (direction === "BULLISH") {
    return lastCandle.high > liquidityPrice;
  }

  if (direction === "BEARISH") {
    return lastCandle.low < liquidityPrice;
  }

  return false;
}

module.exports = {
  findEqualHighs,
  findEqualLows,
  isLiquidityCorrectSide,
  isLiquidityNearOrderBlock,
  detectLiquiditySweep
};
