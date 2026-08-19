/*
  SMC MENTOR AI
  STRUCTURE ENGINE V2

  Purpose:
  - Detect meaningful swing points
  - Identify the latest structural break
  - Determine bullish/bearish direction
  - Provide the structural information needed
    by the OB and displacement engines

  IMPORTANT:
  Daily swing high/low will be treated as
  the main higher-timeframe liquidity reference.

  Lower timeframes can use structure internally
  without requiring the AI to display every
  swing high/low.
*/


function isSwingHigh(candles, index, strength = 2) {
  if (
    index < strength ||
    index >= candles.length - strength
  ) {
    return false;
  }

  const high = candles[index].high;

  for (let i = 1; i <= strength; i++) {
    if (
      high <= candles[index - i].high ||
      high <= candles[index + i].high
    ) {
      return false;
    }
  }

  return true;
}


function isSwingLow(candles, index, strength = 2) {
  if (
    index < strength ||
    index >= candles.length - strength
  ) {
    return false;
  }

  const low = candles[index].low;

  for (let i = 1; i <= strength; i++) {
    if (
      low >= candles[index - i].low ||
      low >= candles[index + i].low
    ) {
      return false;
    }
  }

  return true;
}


function findSwingHighs(
  candles,
  strength = 2
) {
  const swings = [];

  if (!Array.isArray(candles)) {
    return swings;
  }

  for (
    let i = strength;
    i < candles.length - strength;
    i++
  ) {
    if (isSwingHigh(candles, i, strength)) {
      swings.push({
        index: i,
        price: candles[i].high
      });
    }
  }

  return swings;
}


function findSwingLows(
  candles,
  strength = 2
) {
  const swings = [];

  if (!Array.isArray(candles)) {
    return swings;
  }

  for (
    let i = strength;
    i < candles.length - strength;
    i++
  ) {
    if (isSwingLow(candles, i, strength)) {
      swings.push({
        index: i,
        price: candles[i].low
      });
    }
  }

  return swings;
}


/*
  Find the latest Daily swing high and
  swing low.

  These are the only swing points we
  specifically expose as higher-timeframe
  reference points.
*/

function findDailySwings(candles) {
  const swingHighs =
    findSwingHighs(candles, 2);

  const swingLows =
    findSwingLows(candles, 2);

  return {
    swingHigh:
      swingHighs.length > 0
        ? swingHighs[swingHighs.length - 1]
        : null,

    swingLow:
      swingLows.length > 0
        ? swingLows[swingLows.length - 1]
        : null
  };
}


/*
  Find the latest meaningful break of
  a previously identified swing.

  We use candle CLOSE for confirmation
  rather than simply touching the level.
*/

function findLatestBOS(
  candles,
  swingHighs,
  swingLows
) {
  if (
    !Array.isArray(candles) ||
    candles.length === 0
  ) {
    return null;
  }

  let latestBOS = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    /*
      Bullish BOS
    */

    for (const swing of swingHighs) {
      if (
        swing.index < i &&
        candle.close > swing.price
      ) {
        const candidate = {
          type: "BULLISH_BOS",
          index: i,
          brokenLevel: swing.price,
          swingIndex: swing.index,
          close: candle.close
        };

        if (
          !latestBOS ||
          candidate.index > latestBOS.index
        ) {
          latestBOS = candidate;
        }
      }
    }

    /*
      Bearish BOS
    */

    for (const swing of swingLows) {
      if (
        swing.index < i &&
        candle.close < swing.price
      ) {
        const candidate = {
          type: "BEARISH_BOS",
          index: i,
          brokenLevel: swing.price,
          swingIndex: swing.index,
          close: candle.close
        };

        if (
          !latestBOS ||
          candidate.index > latestBOS.index
        ) {
          latestBOS = candidate;
        }
      }
    }
  }

  return latestBOS;
}


/*
  Complete structure analysis.
*/

function detectStructure(candles) {
  if (
    !Array.isArray(candles) ||
    candles.length < 7
  ) {
    return {
      valid: false,
      direction: "UNKNOWN",
      bos: null,
      message: "Not enough candle data"
    };
  }

  const swingHighs =
    findSwingHighs(candles);

  const swingLows =
    findSwingLows(candles);

  if (
    swingHighs.length === 0 ||
    swingLows.length === 0
  ) {
    return {
      valid: false,
      direction: "UNKNOWN",
      bos: null,
      message: "No valid swing structure"
    };
  }

  const latestBOS =
    findLatestBOS(
      candles,
      swingHighs,
      swingLows
    );

  if (!latestBOS) {
    return {
      valid: true,
      direction: "NEUTRAL",
      bos: null,
      swingHighs,
      swingLows,
      message: "No confirmed BOS"
    };
  }

  const direction =
    latestBOS.type === "BULLISH_BOS"
      ? "BULLISH"
      : "BEARISH";

  return {
    valid: true,

    direction,

    bos: latestBOS,

    swingHighs,
    swingLows,

    latestSwingHigh:
      swingHighs[swingHighs.length - 1],

    latestSwingLow:
      swingLows[swingLows.length - 1]
  };
}


module.exports = {
  isSwingHigh,
  isSwingLow,
  findSwingHighs,
  findSwingLows,
  findDailySwings,
  findLatestBOS,
  detectStructure
};
