import {existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {readFile, readdir, mkdir, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";

// Offline inventory of npm runtime dependencies. Preserve upstream text verbatim;
// missing text stays an explicit gap, never an inferred license grant.
const root = fileURLToPath(new URL("../", import.meta.url));
const community = existsSync(path.join(root, "community-release.json")) && JSON.parse(await readFile(path.join(root, "community-release.json"), "utf8")).profile === "community";
const check = process.argv.includes("--check");
const requireComplete = process.argv.includes("--require-complete");
const buildTools = process.argv.includes("--build-tools");
if (process.argv.slice(2).some(arg => !["--check", "--require-complete", "--build-tools"].includes(arg)) || (requireComplete && !check)) {
  throw new Error("Usage: node scripts/build-dependency-notices.mjs [--build-tools] [--check [--require-complete]]");
}
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const inventory = {
  scope: buildTools ? "Installed build-tool dependencies from the root npm lock; optional packages absent on this platform are recorded separately. Excludes browser-resolved modules and non-code assets. Not legal clearance." : community ? "Installed community runtime dependencies from the root npm lock; excludes private account services, build tooling, browser-resolved modules outside this lock and non-code assets. Not legal clearance." : "Installed runtime dependencies from root and account-service npm locks; excludes build tooling, browser-resolved modules outside these locks and non-code assets. Not legal clearance.",
  locks: [], packages: [], missingTexts: []
};
if (buildTools) inventory.notInstalledOptional = [];
const texts = new Map();
const upstreamNotices = JSON.parse(await readFile(path.join(root, "docs/licenses/npm-upstream-notices.json"), "utf8")).notices;
const excerpts = JSON.parse(await readFile(path.join(root, "docs/licenses/npm-notice-excerpts.json"), "utf8")).excerpts;
for (const scope of (buildTools || community ? ["."] : [".", "services/accounts"])) {
  const lockBytes = await readFile(path.join(root, scope, "package-lock.json"));
  const lock = JSON.parse(lockBytes);
  inventory.locks.push({scope, sha256: sha256(lockBytes)});
  for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    if (!location || (buildTools ? !entry.dev : entry.dev)) continue;
    const dir = path.resolve(root, scope, location);
    if (!dir.startsWith(path.resolve(root, scope, "node_modules") + path.sep)) {
      throw new Error(`Unexpected runtime dependency path: ${location}`);
    }
    let pkg;
    try {
      pkg = JSON.parse(await readFile(path.join(dir, "package.json")));
    } catch (error) {
      if (!buildTools || !entry.optional || error.code !== "ENOENT") throw error;
      inventory.notInstalledOptional.push({scope, path: location, version: entry.version,
        resolved: entry.resolved, integrity: entry.integrity});
      continue;
    }
    if (pkg.version !== entry.version || pkg.license !== entry.license) {
      throw new Error(`Installed metadata differs from lock: ${scope}/${location}`);
    }
    const record = {
      scope, path: location, name: pkg.name, version: pkg.version,
      license: entry.license, resolved: entry.resolved, integrity: entry.integrity, texts: []
    };
    const files = (await readdir(dir, {withFileTypes: true}))
      .filter(item => item.isFile() && /^(licen[cs]e|unlicen[cs]e|copying|notice)([.-]|$)/i.test(item.name))
      .map(item => item.name).sort();
    for (const filename of files) {
      const bytes = await readFile(path.join(dir, filename));
      const digest = sha256(bytes);
      const text = bytes.toString("utf8");
      if (!Buffer.from(text).equals(bytes)) throw new Error(`Non-UTF-8 notice: ${location}/${filename}`);
      record.texts.push({filename, sha256: digest});
      if (!texts.has(digest)) texts.set(digest, text);
    }
    for (const excerpt of excerpts.filter(item => item.name === pkg.name && item.version === pkg.version)) {
      if (path.basename(excerpt.filename) !== excerpt.filename) throw new Error("Invalid notice excerpt filename");
      const original = await readFile(path.join(dir, excerpt.filename));
      if (sha256(original) !== excerpt.fileSha256
          || !Number.isInteger(excerpt.startByte) || !Number.isInteger(excerpt.endByte)
          || excerpt.startByte < 0 || excerpt.endByte <= excerpt.startByte || excerpt.endByte > original.length) {
        throw new Error(`Reviewed notice excerpt changed: ${pkg.name}@${pkg.version}`);
      }
      const bytes = original.subarray(excerpt.startByte, excerpt.endByte);
      const digest = sha256(bytes);
      const text = bytes.toString("utf8");
      if (digest !== excerpt.sha256 || !Buffer.from(text).equals(bytes)) throw new Error("Invalid notice excerpt bytes");
      record.texts.push({filename: excerpt.filename, sha256: digest, fileSha256: excerpt.fileSha256,
        startByte: excerpt.startByte, endByte: excerpt.endByte});
      if (!texts.has(digest)) texts.set(digest, text);
    }
    for (const notice of upstreamNotices.filter(item => item.name === pkg.name && item.version === pkg.version)) {
      const resolveNotice = filename => {
        const resolved = path.resolve(root, filename);
        if (!resolved.startsWith(path.join(root, "docs/licenses/upstream") + path.sep)) throw new Error("Invalid upstream notice path");
        return resolved;
      };
      const metadataBytes = await readFile(resolveNotice(notice.metadata));
      const metadata = JSON.parse(metadataBytes);
      if (sha256(metadataBytes) !== notice.metadataSha256 || metadata.name !== pkg.name
          || metadata.version !== pkg.version || metadata.license !== pkg.license
          || metadata.gitHead !== notice.gitHead || metadata.dist?.integrity !== entry.integrity
          || metadata.dist?.tarball !== entry.resolved) {
        throw new Error(`Upstream notice package evidence changed: ${pkg.name}@${pkg.version}`);
      }
      const bytes = await readFile(resolveNotice(notice.text));
      const text = bytes.toString("utf8");
      if (sha256(bytes) !== notice.sha256 || !Buffer.from(text).equals(bytes)) throw new Error("Upstream notice text changed");
      record.texts.push({filename: notice.text, sha256: notice.sha256, sourceUrl: notice.url,
        gitHead: notice.gitHead, metadataSha256: notice.metadataSha256});
      if (!texts.has(notice.sha256)) texts.set(notice.sha256, text);
    }
    inventory.packages.push(record);
    if (!record.texts.length) inventory.missingTexts.push({scope, name: pkg.name, version: pkg.version});
  }
}

const title = buildTools ? "Build-tool" : "Runtime";
let markdown = `# ${title} npm dependency notices\n\nGenerated by \`node scripts/build-dependency-notices.mjs${buildTools ? " --build-tools" : ""}\` from installed, locked packages.\n\n`;
if (!buildTools) markdown = "# Runtime npm dependency notices\n\nGenerated by `npm run build:dependency-notices` from installed, locked packages.\n\n";
markdown += inventory.scope + "\n\n";
if (buildTools) markdown += `${inventory.notInstalledOptional.length} optional locked packages are not installed on this platform; their texts are not checked or counted as covered. See the JSON inventory.\n\n`;
markdown += "Upstream license and notice text follows unchanged, deduplicated by SHA-256.\nThe JSON inventory records locked archive URLs/integrity and maps each package\nand filename to its text digest. Reviewed README excerpts and version-linked\nupstream supplements are pinned in separate registries; their source hashes and\nbyte ranges or source commit are included in each applicable package record. This file\ndoes not change upstream terms or establish complete redistribution clearance.\n\n";
markdown += "## Missing upstream text\n\n";
markdown += inventory.missingTexts.length
  ? inventory.missingTexts.map(p => `- ${p.name}@${p.version} (${p.scope}): no collected standalone notice or reviewed embedded license text. Resolve before treating notices as complete.`).join("\n") + "\n\n"
  : "None in this inventory.\n\n";
markdown += "## Package inventory\n\n| Package | Scope | Declared license | Text digest(s) |\n| --- | --- | --- | --- |\n";
for (const p of inventory.packages) {
  markdown += `| ${p.name}@${p.version} | ${p.scope} | ${p.license} | ${p.texts.map(t => t.sha256).join(", ") || "Missing"} |\n`;
}
for (const [digest, text] of [...texts].sort(([a], [b]) => a.localeCompare(b))) {
  const fence = "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(match => match[0].length + 1)));
  markdown += `\n## Text ${digest}\n\n${fence}text\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}\n`;
}
const output = path.join(root, "docs/licenses");
if (!check) await mkdir(output, {recursive: true});
for (const [filename, content] of [
  [`${buildTools ? "build-tool" : "runtime"}-npm-notices.json`, JSON.stringify(inventory, null, 2) + "\n"],
  [`${buildTools ? "build-tool" : "runtime"}-npm-notices.md`, markdown]
]) {
  const target = path.join(output, filename);
  if (check) {
    if (await readFile(target, "utf8") !== content) throw new Error(`Notice inventory is stale: ${filename}`);
  } else await writeFile(target, content);
}
console.log(`${check ? "Verified" : "Collected"} ${inventory.packages.length} ${buildTools ? "build-tool" : "runtime"} package records, ${texts.size} distinct texts; ${inventory.missingTexts.length} missing-text gaps. No network requests.`);
if (requireComplete && inventory.missingTexts.length) {
  console.error(`${title} notices are incomplete:\n` + inventory.missingTexts.map(p => `- ${p.name}@${p.version} (${p.scope})`).join("\n"));
  process.exitCode = 1;
}
