/**
 * Firewall Layer 1 — Unicode Normalizer
 * NFKC normalization + zero-width character strip + bidi override strip.
 * Must run on ALL user inputs before any further processing.
 */

/**
 * Zero-width and invisible Unicode codepoints (U+200B to U+200D, U+FEFF, U+2060)
 */
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u2060]/g;

/**
 * Bidirectional override codepoints (U+202A–202E, U+2066–2069)
 * These can be used to reverse text direction and hide injected content.
 */
const BIDI_OVERRIDE_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

/**
 * Additional homoglyph-prone character ranges (Fraktur, Mathematical alphanumeric symbols)
 * NFKC normalization handles most of these, but we log detected instances.
 */
const SUSPICIOUS_MATH_ALPHA = /[\u{1D400}-\u{1D7FF}]/gu;

/**
 * Normalize user input through Layer 1 checks.
 * @param {string} rawQuery
 * @returns {{ normalized: string, flagged: boolean, flags: string[] }}
 */
function normalizeInput(rawQuery) {
  if (typeof rawQuery !== 'string') {
    throw new Error('Query must be a string');
  }

  const flags = [];

  // Check for suspicious patterns before normalization
  if (ZERO_WIDTH_REGEX.test(rawQuery)) {
    flags.push('ZERO_WIDTH_CHARS_DETECTED');
  }
  if (BIDI_OVERRIDE_REGEX.test(rawQuery)) {
    flags.push('BIDI_OVERRIDE_DETECTED');
  }
  if (SUSPICIOUS_MATH_ALPHA.test(rawQuery)) {
    flags.push('MATH_ALPHA_UNICODE_DETECTED');
  }

  // Reset regex lastIndex after .test()
  ZERO_WIDTH_REGEX.lastIndex = 0;
  BIDI_OVERRIDE_REGEX.lastIndex = 0;
  SUSPICIOUS_MATH_ALPHA.lastIndex = 0;

  // Step 1: NFKC normalization (handles Fraktur, fullwidth, superscript, etc.)
  let normalized = rawQuery.normalize('NFKC');

  // Step 2: Strip zero-width characters
  normalized = normalized.replace(ZERO_WIDTH_REGEX, '');

  // Step 3: Strip bidi override characters
  normalized = normalized.replace(BIDI_OVERRIDE_REGEX, '');

  // Step 4: Collapse excessive whitespace
  normalized = normalized.replace(/\s{3,}/g, '  ').trim();

  // Step 5: Length guard (1024 char limit)
  if (normalized.length > 1024) {
    normalized = normalized.substring(0, 1024);
    flags.push('INPUT_TRUNCATED_AT_1024');
  }

  if (normalized.length === 0) {
    throw new Error('Query is empty after normalization');
  }

  return {
    normalized,
    flagged: flags.length > 0,
    flags
  };
}

module.exports = { normalizeInput };
