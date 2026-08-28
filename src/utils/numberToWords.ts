const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const tens = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

function convertBelowThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    if (num % 10 > 0) {
      str += ones[num % 10] + ' ';
    }
  } else if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

/**
 * Converts a number to Indian Currency words in UPPERCASE.
 * e.g. 23800 -> "TWENTY THREE THOUSAND EIGHT HUNDRED RUPEES ONLY"
 */
export function numberToIndianWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'ZERO RUPEES ONLY';
  }

  const [rupeesStr, paiseStr] = amount.toFixed(2).split('.');
  let rupees = parseInt(rupeesStr, 10);
  const paise = parseInt(paiseStr, 10);

  if (rupees === 0 && paise === 0) {
    return 'ZERO RUPEES ONLY';
  }

  let words = '';

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;

  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;

  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;

  const remaining = rupees;

  if (crore > 0) {
    words += convertBelowThousand(crore) + ' CRORE ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' LAKH ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' THOUSAND ';
  }
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  words = words.trim();
  if (words) {
    words = words + ' RUPEES';
  }

  if (paise > 0) {
    const paiseWords = convertBelowThousand(paise);
    if (words) {
      words += ' AND ' + paiseWords + ' PAISE';
    } else {
      words = paiseWords + ' PAISE ONLY';
      return words;
    }
  }

  return (words + ' ONLY').replace(/\s+/g, ' ');
}

export function formatCurrency(amount: number | ''): string {
  if (amount === '' || amount === undefined || isNaN(amount)) return '0.00';
  return Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
