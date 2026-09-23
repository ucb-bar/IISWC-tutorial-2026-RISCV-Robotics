import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] || "dist");
const dataPath = resolve(process.argv[3] || "src/data/tutorial.ts");
const siteRoot = resolve(dirname(dataPath), "../..");
const failures = [];
const required = [
  "index.html",
  "instructions.html",
  "404.html",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  ".nojekyll",
  "assets/apple-touch-icon.png",
  "assets/og-card.png",
  "assets/uc-berkeley-seal.svg",
  "assets/slice-logo.png",
  "fonts/overpass-latin.woff2",
  "fonts/OFL.txt",
];

const fail = (message) => failures.push(message);
const load = (base, path) => readFile(join(base, path), "utf8");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return paths.flat();
}

for (const path of required) {
  try {
    await access(join(root, path));
  } catch {
    fail(`Missing required file: ${path}`);
  }
}

const [html, labPage, notFound, manifestText, sitemap, favicon, data] = await Promise.all([
  load(root, "index.html"),
  load(root, "instructions.html"),
  load(root, "404.html"),
  load(root, "manifest.webmanifest"),
  load(root, "sitemap.xml"),
  load(root, "assets/uc-berkeley-seal.svg"),
  readFile(dataPath, "utf8"),
]);

const distFiles = await walk(root);
const sourceFiles = await walk(join(siteRoot, "src"));
const sourceText = (await Promise.all(
  sourceFiles.filter((path) => [".ts", ".tsx", ".css"].includes(extname(path))).map((path) => readFile(path, "utf8")),
)).join("\n");

const javascriptFiles = distFiles.filter((path) => extname(path) === ".js");
const cssFiles = distFiles.filter((path) => extname(path) === ".css");
if (!javascriptFiles.length) fail("Production JavaScript bundle is missing");
if (!cssFiles.length) fail("Production CSS bundle is missing");

const [javascript, css] = await Promise.all([
  Promise.all(javascriptFiles.map((path) => readFile(path, "utf8"))).then((parts) => parts.join("\n")),
  Promise.all(cssFiles.map((path) => readFile(path, "utf8"))).then((parts) => parts.join("\n")),
]);
const builtText = `${html}\n${javascript}`;

for (const token of ["__PAGE_", "__OG_", "__CANONICAL_", "__SOCIAL_", "__EVENT_", "__STRUCTURED_", "%BASE_URL%"])
  if (html.includes(token)) fail(`Unresolved build token remains: ${token}`);

const expectedTitle = "IISWC 2026 Tutorial | Heterogeneous RISC-V ML &amp; Robotics";
const expectedDescription = "Hands-on IISWC 2026 tutorial on compiling, scheduling, tracing, and optimizing ML and robotic workloads on heterogeneous RISC-V SoCs using a lightweight Zephyr runtime.";
if (!html.includes(`<title>${expectedTitle}</title>`)) fail("Page title has drifted");
if (!html.includes(`name=\"description\" content=\"${expectedDescription}\"`)) fail("Meta description has drifted");

const canonical = data.match(/siteUrl:\s*"([^"]+)"/)?.[1];
if (!canonical) fail("siteUrl is missing from tutorial data");
if (!html.includes(`rel=\"canonical\" href=\"${canonical}\"`)) fail("Canonical URL has drifted");
if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail("Sitemap URL has drifted");

const schemaMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
if (!schemaMatch) {
  fail("Event structured data is missing");
} else {
  try {
    const schema = JSON.parse(schemaMatch[1]);
    if (schema["@type"] !== "EducationEvent") fail("Structured data must describe an EducationEvent");
    if (schema.name !== "Building, Tracing, and Optimizing End-to-End ML and Robotic Workloads on Heterogeneous RISC-V SoCs with a Lightweight Zephyr Runtime") fail("Structured data title has drifted");
    if (schema.startDate !== "2026-09-27T13:30:00-06:00") fail("Structured event start has drifted");
    if (schema.location?.name !== "Boulder, Colorado, USA") fail("Structured event location has drifted");
    if ("endDate" in schema) fail("Structured data must not invent an end time");
  } catch (error) {
    fail(`Invalid structured data JSON: ${error.message}`);
  }
}

let manifest;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`Invalid web manifest JSON: ${error.message}`);
}
if (manifest?.start_url !== "./" || manifest?.scope !== "./") {
  fail("Manifest must remain deployable below a GitHub Pages project path");
}

for (const [name, document] of [["index.html", html], ["instructions.html", labPage], ["404.html", notFound]]) {
  for (const match of document.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (!reference.startsWith("./") || reference.includes("#")) continue;
    const localPath = normalize(join(dirname(name), reference));
    if (localPath.startsWith("..")) {
      fail(`Path escapes site root in ${name}: ${reference}`);
      continue;
    }
    try {
      await access(join(root, localPath));
    } catch {
      fail(`Broken local reference in ${name}: ${reference}`);
    }
  }
}

const exactData = [
  "Sunday, September 27, 2026",
  "1:30 PM",
  "Half-day tutorial",
  "Boulder, Colorado",
  "https://iiswc.org/iiswc2026/reg.html",
  "https://forms.gle/n11XLXU7SjWG2MLM8",
  "https://docs.google.com/forms/d/e/1FAIpQLSd8E-eL5QhB4Pw9rl4VmtK9El5ibjzpgvJ24GloYlBBI4B14A/viewform?embedded=true",
  "Dima Nikiforov",
  "Shengjun Kris Dong",
  "Agustin Coppari Hollmann",
  "Loren Hung",
  "Ailsa Sun",
  "Chengyi Lux Zhang",
  "iansseijelly@berkeley.edu",
  "Yakun Sophia Shao",
];
for (const value of exactData) if (!data.includes(value)) fail(`Configured tutorial data is missing: ${value}`);
if (/REPLACE_WITH_GOOGLE_FORM_URL|href=["']#["']/.test(sourceText)) fail("A placeholder URL remains in source");
if (!data.includes("Slides, open-source repositories, and a tutorial guide will be provided after the tutorial.")) {
  fail("Tutorial materials notice has drifted");
}

const visibleContent = [
  "Sunday, September 27, 2026",
  "1:30 PM",
  "Half-day tutorial",
  "Boulder, Colorado",
  "Reserve Your Hands-on Spot",
  "IISWC Registration",
  "The tutorial RSVP does not replace IISWC conference registration.",
  "Building Embedded Models with ModelBlaster",
  "Tracing with TACIT",
  "XPU-RT: Expert Scheduling on Heterogeneous Hardware",
  "RiskyBird Demo",
  "Slides, open-source repositories, and a tutorial guide will be provided after the tutorial.",
  ...exactData.slice(6),
];
for (const value of visibleContent) if (!builtText.includes(value)) fail(`Built site is missing visible content: ${value}`);

const removedSections = [
  "Three parts. One end-to-end methodology.",
  "A Full-System Robotics Workload",
  "One Workload Flow, Multiple Execution Targets",
  "The Tutorial Stack",
  "Hands-on Without the Toolchain Setup",
  "What You'll Learn",
  "Intended Audience",
  "Computer architecture researchers",
];
for (const value of removedSections) if (builtText.includes(value)) fail(`Removed section returned: ${value}`);

const palette = `${css}\n${favicon}`.toLowerCase();
if (!palette.includes("#003262") || !palette.includes("#fdb515")) {
  fail("The Berkeley Blue and California Gold palette is incomplete");
}
for (const oldColor of ["#4ab7ff", "#3ee6dc", "#4ee0a1", "#a88dff", "#f2b84b"])
  if (palette.includes(oldColor)) fail(`Old accent color remains: ${oldColor}`);

if (!css.includes("Overpass") || !html.includes("overpass-latin.woff2")) {
  fail("The self-hosted Overpass font is not configured in the production site");
}

const bundleBytes = async (paths) => (await Promise.all(paths.map((path) => stat(path)))).reduce((sum, item) => sum + item.size, 0);
const jsBytes = await bundleBytes(javascriptFiles);
const cssBytes = await bundleBytes(cssFiles);
if (jsBytes > 500_000) fail(`JavaScript bundle is unexpectedly large: ${jsBytes} bytes`);
if (cssBytes > 100_000) fail(`CSS bundle is unexpectedly large: ${cssBytes} bytes`);

const checkPngDimensions = async (path, expectedWidth, expectedHeight, label) => {
  const png = await readFile(join(root, path));
  if (png.toString("ascii", 1, 4) !== "PNG") {
    fail(`${label} is not a PNG file`);
    return;
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    fail(`${label} must be ${expectedWidth}×${expectedHeight}, found ${width}×${height}`);
  }
};

await checkPngDimensions("assets/og-card.png", 1200, 630, "Social image");
await checkPngDimensions("assets/apple-touch-icon.png", 180, 180, "Apple touch icon");

/* The attendee lab instructions page. It is served offline from the tutorial
   router on a subpath, so nothing in it may reach the network, and it must never
   carry a secret that is handed out in the room instead. */

for (const token of ["%BASE_URL%", "__PAGE_", "__OG_"])
  if (labPage.includes(token)) fail(`Unresolved build token remains in instructions.html: ${token}`);

if (!labPage.includes("<title>Lab Instructions | IISWC 2026 Tutorial</title>")) {
  fail("The lab instructions page title has drifted");
}

for (const match of labPage.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  if (/^(?:[a-z]+:)?\/\//i.test(match[1])) fail(`Lab instructions page loads an off-network resource: ${match[1]}`);
}

if (/url\(\s*["']?(?:[a-z]+:)?\/\//i.test(css) || css.includes("@import")) {
  fail("The stylesheet pulls a resource over the network; the router serves this page offline");
}

/* A subpath deploy (http://10.42.0.1/tutorial/) breaks on any root-absolute asset
   URL, and the font is the one that hides in the stylesheet rather than the HTML. */
const fontUrl = css.match(/url\(\s*["']?([^"')]*overpass[^"')]*)/)?.[1];
if (!fontUrl) fail("The Overpass @font-face rule no longer points at a file");
else if (fontUrl.startsWith("/")) fail(`The font URL is root-absolute and breaks below a subpath: ${fontUrl}`);

const labContent = [
  "10.42.0.{N}",
  "aws-{N}.iiswc",
  "pynq-{N}",
  "/opt/iiswc/host/board_id.sh",
  "/opt/iiswc/host/aws_whoami.sh",
  "/opt/iiswc/host/aws_run.sh aws-{N}.iiswc",
  "chipyard_pynqz1_all_f40",
  "scripts/run_xpurt_schedule.py",
  "execCommand",
];
for (const value of labContent) if (!javascript.includes(value)) fail(`Lab instructions are missing: ${value}`);

for (const secret of ["BEGIN OPENSSH PRIVATE KEY", "BEGIN RSA PRIVATE KEY", "BEGIN EC PRIVATE KEY", "PuTTY-User-Key-File"])
  if (`${builtText}\n${javascript}`.includes(secret)) fail(`A private key reached the built site: ${secret}`);
if (!javascript.includes("handed out in the room")) {
  fail("The lab instructions no longer say that the passphrase, password and key are handed out in the room");
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Site validation passed (${required.length} required files, ${javascriptFiles.length} JS bundle, ${cssFiles.length} CSS bundle).`);
