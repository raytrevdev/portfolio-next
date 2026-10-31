import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

// Fonts used by the Ting Family Land pages, exposed as CSS variables consumed by ting-land.css / estate-models.css.
export const tlSans = Geist({ subsets: ['latin'], variable: '--tl-sans', display: 'swap' });
export const tlMono = Geist_Mono({ subsets: ['latin'], variable: '--tl-mono', display: 'swap' });
export const tlSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--tl-serif', display: 'swap' });
export const tlFontVars = [tlSans.variable, tlMono.variable, tlSerif.variable].join(' ');
