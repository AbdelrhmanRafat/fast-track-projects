/**
 * Extract backend error message from error.details
 * Handles multiple backend response formats (Laravel, Express, custom formats)
 */
export function extractBackendMessage(error: any, defaultMessage: string): string {
  const d = error?.details;
  
  if (!d) return error.message || defaultMessage;
  if (typeof d === "string") return d;
  if (d.message) return d.message;
  
  if (d.error) {
    if (typeof d.error === "string") return d.error;
    if (d.error.message) return d.error.message;
  }
  
  if (d.errors) {
    if (typeof d.errors === "string") return d.errors;
    if (Array.isArray(d.errors)) return d.errors[0];
    if (typeof d.errors === "object") {
      const firstKey = Object.keys(d.errors)[0];
      const firstError = d.errors[firstKey];
      if (Array.isArray(firstError)) return firstError[0];
      return firstError;
    }
  }
  
  if (d.msg) return d.msg;
  return error.message || defaultMessage;
}

