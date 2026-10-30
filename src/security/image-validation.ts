const MAX_PROFILE_IMAGE_DIMENSION = 12_000;
const MAX_PROFILE_IMAGE_PIXELS = 40_000_000;
const PROFILE_OUTPUT_SIZE = 512;

type ImageDimensions = { width: number; height: number };

function readUint24LittleEndian(bytes: Uint8Array, offset: number) {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset]!;
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = (bytes[offset]! << 8) | bytes[offset + 1]!;
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrame.has(marker) && segmentLength >= 7) {
      return {
        height: (bytes[offset + 3]! << 8) | bytes[offset + 4]!,
        width: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
      };
    }
    offset += segmentLength;
  }
  return null;
}

function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !signature.every((byte, index) => bytes[index] === byte)) return null;
  if (String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 30 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
  ) return null;
  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === "VP8X") {
    return {
      width: readUint24LittleEndian(bytes, 24) + 1,
      height: readUint24LittleEndian(bytes, 27) + 1,
    };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    return {
      width: 1 + (((bytes[22]! & 0x3f) << 8) | bytes[21]!),
      height: 1 + (((bytes[24]! & 0x0f) << 10) | (bytes[23]! << 2) | ((bytes[22]! & 0xc0) >> 6)),
    };
  }
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: ((bytes[27]! << 8) | bytes[26]!) & 0x3fff,
      height: ((bytes[29]! << 8) | bytes[28]!) & 0x3fff,
    };
  }
  return null;
}

export function readImageDimensions(bytes: Uint8Array, type: string): ImageDimensions | null {
  if (type === "image/jpeg") return jpegDimensions(bytes);
  if (type === "image/png") return pngDimensions(bytes);
  if (type === "image/webp") return webpDimensions(bytes);
  return null;
}

export function isWithinProfileImageBudget(dimensions: ImageDimensions | null): dimensions is ImageDimensions {
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) return false;
  return dimensions.width <= MAX_PROFILE_IMAGE_DIMENSION &&
    dimensions.height <= MAX_PROFILE_IMAGE_DIMENSION &&
    dimensions.width * dimensions.height <= MAX_PROFILE_IMAGE_PIXELS;
}

export function isCanonicalProfilePhotoDataUrl(value: string): boolean {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  try {
    const decoded = atob(match[1]!);
    if (decoded.length < 1_024 || decoded.length > 220_000) return false;
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const dimensions = readImageDimensions(bytes, "image/jpeg");
    return dimensions?.width === PROFILE_OUTPUT_SIZE &&
      dimensions.height === PROFILE_OUTPUT_SIZE &&
      bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  } catch {
    return false;
  }
}
