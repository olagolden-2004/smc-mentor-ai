/*
  SMC MENTOR AI
  INTERMEDIATE ORDER BLOCK ENGINE

  Purpose:

  Detect whether another valid Order Block
  exists between current price and the main
  higher-timeframe Order Block.

  If an important intermediate OB exists,
  aggressive entry may be blocked and the
  AI can require 5M confirmation.
*/


function isPriceBetween(
  price,
  zoneLow,
  zoneHigh
) {
  return (
    price >= zoneLow &&
    price <= zoneHigh
  );
}


/*
  Determine whether an intermediate OB
  is positioned between current price
  and the main HTF OB.
*/

function isIntermediateOrderBlock({
  currentPrice,
  mainOrderBlock,
  candidateOrderBlock,
  direction
}) {
  if (
    typeof currentPrice !== "number" ||
    !mainOrderBlock ||
    !candidateOrderBlock
  ) {
    return false;
  }

  /*
    Ignore the main OB itself.
  */

  if (
    candidateOrderBlock.index ===
    mainOrderBlock.index
  ) {
    return false;
  }


  /*
    BULLISH:

    Current price
          ↓

    Intermediate OB
          ↓

    Main HTF OB
  */

  if (direction === "BULLISH") {

    const candidateBelowPrice =
      candidateOrderBlock.high <
      currentPrice;

    const candidateAboveMainOB =
      candidateOrderBlock.low >
      mainOrderBlock.high;

    return (
      candidateBelowPrice &&
      candidateAboveMainOB
    );
  }


  /*
    BEARISH:

    Main HTF OB
          ↑

    Intermediate OB
          ↑

    Current price
  */

  if (direction === "BEARISH") {

    const candidateAbovePrice =
      candidateOrderBlock.low >
      currentPrice;

    const candidateBelowMainOB =
      candidateOrderBlock.high <
      mainOrderBlock.low;

    return (
      candidateAbovePrice &&
      candidateBelowMainOB
    );
  }

  return false;
}


/*
  Find any intermediate OB that could
  interfere with the main setup.
*/

function findIntermediateOrderBlock({
  currentPrice,
  mainOrderBlock,
  orderBlocks,
  direction
}) {
  if (
    !Array.isArray(orderBlocks)
  ) {
    return null;
  }

  for (
    const candidate of orderBlocks
  ) {

    if (
      isIntermediateOrderBlock({
        currentPrice,
        mainOrderBlock,
        candidateOrderBlock:
          candidate,
        direction
      })
    ) {
      return candidate;
    }
  }

  return null;
}


module.exports = {
  isPriceBetween,
  isIntermediateOrderBlock,
  findIntermediateOrderBlock
};
