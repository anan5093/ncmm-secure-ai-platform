/**
 * Adversarial Test: Bidi Override Attacks
 * U+202E Right-to-Left Override and related bidi control chars
 */
const { normalizeInput } = require('../../backend/src/firewall/layer1_normalizer');

describe('Bidi Override Attacks', () => {

  test('U+202E (RLO) is stripped from query', () => {
    const payload = 'normal\u202E injection_hidden\u202C text';
    const { normalized, flags } = normalizeInput(payload);
    expect(normalized).not.toContain('\u202E');
    expect(flags).toContain('BIDI_OVERRIDE_DETECTED');
  });

  test('U+202D (LRO - Left-to-Right Override) is stripped', () => {
    const payload = '\u202D forced direction text';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u202D');
  });

  test('U+202A (Left-to-Right Embedding) is stripped', () => {
    const payload = '\u202A embedded text \u202C';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u202A');
    expect(normalized).not.toContain('\u202C');
  });

  test('U+202B (Right-to-Left Embedding) is stripped', () => {
    const payload = '\u202B embedded rtl text \u202C';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u202B');
  });

  test('U+2066 (Left-to-Right Isolate) is stripped', () => {
    const payload = '\u2066isolated\u2069 text';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u2066');
    expect(normalized).not.toContain('\u2069');
  });

  test('U+2067 (Right-to-Left Isolate) is stripped', () => {
    const payload = '\u2067rtl isolated\u2069';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u2067');
  });

  test('U+2068 (First Strong Isolate) is stripped', () => {
    const payload = '\u2068first strong\u2069';
    const { normalized } = normalizeInput(payload);
    expect(normalized).not.toContain('\u2068');
  });

  test('classic RLO attack reveals hidden text after stripping', () => {
    // Classic bidi attack: "noitcejni" reversed appears as "injection" via RLO
    const payload = 'This is a safe query \u202E noitcejni \u202C and continues.';
    const { normalized, flags } = normalizeInput(payload);
    expect(flags).toContain('BIDI_OVERRIDE_DETECTED');
    // After stripping: visible injection keyword is now readable
    expect(normalized).toContain('noitcejni');
    expect(normalized).not.toContain('\u202E');
  });

  test('RLO injection combined with zero-width chars', () => {
    const payload = 'query\u200B\u202E hidden_attack\u202C\u200B continuation';
    const { normalized, flags } = normalizeInput(payload);
    expect(normalized).not.toContain('\u202E');
    expect(normalized).not.toContain('\u200B');
    expect(flags).toContain('BIDI_OVERRIDE_DETECTED');
    expect(flags).toContain('ZERO_WIDTH_CHARS_DETECTED');
  });

  test('all U+202A through U+202E are stripped', () => {
    for (let code = 0x202A; code <= 0x202E; code++) {
      const char = String.fromCodePoint(code);
      const payload = `test ${char} content`;
      const { normalized } = normalizeInput(payload);
      expect(normalized).not.toContain(char);
    }
  });
});
