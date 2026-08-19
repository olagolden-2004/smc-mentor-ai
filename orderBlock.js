/*
  SMC MENTOR AI
  ORDER BLOCK ENGINE V2

  Mentor rule:
  - The OB must be connected to the structural break.
  - The candle is marked using its COMPLETE range.
  - Both wicks are included.
*/


function getCandleDirection(candle) {
  if (!candle) {
    return "UNKNOWN";
  }

  if (candle.close > candle.open) {
    return "BULLISH";
  }

  if (candle.close < candle.open) {
    return "BEARISH";
  }

  return "NEUTRAL";
}


function createOrderBlock(
  candle,
  index,
  direction
) {
  if (!candle) {
    return null;
  }

  return {
    index,

    direction,

    high: candle.high,

    low: candle.low,

    open: candle.open,

    close: candle.close,

    /*
      Entire candle is marked.
      Wicks are included.
    */

    includesWicks: true,

    size:
      candle.high - candle.low,

    candleDirection:
      getCandleDirection(candle)
  };
}


/*
  Find candidate OBs before the BOS.

  We look backward from the BOS rather than
  blindly selecting a candle.

  This gives us a group of possible candles
  that may have contributed to the move.
*/

function findCandidateOrderBlocks(
  candles,
  bosIndex,
  direction,
  lookback = 10
) {
  if (
    !Array.isArray(candles) ||
    bosIndex <= 0 ||
    bosIndex >= candles.length
  ) {
    return [];
  }

  const candidates = [];

  const start =
    Math.max(0, bosIndex - lookback);

  for (
    let i = bosIndex - 1;
    i >= start;
    i--
  ) {
    const candle = candles[i];

    if (!candle) {
      continue;
    }

    /*
      For bullish structure, look for a bearish
      candle before the bullish expansion.

      For bearish structure, look for a bullish
      candle before the bearish expansion.
    */

    if (
      direction === "BULLISH" &&
      candle.close < candle.open
    ) {
      candidates.push(
        createOrderBlock(
          candle,
          i,
          direction
        )
      );
    }

    if (
      direction === "BEARISH" &&
      candle.close > candle.open
    ) {
      candidates.push(
        createOrderBlock(
          candle,
          i,
          direction
        )
      );
    }
  }

  return candidates;
}


/*
  Select the nearest valid candidate before
  the BOS.

  Later we will make this selection much
  stricter by requiring the OB to be the
  actual candle responsible for displacement.
*/

function findOrderBlockForBOS(
  candles,
  bos,
  direction
) {
  if (
    !bos ||
    typeof bos.index !== "number"
  ) {
    return null;
  }

  const candidates =
    findCandidateOrderBlocks(
      candles,
      bos.index,
      direction
    );

  if (candidates.length === 0) {
    return null;
  }

  /*
    The closest qualifying candle to the BOS
    is our initial candidate.
  */

  return candidates[0];
}


function isOrderBlockIntact(
  orderBlock,
  currentPrice,
  direction
) {
  if (
    !orderBlock ||
    typeof currentPrice !== "number"
  ) {
    return false;
  }

  /*
    Bullish OB:
    Price should not have completely broken
    below the OB.
  */

  if (direction === "BULLISH") {
    return currentPrice >= orderBlock.low;
  }

  /*
    Bearish OB:
    Price should not have completely broken
    above the OB.
  */

  if (direction === "BEARISH") {
    return currentPrice <= orderBlock.high;
  }

  return false;
}


module.exports = {
  getCandleDirection,
  createOrderBlock,
  findCandidateOrderBlocks,
  findOrderBlockForBOS,
  isOrderBlockIntact
};
