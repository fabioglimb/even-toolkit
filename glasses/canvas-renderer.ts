import { DISPLAY_W, DISPLAY_H } from './layout';
import { canvasToPngBytes } from './png-utils';
import type { DisplayData, DisplayLine } from './types';

const FONT_SIZE = 22;
const LINE_HEIGHT = 28;
const PADDING_LEFT = 12;
const PADDING_TOP = 8;
const FONT = `${FONT_SIZE}px "Courier New", monospace`;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function ensureCanvas(): CanvasRenderingContext2D {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = DISPLAY_W;
    canvas.height = DISPLAY_H;
    const container = document.getElementById('glasses-canvas');
    if (container) container.appendChild(canvas);
  }
  if (!ctx) {
    ctx = canvas.getContext('2d')!;
  }
  return ctx;
}

export function getCanvas(): HTMLCanvasElement {
  ensureCanvas();
  return canvas!;
}

function drawLine(ctx: CanvasRenderingContext2D, line: DisplayLine, y: number): void {
  const x = PADDING_LEFT;

  if (line.style === 'separator') {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + LINE_HEIGHT / 2);
    ctx.lineTo(DISPLAY_W - PADDING_LEFT, y + LINE_HEIGHT / 2);
    ctx.stroke();
    return;
  }

  if (line.inverted) {
    ctx.fillStyle = '#606060';
    ctx.fillRect(0, y, DISPLAY_W, LINE_HEIGHT);
    ctx.fillStyle = '#000000';
    ctx.font = FONT;
    ctx.fillText(line.text, x, y + FONT_SIZE);
    return;
  }

  ctx.font = FONT;

  switch (line.style) {
    case 'meta':
      ctx.fillStyle = '#808080';
      break;
    case 'normal':
    default:
      ctx.fillStyle = '#e0e0e0';
      break;
  }

  ctx.fillText(line.text, x, y + FONT_SIZE);
}

export function drawToCanvas(data: DisplayData): void {
  const c = ensureCanvas();

  c.fillStyle = '#000000';
  c.fillRect(0, 0, DISPLAY_W, DISPLAY_H);

  let y = PADDING_TOP;
  for (const line of data.lines) {
    drawLine(c, line, y);
    y += LINE_HEIGHT;
  }
}

export async function renderToImage(data: DisplayData): Promise<number[]> {
  drawToCanvas(data);
  return canvasToPngBytes(canvas!);
}
