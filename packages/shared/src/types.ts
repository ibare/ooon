export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Color = string;

export interface TextOptions {
  font?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  fill?: Color;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
}

export interface Size {
  width: number;
  height: number;
}

export interface HitArea {
  id: string;
  rect: Rect;
  cursor?: string;
}
