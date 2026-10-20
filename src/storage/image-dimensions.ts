// Read dimensions before asking the browser to allocate a decoded bitmap.
export function imageDimensions(bytes: Uint8Array): {
  width: number;
  height: number;
} {
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = (width: number, height: number) => {
    if (!width || !height || width * height > 24000000)
      throw Error("Image exceeds 24 megapixels or has invalid dimensions.");
    return { width, height };
  };
  if (
    bytes.length >= 24 &&
    d.getUint32(0, false) === 0x89504e47 &&
    d.getUint32(4, false) === 0x0d0a1a0a
  )
    return result(d.getUint32(16, false), d.getUint32(20, false));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let at = 2;
    while (at + 4 < bytes.length) {
      if (bytes[at] !== 0xff) throw Error("Invalid JPEG header");
      const marker = bytes[at + 1];
      if (marker === 0xff) {
        at++;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break;
      const size = d.getUint16(at + 2, false);
      if (size < 2 || at + size + 2 > bytes.length)
        throw Error("Invalid JPEG segment");
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker) &&
        size >= 7
      )
        return result(d.getUint16(at + 7, false), d.getUint16(at + 5, false));
      at += size + 2;
    }
  }
  if (
    bytes.length >= 30 &&
    d.getUint32(0, false) === 0x52494646 &&
    d.getUint32(8, false) === 0x57454250
  ) {
    const tag = d.getUint32(12, false);
    if (tag === 0x56503858) {
      if (bytes[20] & 2) throw Error("Animated WebP is not supported.");
      return result(
        1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      );
    }
    if (
      tag === 0x56503820 &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    )
      return result(
        d.getUint16(26, true) & 0x3fff,
        d.getUint16(28, true) & 0x3fff,
      );
    if (tag === 0x5650384c && bytes[20] === 0x2f)
      return result(
        1 + bytes[21] + ((bytes[22] & 63) << 8),
        1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10),
      );
  }
  throw Error("Unsupported or damaged image header.");
}
