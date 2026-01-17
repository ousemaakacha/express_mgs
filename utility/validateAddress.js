function validateAddress({ via, numero_civico, cap, citta }) {
  //Regex
  const viaRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
  const civicoRegex = /^[0-9]+([\/\\][0-9]+)?$/;
  const capRegex = /^[0-9]+$/;
  const cittaRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;

  //Via
  if (!via || typeof via !== "string" || !viaRegex.test(via)) {
    return {
      valid: false,
      error: "La via può contenere solo lettere e spazi",
    };
  }

  //Numero civico
  if (
    !numero_civico ||
    typeof numero_civico !== "string" ||
    !civicoRegex.test(numero_civico)
  ) {
    return {
      valid: false,
      error:
        "Il numero civico deve contenere solo numeri ed eventualmente '/' o '\\' come separatore",
    };
  }

  //CAP
  if (!cap || typeof cap !== "string" || !capRegex.test(cap)) {
    return {
      valid: false,
      error: "Il CAP deve contenere solo numeri senza spazi",
    };
  }

  //Città
  if (!citta || typeof citta !== "string" || !cittaRegex.test(citta)) {
    return {
      valid: false,
      error: "La città può contenere solo lettere e spazi",
    };
  }

  return { valid: true };
}

module.exports = validateAddress;
