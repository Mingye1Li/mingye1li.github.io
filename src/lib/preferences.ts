export const themes = ['light', 'dark', 'dracula', 'nord', 'night', 'coffee', 'sunset', 'forest', 'synthwave', 'cyberpunk', 'retro', 'dim', 'abyss', 'winter', 'business', 'cupcake', 'emerald', 'halloween', 'lofi', 'luxury'];
export const bodyFonts = { inter: 'Inter', system: 'System UI' };
export const terminalFonts = { jetbrains: 'JetBrains Mono', firacode: 'Fira Code', hack: 'Hack', meslo: 'MesloLGS', iosevka: 'Iosevka' };
export const fontFamilies: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif", system: 'system-ui, sans-serif',
  jetbrains: "'JetBrains Mono', monospace", firacode: "'Fira Code', monospace",
  hack: "'Hack', monospace", meslo: "'MesloLGS', monospace", iosevka: "'Iosevka', monospace",
};
export const lightThemes = ['light','nord','cyberpunk','retro','winter','cupcake','emerald','lofi'];
export function readPreference(key: string, fallback: string): string {
  return readStored(key) ?? fallback;
}
export function setPreference(key: 'theme' | 'body-font' | 'font', value: string) {
  if (key === 'theme' && !themes.includes(value)) return false;
  if (key === 'body-font' && !(value in bodyFonts)) return false;
  if (key === 'font' && !(value in terminalFonts)) return false;
  try { writeStored(key, value); } catch { /* Private browsing can disable storage. */ }
  if (key === 'theme') {
    document.documentElement.dataset.theme = value;
    document.documentElement.dataset.colorMode = lightThemes.includes(value) ? 'light' : 'dark';
  }
  else document.documentElement.style.setProperty(key === 'body-font' ? '--ui-font-sans' : '--ui-font-mono', fontFamilies[value]);
  document.dispatchEvent(new CustomEvent('site:preferences'));
  return true;
}
import { readStored, writeStored } from './storage';
