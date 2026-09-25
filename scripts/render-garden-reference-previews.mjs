import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

import SOURCES from "../src/data/garden-reference-sources.json" with {type: "json"};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawArchiveRoot = path.join(root, "data/raw/garden-references");
const previewRoot = path.join(root, "src/assets/garden-references/previews");
const checkOnly = process.argv.includes("--check");

function confinedPath(relativeFile, expectedRoot, label) {
  const absolute = path.resolve(root, relativeFile || "");
  if (!absolute.startsWith(`${expectedRoot}${path.sep}`)) {
    throw new Error(`${label} escapes ${path.relative(root, expectedRoot)}: ${relativeFile || "missing"}`);
  }
  return absolute;
}

function webpDimensions(buffer, file) {
  if (buffer.subarray(0, 4).toString() !== "RIFF" || buffer.subarray(8, 12).toString() !== "WEBP") {
    throw new Error(`${file} is not a WebP image`);
  }
  const chunk = buffer.subarray(12, 16).toString();
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (chunk === "VP8 ") {
    if (buffer.subarray(23, 26).toString("hex") !== "9d012a") {
      throw new Error(`${file} has an unsupported VP8 frame header`);
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }
  throw new Error(`${file} uses unsupported WebP chunk ${chunk || "missing"}`);
}

async function validatePreview(source) {
  const preview = source.archive?.preview;
  if (!preview) return;
  if (!source.archive?.researchFile?.endsWith(".pdf")) {
    throw new Error(`${source.id}: preview generation currently requires a PDF researchFile`);
  }
  if (preview.mediaType !== "image/webp") {
    throw new Error(`${source.id}: preview mediaType must be image/webp`);
  }
  if (!Number.isInteger(preview.sourcePage) || preview.sourcePage < 1) {
    throw new Error(`${source.id}: preview sourcePage must be a positive integer`);
  }
  if (!Number.isInteger(preview.width) || !Number.isInteger(preview.height)) {
    throw new Error(`${source.id}: preview width and height are required`);
  }
  if (!preview.alt || !preview.caption) {
    throw new Error(`${source.id}: preview alt and caption are required`);
  }

  const destination = confinedPath(preview.file, previewRoot, `${source.id} preview`);
  const buffer = await fs.readFile(destination);
  const dimensions = webpDimensions(buffer, preview.file);
  if (dimensions.width !== preview.width || dimensions.height !== preview.height) {
    throw new Error(`${source.id}: preview is ${dimensions.width}x${dimensions.height}, expected ${preview.width}x${preview.height}`);
  }
}

async function renderPreview(source) {
  const preview = source.archive.preview;
  const researchFile = confinedPath(source.archive.researchFile, rawArchiveRoot, `${source.id} research file`);
  const destination = confinedPath(preview.file, previewRoot, `${source.id} preview`);
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "veggie-reference-preview-"));
  const rasterPrefix = path.join(temporaryDirectory, "page");
  const rasterFile = `${rasterPrefix}.png`;
  const webpFile = path.join(temporaryDirectory, "preview.webp");

  try {
    // Poppler performs the PDF page rendering; ImageMagick removes metadata and
    // makes a compact browser-native derivative. The dimensions, page, and
    // quality live beside the source record so this operation is repeatable.
    execFileSync("pdftocairo", [
      "-f", String(preview.sourcePage),
      "-l", String(preview.sourcePage),
      "-singlefile",
      "-scale-to-x", String(preview.width),
      "-scale-to-y", "-1",
      "-png",
      researchFile,
      rasterPrefix
    ], {stdio: "inherit"});
    execFileSync("magick", [
      rasterFile,
      "-strip",
      "-colorspace", "sRGB",
      "-quality", String(preview.quality || 88),
      "-define", "webp:method=6",
      webpFile
    ], {stdio: "inherit"});
    await fs.mkdir(path.dirname(destination), {recursive: true});
    const staged = `${destination}.part`;
    await fs.copyFile(webpFile, staged);
    await fs.rename(staged, destination);
  } finally {
    await fs.rm(temporaryDirectory, {recursive: true, force: true});
  }
  await validatePreview(source);
  process.stdout.write(`rendered ${source.id} -> ${path.relative(root, destination)}\n`);
}

const previewSources = SOURCES.filter((source) => source.archive?.preview);
for (const source of previewSources) {
  if (checkOnly) await validatePreview(source);
  else await renderPreview(source);
}

process.stdout.write(`${checkOnly ? "checked" : "rendered"} ${previewSources.length} garden reference preview${previewSources.length === 1 ? "" : "s"}\n`);
