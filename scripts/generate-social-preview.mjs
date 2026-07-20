import fs from "node:fs";
import zlib from "node:zlib";

const width = 1280;
const height = 640;
const pixels = Buffer.alloc((width * 3 + 1) * height);

const colors = {
  bg: [244, 246, 248],
  panel: [255, 255, 255],
  line: [217, 225, 234],
  ink: [23, 32, 42],
  muted: [97, 112, 128],
  blue: [34, 94, 168],
  blueSoft: [232, 241, 251],
  green: [19, 121, 91],
  greenSoft: [229, 244, 238],
  violet: [95, 75, 182],
  violetSoft: [238, 234, 253],
  yellow: [154, 103, 0],
  yellowSoft: [255, 244, 214],
};

function main() {
  fill(colors.bg);
  rect(64, 56, 1152, 528, colors.panel);
  strokeRect(64, 56, 1152, 528, colors.line, 3);
  rect(104, 98, 92, 92, colors.blueSoft);
  strokeRect(104, 98, 92, 92, colors.blue, 6);
  rect(130, 124, 40, 40, colors.greenSoft);
  strokeRect(130, 124, 40, 40, colors.green, 6);
  text(230, 112, "KOREAN AI HARDWARE FIT", 4, colors.blue);
  text(230, 166, "LLM GPU CHECKER", 8, colors.ink);
  text(230, 252, "LLM RAG OCR GPU FIT CALCULATOR", 4, colors.muted);
  infoCard(104, 336, "86 GPUS", "RTX A100 H100", colors.greenSoft, colors.green);
  infoCard(376, 336, "128 MODELS", "LLM RAG OCR", colors.blueSoft, colors.blue);
  infoCard(648, 336, "RAG FIT", "BATCH TOKENS", colors.violetSoft, colors.violet);
  infoCard(920, 336, "OCR FIT", "DPI PAGES", colors.yellowSoft, colors.yellow);
  rect(104, 496, 1058, 48, colors.ink);
  text(130, 511, "JAESEOK614.GITHUB.IO/LLM-GPU-CHECKER-KO", 3, colors.panel);

  writePng("docs/social-preview.png");
}

function infoCard(x, y, title, body, fillColor, titleColor) {
  rect(x, y, 242, 116, fillColor);
  text(x + 26, y + 32, title, 4, titleColor);
  text(x + 26, y + 78, body, 3, colors.ink);
}

function fill(color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(x, y, color);
    }
  }
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function strokeRect(x, y, w, h, color, size) {
  rect(x, y, w, size, color);
  rect(x, y + h - size, w, size, color);
  rect(x, y, size, h, color);
  rect(x + w - size, y, size, h, color);
}

function text(x, y, value, scale, color) {
  let cursor = x;
  for (const char of value.toUpperCase()) {
    if (char === " ") {
      cursor += 4 * scale;
      continue;
    }
    const glyph = FONT[char] || FONT["?"];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") {
          rect(cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += 6 * scale;
  }
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const rowStart = y * (width * 3 + 1) + 1;
  const offset = rowStart + x * 3;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
}

function writePng(path) {
  const chunks = [
    chunk("IHDR", Buffer.concat([u32(width), u32(height), Buffer.from([8, 2, 0, 0, 0])])),
    chunk("IDAT", zlib.deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ];
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]));
}

function chunk(type, data) {
  const name = Buffer.from(type);
  return Buffer.concat([u32(data.length), name, data, u32(crc32(Buffer.concat([name, data])))]);
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const FONT = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
};

main();
