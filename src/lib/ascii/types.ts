export interface AsciiGrid {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  glyph: Uint16Array;
  alpha: Float32Array;
}
export interface LetterField {
  mask: Float32Array;
  dist: Float32Array;
  disturb: Float32Array;
}
export interface EngineContext { grid: AsciiGrid; letters: LetterField; ramp: string; }
export interface AsciiEngine { step(time: number): void; pointer(x: number, y: number, active: boolean): void; }
export const rampIndex = (value: number, length: number) => Math.max(0, Math.min(length - 1, Math.floor((value + 1) * .5 * length)));
export function gradient(field: Float32Array, cols: number, rows: number, x: number, y: number) {
  return [field[y*cols+Math.min(cols-1,x+1)]-field[y*cols+Math.max(0,x-1)], field[Math.min(rows-1,y+1)*cols+x]-field[Math.max(0,y-1)*cols+x]];
}
