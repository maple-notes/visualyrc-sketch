import { it, expect } from "vitest";
import { imageDimensions } from "../storage/image-dimensions";
import { timeLabel } from "../audio/Timeline";
it("rejects oversized PNG dimensions before decode allocation", () => {
  const b = new Uint8Array(24),
    v = new DataView(b.buffer);
  v.setUint32(0, 0x89504e47);
  v.setUint32(4, 0x0d0a1a0a);
  v.setUint32(16, 10000);
  v.setUint32(20, 10000);
  expect(() => imageDimensions(b)).toThrow(/megapixels/);
  v.setUint32(16, 320);
  v.setUint32(20, 240);
  expect(imageDimensions(b)).toEqual({ width: 320, height: 240 });
});
it("rejects invalid image bytes and animated WebP", () => {
  expect(() => imageDimensions(new Uint8Array([1, 2, 3]))).toThrow();
  const b = new Uint8Array(30),
    v = new DataView(b.buffer);
  v.setUint32(0, 0x52494646);
  v.setUint32(8, 0x57454250);
  v.setUint32(12, 0x56503858);
  b[20] = 2;
  expect(() => imageDimensions(b)).toThrow(/Animated/);
});
it("formats a near-final audio clock without losing the last second", () => {
  expect(timeLabel(5.9999999)).toBe("00:06");
  expect(timeLabel(61.2)).toBe("01:01");
  expect(timeLabel(-1)).toBe("00:00");
});
