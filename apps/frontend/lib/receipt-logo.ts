// Receipt logo processing: thermal printers print only black dots, so the logo is turned
// into a pure black and white image at the printer resolution before the upload.

// Box the logo is fitted into, in printer dots (203 dpi): 384 dots is the whole printable
// width of 58 mm paper and two thirds of 80 mm paper; 192 dots is about 24 mm of height
export const LOGO_MAX_WIDTH = 384;
export const LOGO_MAX_HEIGHT = 192;

/**
 * sharp: every pixel black or white, clean edges (text and flat logos)
 * shaded: dithering, shades become dot patterns (photos, gradients)
 */
export type LogoMode = "sharp" | "shaded";

/**
 * Dithering of the shaded mode:
 * atkinson: error diffusion, lighter and crisper
 * floyd-steinberg: error diffusion, truer tones
 * bayer: regular dot grid, without the "noise" of error diffusion
 */
export type ShadeAlgorithm = "atkinson" | "floyd-steinberg" | "bayer";

export interface LogoAdjustments {
  mode: LogoMode;
  algorithm: ShadeAlgorithm;
  /** 0..255: grey level below which a pixel is printed */
  threshold: number;
  invert: boolean;
}

export const DEFAULT_ADJUSTMENTS: LogoAdjustments = {
  mode: "sharp",
  algorithm: "atkinson",
  threshold: 128,
  invert: false,
};

/** Grey levels of the logo at the output size (0 = black, 255 = white) */
export interface GrayImage {
  width: number;
  height: number;
  data: Float32Array;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image could not be loaded"));
    img.src = src;
  });
}

function luminance(r: number, g: number, b: number, a: number): number {
  // transparent pixels are printed on white paper
  const alpha = a / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum * alpha + 255 * (1 - alpha);
}

/** Bounding box of the non-white content, in source pixels (whole image when empty) */
function contentBox(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const full = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  // analysed on a small copy: fast and enough for margins
  const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return full;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;

  // the background is the colour of the top-left corner (usually white or transparent)
  const bg = luminance(px[0], px[1], px[2], px[3]);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.abs(luminance(px[i], px[i + 1], px[i + 2], px[i + 3]) - bg) > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return full;

  // one analysed pixel of margin, back to source pixels
  const sx = Math.max(0, Math.floor((minX - 1) / scale));
  const sy = Math.max(0, Math.floor((minY - 1) / scale));
  const ex = Math.min(img.naturalWidth, Math.ceil((maxX + 2) / scale));
  const ey = Math.min(img.naturalHeight, Math.ceil((maxY + 2) / scale));
  return { x: sx, y: sy, w: ex - sx, h: ey - sy };
}

/**
 * Removes the empty margins, fits the logo into LOGO_MAX_WIDTH x LOGO_MAX_HEIGHT dots
 * and converts it to grey levels. The width is a multiple of 8: ESC/POS raster images are sent in bytes.
 */
export function toGray(img: HTMLImageElement): GrayImage {
  const box = contentBox(img);
  const scale = Math.min(LOGO_MAX_WIDTH / box.w, LOGO_MAX_HEIGHT / box.h);
  const width = Math.max(8, Math.min(LOGO_MAX_WIDTH, Math.floor((box.w * scale) / 8) * 8));
  const height = Math.max(1, Math.min(LOGO_MAX_HEIGHT, Math.round((box.h * width) / box.w)));
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, width, height);
  const px = ctx.getImageData(0, 0, width, height).data;

  const data = new Float32Array(width * height);
  for (let i = 0; i < data.length; i++) {
    data[i] = luminance(px[i * 4], px[i * 4 + 1], px[i * 4 + 2], px[i * 4 + 3]);
  }
  return { width, height, data };
}

/** Grey level below which `ratio` of the pixels fall */
function percentile(data: Float32Array, ratio: number): number {
  const hist = new Uint32Array(256);
  for (const v of data) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  const target = data.length * ratio;
  let count = 0;
  for (let i = 0; i < 256; i++) {
    count += hist[i];
    if (count >= target) return i;
  }
  return 255;
}

/** Stretches the levels (darkest pixel black, lightest white) and inverts: returns a new grey image */
export function adjust(src: GrayImage, invert: boolean): GrayImage {
  const data = new Float32Array(src.data);
  // 1% of the pixels at each end may be noise: ignore them
  const lo = percentile(data, 0.01);
  const hi = percentile(data, 0.99);
  const k = hi - lo > 8 ? 255 / (hi - lo) : 1;
  const base = hi - lo > 8 ? lo : 0;
  for (let i = 0; i < data.length; i++) {
    let v = (data[i] - base) * k;
    if (invert) v = 255 - v;
    data[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return { width: src.width, height: src.height, data };
}

/** Otsu's method: the threshold that best separates the dark and light pixels */
export function otsuThreshold(img: GrayImage): number {
  const hist = new Float64Array(256);
  for (const v of img.data) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  const total = img.data.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];

  // several thresholds can split equally well (e.g. a two-tone logo): keep the middle one
  let sumBg = 0, weightBg = 0, best = 127, bestEnd = 127, bestVar = -1;
  for (let t = 0; t < 256; t++) {
    weightBg += hist[t];
    if (weightBg === 0) continue;
    const weightFg = total - weightBg;
    if (weightFg === 0) break;
    sumBg += t * hist[t];
    const meanBg = sumBg / weightBg;
    const meanFg = (sumAll - sumBg) / weightFg;
    const between = weightBg * weightFg * (meanBg - meanFg) ** 2;
    if (between > bestVar) {
      bestVar = between;
      best = t;
      bestEnd = t;
    } else if (between === bestVar) {
      bestEnd = t;
    }
  }
  // t is the last dark level, dither() prints values below the threshold
  return Math.min(255, Math.round((best + bestEnd) / 2) + 1);
}

/** Share of pixels in the mid tones: high for photos and gradients, low for flat logos */
export function midToneRatio(img: GrayImage): number {
  let mid = 0;
  for (const v of img.data) if (v > 48 && v < 208) mid++;
  return mid / img.data.length;
}

// 8x8 Bayer matrix, values 0..63
const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

/** Converts the grey image to dots: 1 = black (printed), 0 = white */
export function dither(img: GrayImage, adj: LogoAdjustments): Uint8Array {
  const { width: w, height: h } = img;
  const { threshold } = adj;
  const out = new Uint8Array(w * h);

  if (adj.mode === "sharp") {
    for (let i = 0; i < out.length; i++) out[i] = img.data[i] < threshold ? 1 : 0;
    return out;
  }

  if (adj.algorithm === "bayer") {
    // the intensity moves the whole grid lighter or darker
    const offset = threshold - 128;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = ((BAYER_8[(y % 8) * 8 + (x % 8)] + 0.5) / 64) * 255;
        out[y * w + x] = img.data[y * w + x] < cell + offset ? 1 : 0;
      }
    }
    return out;
  }

  // error diffusion: the rounding error of each dot is spread to the next pixels
  const buf = new Float32Array(img.data);
  const spread = (x: number, y: number, err: number) => {
    if (x >= 0 && x < w && y < h) buf[y * w + x] += err;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const black = buf[i] < threshold;
      out[i] = black ? 1 : 0;
      const err = buf[i] - (black ? 0 : 255);
      if (adj.algorithm === "floyd-steinberg") {
        spread(x + 1, y, (err * 7) / 16);
        spread(x - 1, y + 1, (err * 3) / 16);
        spread(x, y + 1, (err * 5) / 16);
        spread(x + 1, y + 1, err / 16);
      } else {
        // atkinson spreads only 6/8 of the error: lighter, crisper result
        const e = err / 8;
        spread(x + 1, y, e);
        spread(x + 2, y, e);
        spread(x - 1, y + 1, e);
        spread(x, y + 1, e);
        spread(x + 1, y + 1, e);
        spread(x, y + 2, e);
      }
    }
  }
  return out;
}

/** Draws the dots on a canvas (black on white) */
export function dotsToCanvas(dots: Uint8Array, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < dots.length; i++) {
    const v = dots[i] ? 0 : 255;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
  });
}

/** Automatic choice: dots for photos and gradients, sharp with Otsu's threshold for flat logos */
export function autoAdjust(img: HTMLImageElement, current: LogoAdjustments): LogoAdjustments {
  const gray = adjust(toGray(img), current.invert);
  const photo = midToneRatio(gray) > 0.25;
  return { ...current, mode: photo ? "shaded" : "sharp", threshold: photo ? 128 : otsuThreshold(gray) };
}
