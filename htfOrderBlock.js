/*
  SMC MENTOR AI
  HIGHER TIMEFRAME ORDER BLOCK ENGINE

  Purpose:
  Track whether the important higher-timeframe
  Order Block is still intact.

  BUY:
    HTF bullish OB becomes invalid when price
    completely breaks below its low.

  SELL:
    HTF bearish OB becomes invalid when price
    completely breaks above its high.
*/


function isHTFOrderBlockIntact({
  orderBlock,
  candles,
  direction
}) {
  if (
    !orderBlock ||
    !Array.isArray(candles) ||
    candles.length === 0
  ) {
    return false;
  }

  for (const candle of candles) {

    if (direction === "BULLISH") {

      /*
        A full close below the OB invalidates
        the bullish block.
      */

      if (
        candle.close <
        orderBlock.low
      ) {
        return false;
      }
    }

    if (direction === "BEARISH") {

      /*
        A full close above the OB invalidates
        the bearish block.
      */

      if (
        candle.close >
        orderBlock.high
      ) {
        return false;
      }
    }
  }

  return true;
}


/*
  Find the latest valid OB associated with
  the latest BOS.
*/

function getHTFOrderBlock({
  candles,
  structure,
  findOrderBlock
}) {
  if (
    !structure ||
    !structure.bos ||
    typeof findOrderBlock !==
      "function"
  ) {
    return null;
  }

  return findOrderBlock(
    candles,
    structure.bos,
    structure.direction
  );
}


module.exports = {
  isHTFOrderBlockIntact,
  getHTFOrderBlock
};
