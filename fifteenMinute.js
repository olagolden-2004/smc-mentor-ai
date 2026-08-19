/*
  15M QUALITY VALIDATOR

  The 15M timeframe is the main entry-decision
  timeframe.

  A valid 15M setup must have:
  - Higher-timeframe alignment
  - Valid Order Block
  - OB close to FVG
  - Liquidity on the correct side of the OB
  - Liquidity close to the OB
  - Liquidity sweep
  - Impulsive move
  - BOS caused by the impulsive move

  IMPORTANT:
  The impulsive/displacement requirement
  applies to 15M.

  It does NOT apply to the 5M confirmation.
*/

function validate15MSetup({
  higherTimeframeAligned = false,

  orderBlock = null,
  obNearFVG = false,

  liquidityPrice = null,
  liquidityCorrectSide = false,
  liquidityNearOB = false,
  liquiditySwept = false,

  impulsiveMove = false,
  bos = false,
  bosCausedByImpulsiveMove = false
}) {
  const checks = {
    higherTimeframeAligned,

    orderBlockExists:
      orderBlock !== null,

    obNearFVG,

    liquidityExists:
      typeof liquidityPrice === "number",

    liquidityCorrectSide,

    liquidityNearOB,

    liquiditySwept,

    impulsiveMove,

    bos,

    bosCausedByImpulsiveMove
  };

  const valid =
    checks.higherTimeframeAligned &&
    checks.orderBlockExists &&
    checks.obNearFVG &&
    checks.liquidityExists &&
    checks.liquidityCorrectSide &&
    checks.liquidityNearOB &&
    checks.liquiditySwept &&
    checks.impulsiveMove &&
    checks.bos &&
    checks.bosCausedByImpulsiveMove;

  return {
    timeframe: "15M",
    valid,
    checks
  };
}


/*
  Determine whether aggressive entry
  is allowed.

  Aggressive entry requires ALL 15M
  quality conditions to remain intact.
*/

function isAggressiveEntryAllowed({
  setupValid = false,

  higherTimeframeAligned = false,
  higherTimeframeOBIntact = false,

  orderBlock = null,
  obNearFVG = false,

  liquidityCorrectSide = false,
  liquidityNearOB = false,
  liquiditySwept = false,

  impulsiveMove = false,
  bosCausedByImpulsiveMove = false,

  intermediateOrderBlock = false
}) {
  if (!setupValid) {
    return false;
  }

  if (!higherTimeframeAligned) {
    return false;
  }

  if (!higherTimeframeOBIntact) {
    return false;
  }

  if (!orderBlock) {
    return false;
  }

  if (!obNearFVG) {
    return false;
  }

  if (!liquidityCorrectSide) {
    return false;
  }

  if (!liquidityNearOB) {
    return false;
  }

  if (!liquiditySwept) {
    return false;
  }

  if (!impulsiveMove) {
    return false;
  }

  if (!bosCausedByImpulsiveMove) {
    return false;
  }

  /*
    If another relevant OB exists before
    the main higher-timeframe OB, aggressive
    entry is not allowed.

    The system should move to confirmation.
  */

  if (intermediateOrderBlock) {
    return false;
  }

  return true;
}


module.exports = {
  validate15MSetup,
  isAggressiveEntryAllowed
};
