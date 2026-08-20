/*
  SMC MENTOR AI
  5M CONFIRMATION ENGINE V2

  Purpose:
  Used ONLY when aggressive 15M entry
  is not allowed.

  Confirmation can be:

  1. CHOCH
  2. Internal BOS

  IMPORTANT:

  5M confirmation does NOT require
  an impulsive move.

  The confirmation OB must:
  - Cause the CHOCH/Internal BOS
  - Be very close to an FVG
*/


function isValidConfirmationStructure({
  choch,
  internalBOS
}) {
  return (
    choch === true ||
    internalBOS === true
  );
}


/*
  Determine the type of confirmation.
*/

function getConfirmationType({
  choch,
  internalBOS
}) {
  if (choch === true) {
    return "CHOCH";
  }

  if (internalBOS === true) {
    return "INTERNAL_BOS";
  }

  return "NONE";
}


/*
  Validate the 5M confirmation OB.
*/

function validateConfirmationOrderBlock({
  orderBlock,
  nearbyFVG
}) {
  if (!orderBlock) {
    return {
      valid: false,
      reason:
        "No confirmation Order Block found"
    };
  }

  if (nearbyFVG !== true) {
    return {
      valid: false,
      reason:
        "Confirmation OB is not close enough to FVG"
    };
  }

  return {
    valid: true,

    orderBlock,

    reason:
      "Confirmation OB is valid and close to FVG"
  };
}


/*
  Build the complete confirmation result.
*/

function buildConfirmationResult({
  choch = false,
  internalBOS = false,
  confirmationOrderBlock = null,
  nearbyFVG = false
}) {
  const structureValid =
    isValidConfirmationStructure({
      choch,
      internalBOS
    });

  if (!structureValid) {
    return {
      valid: false,

      type: "NONE",

      reason:
        "No CHOCH or internal BOS confirmation"
    };
  }

  const type =
    getConfirmationType({
      choch,
      internalBOS
    });

  const orderBlock =
    validateConfirmationOrderBlock({
      orderBlock:
        confirmationOrderBlock,

      nearbyFVG
    });

  if (!orderBlock.valid) {
    return {
      valid: false,

      type,

      reason:
        orderBlock.reason
    };
  }

  return {
    valid: true,

    type,

    orderBlock:
      orderBlock.orderBlock,

    reason:
      `5M ${type} confirmation is valid`
  };
}


module.exports = {
  isValidConfirmationStructure,
  getConfirmationType,
  validateConfirmationOrderBlock,
  buildConfirmationResult
};
