function getCandleRange(candle) {
  return {
    high: candle.high,
    low: candle.low
  };
}

/*
  Mentor OB rule:

  An order block is marked using the
  COMPLETE candle range, including both wicks.

  We are NOT using only:
  open -> close

  We use:
  lowest wick -> highest wick
*/

function createOrderBlock(candle, index, direction) {
  if (!candle) {
    return null;
  }

  const range = getCandleRange(candle);

  return {
    index,

    direction,

    high: range.high,
    low: range.low,

    // Entire candle range is the OB.
    includesWicks: true,

    size: range.high - range.low
  };
}

/*
  Find the candle immediately before
  a structural break.

  This is only the initial detector.
  Later we will make the "caused the BOS"
  logic much stricter according to your
  mentor's exact methodology.
*/

function findCandidateOrderBlock(
  candles,
  breakIndex,
  direction
) {
  if (
    !Array.isArray(candles) ||
    breakIndex <= 0 ||
    breakIndex >= candles.length
  ) {
    return null;
  }

  const candleBeforeBreak =
    candles[breakIndex - 1];

  return createOrderBlock(
    candleBeforeBreak,
    breakIndex - 1,
    direction
  );
}

module.exports = {
  createOrderBlock,
  findCandidateOrderBlock
};
