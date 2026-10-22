// scripts/verify-contrast.js
// WCAG AA Contrast Verification Script for Carteira Predictor tokens
// Criteria: 4.5:1 for normal text, 3:1 for large text (>=18pt or >=14pt bold) and UI components/borders

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function parseRgba(colorStr) {
  if (colorStr.startsWith('#')) {
    return { ...hexToRgb(colorStr), a: 1.0 };
  }
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1.0
    };
  }
  throw new Error(`Unsupported color format: ${colorStr}`);
}

function compositeOver(foreground, background) {
  const fg = parseRgba(foreground);
  const bg = parseRgba(background);
  const a = fg.a + bg.a * (1 - fg.a);
  const r = Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a);
  const g = Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a);
  const b = Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a);
  return { r, g, b, a };
}

function getLuminance(rgb) {
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(foreground, background) {
  const fgRgb = foreground.includes('rgba') ? compositeOver(foreground, background) : parseRgba(foreground);
  const bgRgb = parseRgba(background);
  const lum1 = getLuminance(fgRgb);
  const lum2 = getLuminance(bgRgb);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const themeTokens = {
  dark: {
    bgBase: '#07080C',
    bgRaised: '#0D0F16',
    surface: 'rgba(255,255,255,0.04)',
    textPrimary: '#F3F5FA',
    textSecondary: '#A3A9BC',
    brand: '#7C5CFF',
    brandAccent: '#22D3EE',
    gain: '#19D98B',
    loss: '#FF4D6D',
    warning: '#F5B83D',
    info: '#4DA3FF',
    border: 'rgba(255,255,255,0.08)'
  },
  oled: {
    bgBase: '#000000',
    bgRaised: '#080808',
    surface: 'rgba(255,255,255,0.05)',
    textPrimary: '#F3F5FA',
    textSecondary: '#A3A9BC',
    brand: '#8E72FF',
    brandAccent: '#22D3EE',
    gain: '#19D98B',
    loss: '#FF4D6D',
    warning: '#F5B83D',
    info: '#4DA3FF',
    border: 'rgba(255,255,255,0.12)'
  },
  light: {
    bgBase: '#F6F7FB',
    bgRaised: '#FFFFFF',
    surface: '#FFFFFF',
    textPrimary: '#0C101D',
    textSecondary: '#525B75',
    brand: '#5B36E8',
    brandAccent: '#0E7490',
    gain: '#0A8F5B',
    loss: '#D6264A',
    warning: '#B45309',
    info: '#1D4ED8',
    border: 'rgba(10,15,30,0.12)'
  }
};

let hasFailure = false;
console.log('=== WCAG AA CONTRAST RATIO VERIFICATION ===\n');

for (const [themeName, tokens] of Object.entries(themeTokens)) {
  console.log(`--- Theme: ${themeName.toUpperCase()} ---`);
  const backgrounds = [
    { name: 'bgBase', val: tokens.bgBase },
    { name: 'bgRaised', val: tokens.bgRaised }
  ];

  const checks = [
    { name: 'textPrimary', fg: tokens.textPrimary, min: 4.5, type: 'Normal Text' },
    { name: 'textSecondary', fg: tokens.textSecondary, min: 4.5, type: 'Secondary Text' },
    { name: 'gain', fg: tokens.gain, min: 3.0, type: 'UI / Indicator / Large Text' },
    { name: 'loss', fg: tokens.loss, min: 3.0, type: 'UI / Indicator / Large Text' },
    { name: 'brand', fg: tokens.brand, min: 3.0, type: 'UI / Brand Accent' },
    { name: 'brandAccent', fg: tokens.brandAccent, min: 3.0, type: 'UI / Accent' },
    { name: 'warning', fg: tokens.warning, min: 3.0, type: 'UI / Warning' },
    { name: 'info', fg: tokens.info, min: 3.0, type: 'UI / Info' }
  ];

  for (const bg of backgrounds) {
    for (const check of checks) {
      const ratio = getContrastRatio(check.fg, bg.val);
      const passed = ratio >= check.min;
      const status = passed ? 'PASS' : 'FAIL';
      if (!passed) hasFailure = true;
      console.log(`[${status}] ${check.name} on ${bg.name}: ${ratio.toFixed(2)}:1 (required >= ${check.min}:1)`);
    }
  }
  console.log('');
}

if (hasFailure) {
  console.error('❌ Contrast verification FAILED: some token pairs do not meet WCAG AA requirements.');
  process.exit(1);
} else {
  console.log('✅ ALL token contrast ratios PASS WCAG AA specifications.');
}
