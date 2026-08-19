/*
  SMC MENTOR AI
  LIQUIDITY ENGINE V2

  Liquidity types:

  1. Equalized highs / lows
  2. Trendline liquidity
  3. Consolidation liquidity

  Core mentor rule:

  BUY:
    liquidity ABOVE the OB

  SELL:
    liquidity BELOW the OB

  Liquidity should also be close to
  the Order Block.
*/


function findEqualHighs(
  candles,
  tolerance = 0.0005
) {
  const results = [];

  if (!Array.isArray(candles)) {
    return results;
  }

  for (
    let i = 1;
    i < candles.length - 1;
    i++
  ) {
    for (
      let j = i + 1;
      j < candles.length - 1;
      j++
    ) {
      const first =
        candles[i].high;

      const second =
        candles[j].high;

      const average =
        (first + second) / 2;

      if (average <= 0) {
        continue;
      }

      const difference =
        Math.abs(first - second);

      if (
        difference / average <=
        tolerance
      ) {
        results.push({
          type: "EQUAL_HIGH_LIQUIDITY",

          price: average,

          firstIndex: i,

          secondIndex: j
        });
      }
    }
  }

  return results;
}


function findEqualLows(
  candles,
  tolerance = 0.0005
) {
  const results = [];

  if (!Array.isArray(candles)) {
    return results;
  }

  for (
    let i = 1;
    i < candles.length - 1;
    i++
  ) {
    for (
      let j = i + 1;
      j < candles.length - 1;
      j++
    ) {
      const first =
        candles[i].low;

      const second =
        candles[j].low;

      const average =
        (first + second) / 2;

      if (average <= 0) {
        continue;
      }

      const difference =
        Math.abs(first - second);

      if (
        difference / average <=
        tolerance
      ) {
        results.push({
          type: "EQUAL_LOW_LIQUIDITY",

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
  TRENDLINE LIQUIDITY

  We identify a basic trendline using
  two reference points.

  This does NOT mean every trendline is
  automatically liquidity.

  It only creates a candidate level for
  later validation.
*/

function createTrendlineLiquidity(
  point1,
  point2,
  currentIndex
) {
  if (
    !point1 ||
    !point2 ||
    point1.index === point2.index
  ) {
    return null;
  }

  const slope =
    (point2.price - point1.price) /
    (point2.index - point1.index);

  const price =
    point2.price +
    slope *
      (currentIndex - point2.index);

  return {
    type: "TRENDLINE_LIQUIDITY",

    price,

    point1,

    point2,

    currentIndex
  };
}


/*
  CONSOLIDATION LIQUIDITY

  A consolidation creates repeated highs
  and/or lows around a relatively narrow
  range.

  We return the upper and lower boundaries
  as liquidity candidates.
*/

function findConsolidationLiquidity(
  candles,
  lookback = 5,
  tolerance = 0.002
) {
  if (
    !Array.isArray(candles) ||
    candles.length < lookback
  ) {
    return [];
  }

  const recent =
    candles.slice(-lookback);

  const highs =
    recent.map(
      candle => candle.high
    );

  const lows =
    recent.map(
      candle => candle.low
    );

  const highest =
    Math.max(...highs);

  const lowest =
    Math.min(...lows);

  const range =
    highest - lowest;

  const midpoint =
    (highest + lowest) / 2;

  if (midpoint <= 0) {
    return [];
  }

  /*
    If the consolidation range is relatively
    narrow, expose its boundaries.
  */

  if (
    range / midpoint <=
    tolerance
  ) {
    return [
      {
        type:
          "CONSOLIDATION_HIGH_LIQUIDITY",

        price: highest,

        startIndex:
          candles.length - lookback,

        endIndex:
          candles.length - 1
      },

      {
        type:
          "CONSOLIDATION_LOW_LIQUIDITY",

        price: lowest,

        startIndex:
          candles.length - lookback,

        endIndex:
          candles.length - 1
      }
    ];
  }

  return [];
}


/*
  BUY:
  liquidity must be ABOVE the OB.

  SELL:
  liquidity must be BELOW the OB.
*/

function isLiquidityCorrectSide(
  liquidityPrice,
  orderBlock,
  direction
) {
  if (
    typeof liquidityPrice !== "number" ||
    !orderBlock
  ) {
    return false;
  }

  if (direction === "BULLISH") {
    return (
      liquidityPrice >
      orderBlock.high
    );
  }

  if (direction === "BEARISH") {
    return (
      liquidityPrice <
      orderBlock.low
    );
  }

  return false;
}


/*
  Determine whether liquidity is
  sufficiently close to the OB.

  We use the OB size rather than a fixed
  number of XAUUSD points.
*/

function liquidityDistance(
  liquidityPrice,
  orderBlock
) {
  if (!orderBlock) {
    return Infinity;
  }

  if (
    liquidityPrice >=
    orderBlock.low &&
    liquidityPrice <=
    orderBlock.high
  ) {
    return 0;
  }

  if (
    liquidityPrice >
    orderBlock.high
  ) {
    return (
      liquidityPrice -
      orderBlock.high
    );
  }

  return (
    orderBlock.low -
    liquidityPrice
  );
}


function isLiquidityNearOrderBlock(
  liquidityPrice,
  orderBlock,
  maximumRelativeDistance = 1.0
) {
  if (!orderBlock) {
    return false;
  }

  const obSize =
    orderBlock.high -
    orderBlock.low;

  if (obSize <= 0) {
    return false;
  }

  const distance =
    liquidityDistance(
      liquidityPrice,
      orderBlock
    );

  return (
    distance / obSize <=
    maximumRelativeDistance
  );
}


/*
  Detect the actual liquidity sweep.

  BUY:
    price trades above liquidity.

  SELL:
    price trades below liquidity.
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
    return (
      lastCandle.high >
      liquidityPrice
    );
  }

  if (direction === "BEARISH") {
    return (
      lastCandle.low <
      liquidityPrice
    );
  }

  return false;
}


/*
  Find liquidity candidates that are
  correctly positioned relative to the OB.
*/

function findValidLiquidity(
  liquidityCandidates,
  orderBlock,
  direction
) {
  if (
    !Array.isArray(
      liquidityCandidates
    ) ||
    !orderBlock
  ) {
    return [];
  }

  return liquidityCandidates.filter(
    liquidity => {
      return isLiquidityCorrectSide(
        liquidity.price,
        orderBlock,
        direction
      );
    }
  );
}


module.exports = {
  findEqualHighs,
  findEqualLows,
  createTrendlineLiquidity,
  findConsolidationLiquidity,
  isLiquidityCorrectSide,
  liquidityDistance,
  isLiquidityNearOrderBlock,
  detectLiquiditySweep,
  findValidLiquidity
};
