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

const {
  isHTFOrderBlockIntact
} = require("./htfOrderBlock");

const {
  findIntermediateOrderBlock
} = require("./intermediateOB");

const {
  findOrderBlockForBOS
} = require("./orderBlock");


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
    1. DAILY
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
    2. 4H
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

      fourHour:
        fourHourStructure
    };
  }


  /*
    ========================================
    3. 1H
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

      reason:
        "1H structure is unclear",

      daily: dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure
    };
  }


  /*
    ========================================
    4. ALIGNMENT
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

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure
    };
  }


  /*
    ========================================
    5. 15M
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

      daily:
        dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure,

      fifteenMinute:
        fifteenMinuteStructure
    };
  }


  /*
    15M must agree with the
    higher-timeframe direction.
  */

  if (
    fifteenMinuteStructure.direction !==
    dailyStructure.direction
  ) {
    return {
      signal: "WAIT",

      reason:
        "15M is not aligned with higher timeframe",

      daily:
        dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure,

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
      candles:
        fifteenMinute,

      structure:
        fifteenMinuteStructure,

      direction:
        fifteenMinuteStructure.direction
    });


  if (!bosAnalysis.valid) {
    return {
      signal: "WAIT",

      reason:
        "15M BOS does not have required displacement",

      daily:
        dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure,

      fifteenMinute:
        fifteenMinuteStructure,

      bos:
        bosAnalysis
    };
  }


  const orderBlock =
    bosAnalysis.orderBlock;


  if (!orderBlock) {
    return {
      signal: "WAIT",

      reason:
        "No valid 15M Order Block found",

      bos:
        bosAnalysis
    };
  }


  /*
    ========================================
    7. 15M OB + FVG
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
        "15M OB does not have a nearby FVG",

      bos:
        bosAnalysis,

      obFvg
    };
  }


  /*
    ========================================
    8. LIQUIDITY
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


  if (
    validLiquidity.length === 0
  ) {
    return {
      signal: "WAIT",

      reason:
        "No valid liquidity near the 15M OB",

      orderBlock,

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
        "Liquidity sweep followed by OB tap not confirmed",

      orderBlock,

      obFvg,

      liquidity:
        validLiquidity
    };
  }


  /*
    ========================================
    10. FIND MAIN HTF ORDER BLOCK
    ========================================
  */

  const mainHTFStructure =
    oneHourStructure;


  const mainHTFOrderBlock =
    findOrderBlockForBOS(
      oneHour,
      mainHTFStructure.bos,
      mainHTFStructure.direction
    );


  /*
    ========================================
    11. CHECK HTF OB INTEGRITY
    ========================================
  */

  const higherTimeframeOBIntact =
    isHTFOrderBlockIntact({

      orderBlock:
        mainHTFOrderBlock,

      candles:
        oneHour,

      direction:
        oneHourStructure.direction
    });


  /*
    ========================================
    12. CURRENT PRICE
    ========================================
  */

  const latest15M =
    fifteenMinute[
      fifteenMinute.length - 1
    ];


  const currentPrice =
    latest15M
      ? latest15M.close
      : null;


  /*
    ========================================
    13. FIND INTERMEDIATE OB
    ========================================
  */

  let intermediateOrderBlock = null;


  if (
    currentPrice !== null &&
    mainHTFOrderBlock
  ) {

    const candidateBlocks =
      [];


    /*
      Get candidate OBs from the 15M
      structure.

      The main HTF OB is excluded
      automatically by the detector.
    */

    const candidate =
      findOrderBlockForBOS(
        fifteenMinute,
        fifteenMinuteStructure.bos,
        fifteenMinuteStructure.direction
      );


    if (candidate) {
      candidateBlocks.push(
        candidate
      );
    }


    intermediateOrderBlock =
      findIntermediateOrderBlock({

        currentPrice,

        mainOrderBlock:
          mainHTFOrderBlock,

        orderBlocks:
          candidateBlocks,

        direction:
          dailyStructure.direction
      });
  }


  /*
    ========================================
    14. AGGRESSIVE CHECK
    ========================================
  */

  const aggressive =
    aggressiveEntryCheck({

      higherTimeframeAligned,

      higherTimeframeOBIntact,

      structureValid:
        true,

      impulsiveMove:
        bosAnalysis
          .displacement
          .valid,

      impulsiveMoveCausedBOS:
        bosAnalysis
          .displacement
          .valid,

      orderBlockValid:
        true,

      obNearFVG:
        obFvg.valid,

      liquidityValid:
        validLiquidity.length > 0,

      liquidityNearOB:
        true,

      liquiditySwept:
        true,

      priceTappedOrderBlock:
        true,

      intermediateOrderBlock:
        intermediateOrderBlock !== null
    });


  /*
    ========================================
    15. ENTRY MODE
    ========================================
  */

  const entryMode =
    determineEntryMode({

      setupValid:
        true,

      aggressive:
        aggressive.valid
    });


  /*
    ========================================
    16. AGGRESSIVE
    ========================================
  */

  if (
    entryMode.mode ===
    "AGGRESSIVE"
  ) {

    return {

      signal:
        "AGGRESSIVE",

      direction:
        dailyStructure.direction,

      entryMode,

      daily:
        dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure,

      fifteenMinute:
        fifteenMinuteStructure,

      mainHTFOrderBlock,

      higherTimeframeOBIntact,

      intermediateOrderBlock,

      bos:
        bosAnalysis,

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
    17. CONFIRMATION REQUIRED
    ========================================
  */

  if (!fiveMinute) {

    return {

      signal:
        "CONFIRMATION_REQUIRED",

      direction:
        dailyStructure.direction,

      entryMode,

      reason:
        "Valid setup but aggressive entry is not allowed",

      daily:
        dailyStructure,

      fourHour:
        fourHourStructure,

      oneHour:
        oneHourStructure,

      fifteenMinute:
        fifteenMinuteStructure,

      mainHTFOrderBlock,

      higherTimeframeOBIntact,

      intermediateOrderBlock,

      bos:
        bosAnalysis,

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
    18. 5M CONFIRMATION
    ========================================

    NO displacement requirement.
  */

  const confirmationResult =
    buildConfirmationResult({

      choch:
        confirmation.choch === true,

      internalBOS:
        confirmation.internalBOS === true,

      confirmationOrderBlock:
        confirmation.orderBlock ||
        null,

      nearbyFVG:
        confirmation.nearbyFVG === true
    });


  if (
    !confirmationResult.valid
  ) {

    return {

      signal:
        "WAIT",

      direction:
        dailyStructure.direction,

      reason:
        "5M confirmation failed",

      confirmation:
        confirmationResult
    };
  }


  /*
    ========================================
    19. FINAL CONFIRMATION
    ========================================
  */

  return {

    signal:
      "CONFIRMATION",

    direction:
      dailyStructure.direction,

    entryMode,

    daily:
      dailyStructure,

    fourHour:
      fourHourStructure,

    oneHour:
      oneHourStructure,

    fifteenMinute:
      fifteenMinuteStructure,

    mainHTFOrderBlock,

    higherTimeframeOBIntact,

    intermediateOrderBlock,

    bos:
      bosAnalysis,

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
