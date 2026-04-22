export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function regexpByStringPatterns(patterns: string[], flags = "im"): RegExp {
  return new RegExp(patterns.map(escapeRegExp).join("|"), flags);
}
