function validateSetup({
  direction,
  structureValid,
  impulsiveBOS,
  orderBlockValid,
  fvgValid,
  liquidityValid,
  liquiditySwept,
  higherTimeframeAligned,
  higherTimeframeOBIntact
}) {
  const checks = {
    directionValid:
      direction === "BULLISH" ||
      direction === "BEARISH",

    structureValid,

    impulsiveBOS,

    orderBlockValid,

    fvgValid,

    liquidityValid,

    liquiditySwept,

    higherTimeframeAligned,

    higherTimeframeOBIntact
  };

  const valid =
    checks.directionValid &&
    checks.structureValid &&
    checks.impulsiveBOS &&
    checks.orderBlockValid &&
    checks.fvgValid &&
    checks.liquidityValid &&
    checks.liquiditySwept &&
    checks.higherTimeframeAligned &&
    checks.higherTimeframeOBIntact;

  return {
    valid,
    checks
  };
}

module.exports = {
  validateSetup
};
