const dictionaries = {
  ru: {
    1: 'один', 2: 'два', 3: 'три', 4: 'четыре', 5: 'пять', 6: 'шесть', 7: 'семь', 8: 'восемь', 9: 'девять',
    10: 'десять', 11: 'одиннадцать', 12: 'двенадцать', 13: 'тринадцать', 14: 'четырнадцать', 15: 'пятнадцать', 16: 'шестнадцать', 17: 'семнадцать', 18: 'восемнадцать', 19: 'девятнадцать',
    20: 'двадцать', 30: 'тридцать', 40: 'сорок', 50: 'пятьдесят', 60: 'шестьдесят', 70: 'семьдесят', 80: 'восемьдесят', 90: 'девяносто',
    100: 'сто', 200: 'двести', 300: 'триста', 400: 'четыреста', 500: 'пятьсот', 600: 'шестьсот', 700: 'семьсот', 800: 'восемьсот', 900: 'девятьсот', 1000: 'тысяча',
  },
  kk: {
    1: 'бір', 2: 'екі', 3: 'үш', 4: 'төрт', 5: 'бес', 6: 'алты', 7: 'жеті', 8: 'сегіз', 9: 'тоғыз',
    10: 'он', 20: 'жиырма', 30: 'отыз', 40: 'қырық', 50: 'елу', 60: 'алпыс', 70: 'жетпіс', 80: 'сексен', 90: 'тоқсан',
    100: 'бір жүз', 200: 'екі жүз', 300: 'үш жүз', 400: 'төрт жүз', 500: 'бес жүз', 600: 'алты жүз', 700: 'жеті жүз', 800: 'сегіз жүз', 900: 'тоғыз жүз', 1000: 'бір мың',
  },
  en: {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
    10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen',
    20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety',
    100: 'one hundred', 200: 'two hundred', 300: 'three hundred', 400: 'four hundred', 500: 'five hundred', 600: 'six hundred', 700: 'seven hundred', 800: 'eight hundred', 900: 'nine hundred', 1000: 'one thousand',
  },
};

const teenLanguages = new Set(['ru', 'en']);

export function supportedLanguages() {
  return Object.keys(dictionaries);
}

export function numberSegmentCatalog(language) {
  const dictionary = dictionaries[language];
  if (!dictionary) throw new Error(`Unsupported language: ${language}`);
  return Object.entries(dictionary)
    .map(([value, text]) => ({ value: Number(value), text }))
    .sort((a, b) => a.value - b.value);
}

export function numberToSegmentValues(language, rawNumber) {
  if (!dictionaries[language]) throw new Error(`Unsupported language: ${language}`);
  const value = normalizeTicketNumber(rawNumber);
  if (value === 1000) return [1000];

  const result = [];
  let remainder = value;
  if (remainder >= 100) {
    const hundreds = Math.floor(remainder / 100) * 100;
    result.push(hundreds);
    remainder -= hundreds;
  }

  if (teenLanguages.has(language) && remainder >= 10 && remainder < 20) {
    result.push(remainder);
    remainder = 0;
  } else if (remainder >= 10) {
    const tens = Math.floor(remainder / 10) * 10;
    result.push(tens);
    remainder -= tens;
  }

  if (remainder > 0) result.push(remainder);
  return result;
}

export function numberToWords(language, rawNumber) {
  return numberToSegmentValues(language, rawNumber)
    .map((value) => dictionaries[language][value])
    .join(' ');
}

export function normalizeTicketNumber(rawNumber) {
  const source = String(rawNumber).trim();
  if (!/^\d{1,4}$/.test(source)) {
    throw new Error('Ticket number must contain only digits');
  }
  const value = Number(source);
  if (!Number.isInteger(value) || value < 1 || value > 1000) {
    throw new Error('Ticket number must be between 1 and 1000');
  }
  return value;
}

export function announcementSegments(manifest, language, prefix, rawNumber) {
  const languageConfig = manifest.languages[language];
  if (!languageConfig) throw new Error(`Unsupported language: ${language}`);
  const normalizedPrefix = String(prefix || '').toUpperCase();
  if (!manifest.ticketPrefixes.includes(normalizedPrefix)) {
    throw new Error(`Ticket prefix must be one of: ${manifest.ticketPrefixes.join(', ')}`);
  }

  const ticketParts = [
    `prefixes/${normalizedPrefix}.wav`,
    ...numberToSegmentValues(language, rawNumber).map((value) => `numbers/${value}.wav`),
  ];

  return languageConfig.parts.flatMap((part) => {
    if (part.kind === 'ticket') return ticketParts;
    if (part.kind === 'static') return [`static/${part.id}.wav`];
    throw new Error(`Unsupported template part: ${part.kind}`);
  });
}
