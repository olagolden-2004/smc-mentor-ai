/*
  SMC MENTOR AI
  BOS + DISPLACEMENT + ORDER BLOCK ENGINE

  Purpose:
  Connect:

  BOS
    ↓
  Displacement
    ↓
  Order Block
    ↓
  Valid structural setup
*/

const {
  bosCausedByDisplacement
} = require("./displacement");

const {
  findOrderBlockForBOS
} = require("./orderBlock");


function analyzeBOS({
  candles,
  structure,
  direction
}) {
  if (
    !Array.isArray(candles) ||
    !structure ||
    !structure.bos
  ) {
    return {
      valid: false,
      reason: "No valid BOS found"
    };
  }

  const bos =
    structure.bos;

  /*
    Check whether the BOS was produced
    by an impulsive/displacement move.
  */

  const displacement =
    bosCausedByDisplacement(
      candles,
      bos,
      direction
    );

  /*
    Find the candidate Order Block
    associated with the BOS.
  */

  const orderBlock =
    findOrderBlockForBOS(
      candles,
      bos,
      direction
    );

  if (!orderBlock) {
    return {
      valid: false,
      reason:
        "No candidate Order Block found",

      bos,

      displacement
    };
  }

  return {
    valid:
      displacement.valid === true,

    direction,

    bos,

    displacement,

    orderBlock,

    reason:
      displacement.valid
        ? "BOS confirmed with displacement and OB candidate"
        : "BOS found but displacement is missing"
  };
}


module.exports = {
  analyzeBOS
};
