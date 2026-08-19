/*
  5M CONFIRMATION ENGINE

  IMPORTANT:
  A 5M confirmation does NOT require
  an impulsive/displacement move.

  Valid confirmation:
  1. Normal CHOCH
  OR
  2. Internal BOS

  After the structural change, we identify
  the Order Block that caused the change.
*/

function detectCHOCH(
  previousDirection,
  currentDirection
) {
  if (
    !previousDirection ||
    !currentDirection
  ) {
    return false;
  }

  return (
    previousDirection !== "NEUTRAL" &&
    previousDirection !== "UNKNOWN" &&
    currentDirection !== previousDirection
  );
}

function detectInternalBOS(
  previousInternalLevel,
  currentPrice,
  direction
) {
  if (
    typeof previousInternalLevel !== "number" ||
    typeof currentPrice !== "number"
  ) {
    return false;
  }

  if (direction === "BULLISH") {
    return currentPrice > previousInternalLevel;
  }

  if (direction === "BEARISH") {
    return currentPrice < previousInternalLevel;
  }

  return false;
}

/*
  Find the candle used as the candidate
  Order Block for the structural change.

  This is deliberately kept separate because
  later we will make the "caused the change"
  logic more precise.
*/

function findConfirmationOrderBlock(
  candles,
  changeIndex,
  direction
) {
  if (
    !Array.isArray(candles) ||
    changeIndex <= 0 ||
    changeIndex >= candles.length
  ) {
    return null;
  }

  const candle =
    candles[changeIndex - 1];

  return {
    index: changeIndex - 1,
    direction,

    // Entire candle including both wicks.
    high: candle.high,
    low: candle.low,

    includesWicks: true,

    size: candle.high - candle.low
  };
}

/*
  Validate the 5M confirmation setup.

  Required:
  - CHOCH OR Internal BOS
  - Confirmation OB exists
  - Confirmation OB is close to FVG

  NOT required:
  - Impulsive move
*/

function validateConfirmation({
  choch = false,
  internalBOS = false,
  confirmationOrderBlock = null,
  nearbyFVG = false
}) {
  const structuralConfirmation =
    choch || internalBOS;

  if (!structuralConfirmation) {
    return {
      valid: false,
      reason:
        "No 5M CHOCH or internal BOS"
    };
  }

  if (!confirmationOrderBlock) {
    return {
      valid: false,
      reason:
        "No confirmation order block found"
    };
  }

  if (!nearbyFVG) {
    return {
      valid: false,
      reason:
        "Confirmation OB is not close enough to FVG"
    };
  }

  return {
    valid: true,
    reason:
      "5M confirmation conditions satisfied"
  };
}

/*
  Complete 5M confirmation result.
*/

function buildConfirmationResult({
  choch = false,
  internalBOS = false,
  confirmationOrderBlock = null,
  nearbyFVG = false
}) {
  const validation =
    validateConfirmation({
      choch,
      internalBOS,
      confirmationOrderBlock,
      nearbyFVG
    });

  return {
    timeframe: "5M",

    confirmationType: choch
      ? "CHOCH"
      : internalBOS
        ? "INTERNAL_BOS"
        : null,

    impulsiveMoveRequired: false,

    orderBlock:
      confirmationOrderBlock,

    fvgProximity:
      nearbyFVG,

    valid:
      validation.valid,

    reason:
      validation.reason
  };
}

module.exports = {
  detectCHOCH,
  detectInternalBOS,
  findConfirmationOrderBlock,
  validateConfirmation,
  buildConfirmationResult
};
