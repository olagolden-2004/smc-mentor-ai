/*
  SMC MENTOR AI
  LIQUIDITY SEQUENCE ENGINE

  Required sequence:

  BUY:
    Liquidity above OB
      ↓
    Liquidity sweep
      ↓
    OB tap

  SELL:
    Liquidity below OB
      ↓
    Liquidity sweep
      ↓
    OB tap
*/


function priceTouchedOrderBlock(
  candle,
  orderBlock,
  direction
) {
  if (!candle || !orderBlock) {
    return false;
  }

  /*
    BUY:
    Candle must reach the OB.
  */

  if (direction === "BULLISH") {
    return (
      candle.low <=
        orderBlock.high &&
      candle.high >=
        orderBlock.low
    );
  }

  /*
    SELL:
    Candle must reach the OB.
  */

  if (direction === "BEARISH") {
    return (
      candle.high >=
        orderBlock.low &&
      candle.low <=
        orderBlock.high
    );
  }

  return false;
}


/*
  Find the first candle that taps the OB
  AFTER the liquidity sweep.

  This prevents:

  OB tap → liquidity sweep

  from being incorrectly treated as:

  liquidity sweep → OB tap
*/

function findOBTapAfterSweep({
  candles,
  sweepIndex,
  orderBlock,
  direction
}) {
  if (
    !Array.isArray(candles) ||
    !orderBlock ||
    typeof sweepIndex !== "number"
  ) {
    return null;
  }

  for (
    let i = sweepIndex + 1;
    i < candles.length;
    i++
  ) {
    if (
      priceTouchedOrderBlock(
        candles[i],
        orderBlock,
        direction
      )
    ) {
      return {
        index: i,

        candle:
          candles[i]
      };
    }
  }

  return null;
}


/*
  Find the liquidity sweep.

  BUY:
    price trades above liquidity.

  SELL:
    price trades below liquidity.
*/

function findLiquiditySweep({
  candles,
  liquidityPrice,
  direction
}) {
  if (
    !Array.isArray(candles) ||
    typeof liquidityPrice !== "number"
  ) {
    return null;
  }

  for (
    let i = 0;
    i < candles.length;
    i++
  ) {
    const candle =
      candles[i];

    if (
      direction === "BULLISH" &&
      candle.high >
        liquidityPrice
    ) {
      return {
        index: i,

        candle,

        type: "BUY_SIDE_LIQUIDITY_SWEEP",

        liquidityPrice
      };
    }

    if (
      direction === "BEARISH" &&
      candle.low <
        liquidityPrice
    ) {
      return {
        index: i,

        candle,

        type: "SELL_SIDE_LIQUIDITY_SWEEP",

        liquidityPrice
      };
    }
  }

  return null;
}


/*
  Complete sequence validation.
*/

function validateLiquiditySequence({
  candles,
  liquidityPrice,
  orderBlock,
  direction
}) {
  const sweep =
    findLiquiditySweep({
      candles,
      liquidityPrice,
      direction
    });

  if (!sweep) {
    return {
      valid: false,

      reason:
        "Liquidity has not been swept",

      sweep: null,

      obTap: null
    };
  }

  const obTap =
    findOBTapAfterSweep({
      candles,

      sweepIndex:
        sweep.index,

      orderBlock,

      direction
    });

  if (!obTap) {
    return {
      valid: false,

      reason:
        "Liquidity swept but OB was not tapped afterward",

      sweep,

      obTap: null
    };
  }

  return {
    valid: true,

    reason:
      "Liquidity sweep followed by OB tap",

    sweep,

    obTap
  };
}


module.exports = {
  priceTouchedOrderBlock,
  findOBTapAfterSweep,
  findLiquiditySweep,
  validateLiquiditySequence
};
