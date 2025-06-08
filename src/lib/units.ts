export function parseUnits(value: string, decimals: number): bigint {
  const [whole, fraction = ""] = value.split(".");
  const wholePart = whole === "" ? "0" : whole;
  const fractionPart = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${wholePart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  return BigInt(combined || "0");
}

