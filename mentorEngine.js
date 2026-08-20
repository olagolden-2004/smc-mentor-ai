const { detectStructure } = require("./structure");
const { analyzeBOS } = require("./bosEngine");
const { validateOBFVG } = require("./obFvgEngine");
const {
  isLiquidityCorrectSide,
  isLiquidityNearOrderBlock
} = require("./liquidity");

const {
  validateLiquiditySequence
} = require("./liquiditySequence");

const {
  aggressiveEntryCheck,
  determineEntryMode
} = require("./entryMode");

const {
  buildConfirmationResult
} = require("./confirmation");


function analyzeMentorSetup({
  daily,
  fourHour,
  oneHour,
  fifteenMinute,
  fiveMinute = null,

  dailyLiquidity = [],
  fourHourLiquidity = [],
  oneHourLiquidity = [],
  fifteenMinuteLiquidity = [],

  fifteenMinuteFVGs = [],
  fiveMinuteFVGs = [],

  confirmation = {}
}) {

  /*
    ========================================
    1. DAILY STRUCTURE
    ========================================
  */

  const dailyStructure =
    detectStructure(daily);

  if (
    !dailyStructure.valid ||
    dailyStructure.direction === "NEUTRAL" ||
    dailyStructure.direction === "UNKNOWN"
  ) {
    return {
      signal: "WAIT",
      reason: "Daily structure is unclear",
      daily: dailyStructure
    };
  }


  /*
    ========================================
    2. 4H STRUCTURE
    ========================================
  */

  const fourHourStructure =
    detectStructure(fourHour);

  if (
    !fourHourStructure.valid ||
    fourHourStructure.direction === "NEUTRAL" ||
    fourHourStructure.direction === "UNKNOWN"
  ) {
    return {
      signal: "WAIT",
      reason: "4H structure is unclear",

      daily: dailyStructure,
      fourHour: fourHourStructure
    };
  }


  /*
    ========================================
    3. 1H STRUCTURE
    ========================================
  */

  const oneHourStructure =
    detectStructure(oneHour);

  if (
    !oneHourStructure.valid ||
    oneHourStructure.direction === "NEUTRAL" ||
    oneHourStructure.direction === "UNKNOWN"
  ) {
    return {
      signal: "WAIT",
      reason: "1H structure is unclear",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure
    };
  }


  /*
    ========================================
    4. HIGHER-TIMEFRAME ALIGNMENT
    ========================================
  */

  const higherTimeframeAligned =
    dailyStructure.direction ===
      fourHourStructure.direction &&
    fourHourStructure.direction ===
      oneHourStructure.direction;


  if (!higherTimeframeAligned) {
    return {
      signal: "WAIT",

      reason:
        "Daily, 4H and 1H are not aligned",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure
    };
  }


  /*
    ========================================
    5. 15M STRUCTURE
    ========================================
  */

  const fifteenMinuteStructure =
    detectStructure(fifteenMinute);

  if (
    !fifteenMinuteStructure.valid ||
    fifteenMinuteStructure.direction === "NEUTRAL" ||
    fifteenMinuteStructure.direction === "UNKNOWN"
  ) {
    return {
      signal: "WAIT",

      reason:
        "15M structure is unclear",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure
    };
  }


  /*
    15M must align with the higher-timeframe
    direction for the main setup.
  */

  if (
    fifteenMinuteStructure.direction !==
    dailyStructure.direction
  ) {
    return {
      signal: "WAIT",

      reason:
        "15M direction does not align with higher timeframe",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure
    };
  }


  /*
    ========================================
    6. 15M BOS + DISPLACEMENT + OB
    ========================================
  */

  const bosAnalysis =
    analyzeBOS({
      candles: fifteenMinute,
      structure:
        fifteenMinuteStructure,
      direction:
        fifteenMinuteStructure.direction
    });


  if (!bosAnalysis.valid) {
    return {
      signal: "WAIT",

      reason:
        "15M BOS does not have the required displacement",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis
    };
  }


  const orderBlock =
    bosAnalysis.orderBlock;


  /*
    ========================================
    7. OB + FVG
    ========================================
  */

  const obFvg =
    validateOBFVG({
      orderBlock,

      fvgs:
        fifteenMinuteFVGs,

      direction:
        fifteenMinuteStructure.direction
    });


  if (!obFvg.valid) {
    return {
      signal: "WAIT",

      reason:
        "15M Order Block does not have a nearby FVG",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis,

      obFvg
    };
  }


  /*
    ========================================
    8. FIND CORRECT LIQUIDITY
    ========================================
  */

  const validLiquidity =
    fifteenMinuteLiquidity.filter(
      liquidity => {

        const correctSide =
          isLiquidityCorrectSide(
            liquidity.price,
            orderBlock,
            fifteenMinuteStructure.direction
          );

        const closeEnough =
          isLiquidityNearOrderBlock(
            liquidity.price,
            orderBlock
          );

        return (
          correctSide &&
          closeEnough
        );
      }
    );


  if (validLiquidity.length === 0) {
    return {
      signal: "WAIT",

      reason:
        "No valid liquidity close to the 15M Order Block",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis,

      obFvg,

      liquidity: []
    };
  }


  /*
    ========================================
    9. LIQUIDITY SWEEP → OB TAP
    ========================================
  */

  let sequence = null;

  for (
    const liquidity of validLiquidity
  ) {

    const result =
      validateLiquiditySequence({
        candles:
          fifteenMinute,

        liquidityPrice:
          liquidity.price,

        orderBlock,

        direction:
          fifteenMinuteStructure.direction
      });

    if (result.valid) {
      sequence = {
        liquidity,
        result
      };

      break;
    }
  }


  if (!sequence) {
    return {
      signal: "WAIT",

      reason:
        "No valid liquidity sweep followed by OB tap",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis,

      obFvg,

      liquidity:
        validLiquidity
    };
  }


  /*
    ========================================
    10. AGGRESSIVE ENTRY CHECK
    ========================================
  */

  const aggressive =
    aggressiveEntryCheck({

      higherTimeframeAligned,

      higherTimeframeOBIntact:
        true,

      structureValid:
        true,

      impulsiveMove:
        bosAnalysis.displacement.valid,

      impulsiveMoveCausedBOS:
        bosAnalysis.displacement.valid,

      orderBlockValid:
        true,

      obNearFVG:
        obFvg.valid,

      liquidityValid:
        true,

      liquidityNearOB:
        true,

      liquiditySwept:
        true,

      priceTappedOrderBlock:
        true,

      intermediateOrderBlock:
        false
    });


  /*
    ========================================
    11. DECIDE ENTRY MODE
    ========================================
  */

  const entryMode =
    determineEntryMode({

      setupValid: true,

      aggressive:
        aggressive.valid
    });


  /*
    ========================================
    12. AGGRESSIVE ENTRY
    ========================================
  */

  if (
    entryMode.mode ===
    "AGGRESSIVE"
  ) {

    return {
      signal: "AGGRESSIVE",

      direction:
        fifteenMinuteStructure.direction,

      entryMode,

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis,

      orderBlock,

      obFvg,

      liquidity:
        sequence.liquidity,

      sequence:
        sequence.result
    };
  }


  /*
    ========================================
    13. CONFIRMATION
    ========================================
  */

  if (!fiveMinute) {
    return {
      signal:
        "CONFIRMATION_REQUIRED",

      direction:
        fifteenMinuteStructure.direction,

      entryMode,

      reason:
        "15M setup is valid but aggressive entry is not allowed",

      daily: dailyStructure,
      fourHour: fourHourStructure,
      oneHour: oneHourStructure,
      fifteenMinute:
        fifteenMinuteStructure,

      bos: bosAnalysis,

      orderBlock,

      obFvg,

      liquidity:
        sequence.liquidity,

      sequence:
        sequence.result
    };
  }


  /*
    5M confirmation.
    NO displacement requirement.
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
        fifteenMinuteStructure.direction,

      reason:
        "5M confirmation failed",

      confirmation:
        confirmationResult
    };
  }


  /*
    ========================================
    14. FINAL CONFIRMATION ENTRY
    ========================================
  */

  return {
    signal: "CONFIRMATION",

    direction:
      fifteenMinuteStructure.direction,

    entryMode,

    daily: dailyStructure,
    fourHour: fourHourStructure,
    oneHour: oneHourStructure,
    fifteenMinute:
      fifteenMinuteStructure,

    bos: bosAnalysis,

    orderBlock,

    obFvg,

    liquidity:
      sequence.liquidity,

    sequence:
      sequence.result,

    confirmation:
      confirmationResult
  };
}


module.exports = {
  analyzeMentorSetup
};
