import { formatError, formatResponse } from "./prompt/response-formatter.js";

// Compatibility exports for integrations that imported the original module.
export { formatError };
export function formatSuccess(response, sources, options = {}) {
  return formatResponse(response, { sources, confidence: "medium", ...options });
}
