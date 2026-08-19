/*
  SMC MENTOR AI
  DISPLACEMENT ENGINE V2

  Purpose:
  Determine whether the move that breaks
  structure is an impulsive/displacement move.

  IMPORTANT:
  This requirement is especially important
  on 15M.

  5M confirmation does NOT require
  displacement.
*/


function candleBody(candle) {
  return Math.abs(
    candle.close - candle.open
  );
}


function candleRange(candle) {
  return candle.high - candle.low;
}


function bodyRatio(candle) {
  const range = candleRange(candle);

  if (range <= 0) {
    return 0;
  }

  return candleBody(candle) / range;
}


function isBullishCandle(candle) {
  return (
    candle &&
    candle.close > candle.open
  );
}


function isBearishCandle(candle) {
  return (
    candle &&
    candle.close < candle.open
  );
}


/*
  Basic displacement check.

  This is intentionally configurable.
  We will later calibrate it against your
  mentor's actual chart examples.
*/

function isBullishDisplacement(
  candle,
  minimumBodyRatio = 0.60
) {
  if (!candle) {
    return false;
  }

  return (
    isBullishCandle(candle) &&
    bodyRatio(candle) >= minimumBodyRatio
  );
}


function isBearishDisplacement(
  candle,
  minimumBodyRatio = 0.60
) {
  if (!candle) {
    return false;
  }

  return (
    isBearishCandle(candle) &&
    bodyRatio(candle) >= minimumBodyRatio
  );
}


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


/*
  Find the displacement candle that caused
  or immediately participated in the BOS.

  We inspect the candles around the BOS
  rather than assuming every BOS candle
  is automatically displacement.
*/

function findBOSDisplacement(
  candles,
  bos,
  direction
) {
  if (
    !Array.isArray(candles) ||
    !bos ||
    typeof bos.index !== "number"
  ) {
    return null;
  }

  const bosIndex = bos.index;

  /*
    Start with the candle that actually
    closed beyond the structural level.
  */

  const bosCandle =
    candles[bosIndex];

  if (
    isDisplacement(
      bosCandle,
      direction
    )
  ) {
    return {
      index: bosIndex,
      candle: bosCandle,
      type: "BOS_CANDLE",
      valid: true
    };
  }

  /*
    If the BOS candle itself isn't strong,
    inspect the immediately preceding candle.

    This helps us identify cases where the
    impulsive expansion begins just before
    the actual structure-breaking close.
  */

  if (bosIndex > 0) {
    const previous =
      candles[bosIndex - 1];

    if (
      isDisplacement(
        previous,
        direction
      )
    ) {
      return {
        index: bosIndex - 1,
        candle: previous,
        type: "PRE_BOS_DISPLACEMENT",
        valid: true
      };
    }
  }

  return null;
}


/*
  Determine whether a BOS was actually
  caused by displacement.
*/

function bosCausedByDisplacement(
  candles,
  bos,
  direction
) {
  const displacement =
    findBOSDisplacement(
      candles,
      bos,
      direction
    );

  return {
    valid: displacement !== null,
    displacement
  };
}


module.exports = {
  candleBody,
  candleRange,
  bodyRatio,
  isBullishDisplacement,
  isBearishDisplacement,
  isDisplacement,
  findBOSDisplacement,
  bosCausedByDisplacement
};
