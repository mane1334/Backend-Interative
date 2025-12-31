// Lightweight text normalization helpers to reduce mojibake like "Ci??ssica"
// Attempts: decode common latin1-encoded UTF-8 bytes and clean whitespace

function tryDecodeLatin1ToUtf8(input) {
  if (typeof input !== 'string' || input.length === 0) return input || '';
  try {
    // Detect presence of replacement chars like � or sequences like "??"
    const suspicious = /\uFFFD|\?\?/.test(input) || /Ã|Â|¢|€|™/.test(input);
    if (!suspicious) return input;
    const bytes = new Uint8Array([...input].map(c => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // If decoding made it worse (still contains mojibake markers), fallback
    if (/Ã|Â|¢|€|™/.test(decoded)) return input;
    return decoded;
  } catch (_) {
    return input;
  }
}

export function normalizeText(value) {
  if (value == null) return '';
  let text = String(value);
  text = tryDecodeLatin1ToUtf8(text);
  // Collapse excessive whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export function normalizeDish(dish) {
  if (!dish) return dish;
  return {
    ...dish,
    name: normalizeText(dish.name),
    description: normalizeText(dish.description)
  };
}


