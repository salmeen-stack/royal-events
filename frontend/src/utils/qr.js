export const extractTokenFromQRValue = (value) => {
  if (typeof value !== "string") return "";

  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  const tokenParamMatch = trimmedValue.match(/[?&]token=([^&]+)/i);
  if (tokenParamMatch?.[1]) {
    return decodeURIComponent(tokenParamMatch[1]);
  }

  const segments = trimmedValue.split(/[/?#]/).filter(Boolean);
  if (segments.length > 0) {
    return segments[segments.length - 1];
  }

  return trimmedValue;
};
