const { analyzeTopDown } = require("./topDown");

function makeCandles(direction) {
  const candles = [];

  for (let i = 0; i < 30; i++) {
    const base = 4300 + i * 2;

    candles.push({
      open: base,
      high: base + 4,
      low: base - 2,
      close: direction === "BULLISH"
        ? base + 3
        : base - 1
    });
  }

  return candles;
}

const daily = makeCandles("BULLISH");
const fourHour = makeCandles("BULLISH");
const oneHour = makeCandles("BULLISH");
const fifteenMinute = makeCandles("BULLISH");

const result = analyzeTopDown({
  daily,
  fourHour,
  oneHour,
  fifteenMinute,

  setup: {
    structureValid: true,

    impulsiveBOS: true,

    orderBlockValid: true,

    orderBlock: {
      high: 4350,
      low: 4340
    },

    fvgValid: true,

    liquidityValid: true,

    liquidityNearOB: true,

    liquiditySwept: true,

    higherTimeframeOBIntact: true,

    bosCausedByImpulsiveMove: true,

    intermediateOrderBlock: false
  }
});

console.log(
  JSON.stringify(result, null, 2)
);
