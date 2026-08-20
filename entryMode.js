/*
  SMC MENTOR AI
  ENTRY MODE ENGINE

  Determines whether a valid setup should use:

  1. AGGRESSIVE ENTRY
  2. 5M CONFIRMATION
  3. WAIT

  Mentor logic:
  Aggressive entry requires ALL aggressive
  conditions to remain intact.

  Confirmation is used when the main setup
  exists but aggressive entry is not allowed.
*/


function aggressiveEntryCheck({
  higherTimeframeAligned,
  higherTimeframeOBIntact,

  structureValid,
  impulsiveMove,
  impulsiveMoveCausedBOS,

  orderBlockValid,
  obNearFVG,

  liquidityValid,
  liquidityNearOB,
  liquiditySwept,

  priceTappedOrderBlock,

  intermediateOrderBlock
}) {
  const checks = {
    higherTimeframeAligned:
      higherTimeframeAligned === true,

    higherTimeframeOBIntact:
      higherTimeframeOBIntact === true,

    structureValid:
      structureValid === true,

    impulsiveMove:
      impulsiveMove === true,

    impulsiveMoveCausedBOS:
      impulsiveMoveCausedBOS === true,

    orderBlockValid:
      orderBlockValid === true,

    obNearFVG:
      obNearFVG === true,

    liquidityValid:
      liquidityValid === true,

    liquidityNearOB:
      liquidityNearOB === true,

    liquiditySwept:
      liquiditySwept === true,

    priceTappedOrderBlock:
      priceTappedOrderBlock === true,

    intermediateOrderBlock:
      intermediateOrderBlock === true
  };

  /*
    Every aggressive condition must pass.
  */

  const valid =
    checks.higherTimeframeAligned &&
    checks.higherTimeframeOBIntact &&
    checks.structureValid &&
    checks.impulsiveMove &&
    checks.impulsiveMoveCausedBOS &&
    checks.orderBlockValid &&
    checks.obNearFVG &&
    checks.liquidityValid &&
    checks.liquidityNearOB &&
    checks.liquiditySwept &&
    checks.priceTappedOrderBlock &&
    !checks.intermediateOrderBlock;

  return {
    valid,
    checks
  };
}


/*
  Determine whether the setup should
  move to 5M confirmation.

  We only go to confirmation when the
  main setup is valid but aggressive entry
  is not allowed.
*/

function determineEntryMode({
  setupValid,
  aggressive
}) {
  if (!setupValid) {
    return {
      mode: "WAIT",

      reason:
        "Main SMC setup is not valid"
    };
  }

  if (aggressive === true) {
    return {
      mode: "AGGRESSIVE",

      reason:
        "All aggressive-entry conditions are intact"
    };
  }

  return {
    mode: "CONFIRMATION",

    reason:
      "Setup is valid but aggressive-entry conditions are incomplete"
  };
}


module.exports = {
  aggressiveEntryCheck,
  determineEntryMode
};
