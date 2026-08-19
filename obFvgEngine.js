/*
  SMC MENTOR AI
  ORDER BLOCK + FVG ENGINE

  Rule:
  An entry-relevant Order Block must have
  a Fair Value Gap very close to it.

  We do NOT use an arbitrary fixed distance.
  The relationship is evaluated relative
  to the size of the Order Block.
*/


function getZoneDistance(
  orderBlock,
  fvg
) {
  if (!orderBlock || !fvg) {
    return Infinity;
  }

  /*
    Zones overlap or touch.
  */

  if (
    orderBlock.low <= fvg.high &&
    orderBlock.high >= fvg.low
  ) {
    return 0;
  }

  /*
    FVG is above the OB.
  */

  if (fvg.low > orderBlock.high) {
    return fvg.low - orderBlock.high;
  }

  /*
    FVG is below the OB.
  */

  if (orderBlock.low > fvg.high) {
    return orderBlock.low - fvg.high;
  }

  return Infinity;
}


/*
  Compare the gap between the OB and FVG
  against the size of the OB.

  This prevents a tiny OB from accepting
  an FVG that is extremely far away.
*/

function calculateRelativeDistance(
  orderBlock,
  fvg
) {
  const distance =
    getZoneDistance(
      orderBlock,
      fvg
    );

  const obSize =
    orderBlock.high -
    orderBlock.low;

  if (obSize <= 0) {
    return Infinity;
  }

  return distance / obSize;
}


/*
  Determine whether the FVG is
  "very close" to the OB.

  The ratio is deliberately conservative.

  Example:

  OB size = 10
  maximum gap = 5

  relative distance = 0.5

  We can calibrate this later against
  your mentor's charts.
*/

function isFVGVeryCloseToOB(
  orderBlock,
  fvg,
  maximumRelativeDistance = 0.50
) {
  if (!orderBlock || !fvg) {
    return false;
  }

  const relativeDistance =
    calculateRelativeDistance(
      orderBlock,
      fvg
    );

  return (
    relativeDistance <=
    maximumRelativeDistance
  );
}


/*
  Find the closest FVG to an Order Block.
*/

function findClosestFVG(
  orderBlock,
  fvgs,
  direction
) {
  if (
    !orderBlock ||
    !Array.isArray(fvgs)
  ) {
    return null;
  }

  let closest = null;
  let closestDistance = Infinity;

  for (const fvg of fvgs) {

    /*
      Bullish OB → prefer bullish FVG.
      Bearish OB → prefer bearish FVG.
    */

    if (
      direction &&
      fvg.type !== direction
    ) {
      continue;
    }

    const distance =
      getZoneDistance(
        orderBlock,
        fvg
      );

    if (
      distance < closestDistance
    ) {
      closestDistance = distance;
      closest = fvg;
    }
  }

  return closest;
}


/*
  Complete OB + FVG validation.
*/

function validateOBFVG({
  orderBlock,
  fvgs,
  direction
}) {
  const fvg =
    findClosestFVG(
      orderBlock,
      fvgs,
      direction
    );

  if (!fvg) {
    return {
      valid: false,
      reason:
        "No matching FVG found",
      orderBlock,
      fvg: null
    };
  }

  const relativeDistance =
    calculateRelativeDistance(
      orderBlock,
      fvg
    );

  const valid =
    isFVGVeryCloseToOB(
      orderBlock,
      fvg
    );

  return {
    valid,

    orderBlock,

    fvg,

    relativeDistance,

    reason: valid
      ? "OB and FVG are very close"
      : "FVG is too far from OB"
  };
}


module.exports = {
  getZoneDistance,
  calculateRelativeDistance,
  isFVGVeryCloseToOB,
  findClosestFVG,
  validateOBFVG
};
