export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
};

export const sanitizePositiveNumber = (num, fallback = 0) => {
  const parsed = Number(num);
  return isNaN(parsed) || parsed < 0 ? fallback : parsed;
};