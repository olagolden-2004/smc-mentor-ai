const { detectStructure } = require("./structure");
const { validateSetup } = require("./setupValidator");
const { isAggressiveEntryAllowed } = require("./fifteenMinute");
const { buildConfirmationResult } = require("./confirmation");

function analyzeTimeframe(candles) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return {
      valid: false,
      direction: "UNKNOWN",
      structure: null
    };
  }

  const structure = detectStructure(candles);

  return {
    valid: structure.direction !== "UNKNOWN",
    direction: structure.direction,
    structure
  };
}

function analyzeTopDown({
  daily,
  fourHour,
  oneHour,
  fifteenMinute,
  fiveMinute = null,

  setup = {},
  confirmation = {}
}) {
  /*
    STEP 1 — DAILY
  */

  const dailyAnalysis =
    analyzeTimeframe(daily);

  if (!dailyAnalysis.valid) {
    return {
      signal: "WAIT",
      reason: "Daily structure is unclear",
      daily: dailyAnalysis
    };
  }

  /*
    STEP 2 — 4H
  */

  const fourHourAnalysis =
    analyzeTimeframe(fourHour);

  if (!fourHourAnalysis.valid) {
    return {
      signal: "WAIT",
      reason: "4H structure is unclear",
      daily: dailyAnalysis,
      fourHour: fourHourAnalysis
    };
  }

  /*
    STEP 3 — 1H
  */

  const oneHourAnalysis =
    analyzeTimeframe(oneHour);

  if (!oneHourAnalysis.valid) {
    return {
      signal: "WAIT",
      reason: "1H structure is unclear",
      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis
    };
  }

  /*
    STEP 4 — 15M
  */

  const fifteenMinuteAnalysis =
    analyzeTimeframe(fifteenMinute);

  if (!fifteenMinuteAnalysis.valid) {
    return {
      signal: "WAIT",
      reason: "15M structure is unclear",
      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis
    };
  }

  /*
    HIGHER-TIMEFRAME ALIGNMENT

    The first version requires the major
    timeframes to agree.

    We will make the exact mentor alignment
    rules more precise later.
  */

  const higherTimeframeAligned =
    dailyAnalysis.direction ===
      fourHourAnalysis.direction &&
    fourHourAnalysis.direction ===
      oneHourAnalysis.direction;

  if (!higherTimeframeAligned) {
    return {
      signal: "WAIT",
      reason:
        "Higher-timeframe directions are not aligned",

      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis
    };
  }

  /*
    Validate the 15M setup.
  */

  const setupValidation =
    validateSetup({
      direction:
        fifteenMinuteAnalysis.direction,

      structureValid:
        setup.structureValid === true,

      impulsiveBOS:
        setup.impulsiveBOS === true,

      orderBlockValid:
        setup.orderBlockValid === true,

      fvgValid:
        setup.fvgValid === true,

      liquidityValid:
        setup.liquidityValid === true,

      liquiditySwept:
        setup.liquiditySwept === true,

      higherTimeframeAligned: true,

      higherTimeframeOBIntact:
        setup.higherTimeframeOBIntact === true
    });

  /*
    If the complete setup isn't valid,
    do NOT continue to entry.
  */

  if (!setupValidation.valid) {
    return {
      signal: "WAIT",
      reason:
        "15M quality conditions are incomplete",

      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis,

      setup: setupValidation
    };
  }

  /*
    Check whether aggressive entry
    is allowed.
  */

  const aggressive =
    isAggressiveEntryAllowed({
      setupValid: setupValidation.valid,

      higherTimeframeAligned: true,

      higherTimeframeOBIntact:
        setup.higherTimeframeOBIntact === true,

      orderBlock:
        setup.orderBlock || null,

      obNearFVG:
        setup.fvgValid === true,

      liquidityCorrectSide:
        setup.liquidityValid === true,

      liquidityNearOB:
        setup.liquidityNearOB === true,

      liquiditySwept:
        setup.liquiditySwept === true,

      impulsiveMove:
        setup.impulsiveBOS === true,

      bosCausedByImpulsiveMove:
        setup.bosCausedByImpulsiveMove === true,

      intermediateOrderBlock:
        setup.intermediateOrderBlock === true
    });

  /*
    AGGRESSIVE ENTRY
  */

  if (aggressive) {
    return {
      signal: "AGGRESSIVE",

      direction:
        fifteenMinuteAnalysis.direction,

      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis,

      setup: setupValidation
    };
  }

  /*
    If aggressive entry isn't allowed,
    we go down to 5M confirmation.
  */

  if (!fiveMinute) {
    return {
      signal: "CONFIRMATION_REQUIRED",

      direction:
        fifteenMinuteAnalysis.direction,

      reason:
        "Valid setup but aggressive entry conditions are incomplete",

      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis,

      setup: setupValidation
    };
  }

  /*
    5M confirmation.

    IMPORTANT:
    5M does NOT require an impulsive move.
  */

  const confirmationResult =
    buildConfirmationResult({
      choch:
        confirmation.choch === true,

      internalBOS:
        confirmation.internalBOS === true,

      confirmationOrderBlock:
        confirmation.orderBlock || null,

      nearbyFVG:
        confirmation.nearbyFVG === true
    });

  if (!confirmationResult.valid) {
    return {
      signal: "WAIT",

      direction:
        fifteenMinuteAnalysis.direction,

      reason:
        "5M confirmation failed",

      daily: dailyAnalysis,
      fourHour: fourHourAnalysis,
      oneHour: oneHourAnalysis,
      fifteenMinute: fifteenMinuteAnalysis,

      confirmation: confirmationResult
    };
  }

  /*
    CONFIRMATION ENTRY
  */

  return {
    signal: "CONFIRMATION",

    direction:
      fifteenMinuteAnalysis.direction,

    daily: dailyAnalysis,
    fourHour: fourHourAnalysis,
    oneHour: oneHourAnalysis,
    fifteenMinute: fifteenMinuteAnalysis,

    confirmation: confirmationResult
  };
}

module.exports = {
  analyzeTopDown
};
