import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const siteRoot = fileURLToPath(new URL("./", import.meta.url));
const outputDir = new URL("./previews/", import.meta.url);
const outDir = fileURLToPath(new URL("./out/", import.meta.url));

async function findAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  if (!address || typeof address === "string") {
    probe.close();
    throw new Error("Could not allocate a local preview port.");
  }
  await new Promise((resolve, reject) => {
    probe.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

async function installDeterministicRandom(page) {
  await page.addInitScript(() => {
    let state = 0x6d2b79f5;
    Math.random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  });
}

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 320, height: 700 },
  { name: "landscape", width: 844, height: 390 },
];

const browserCandidates = [
  chromium.executablePath(),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error("No Chromium browser found. Run `npx playwright install chromium` and retry.");
}

const port = await findAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(
  "python3",
  ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", outDir],
  { cwd: siteRoot, stdio: "ignore" },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Static preview server exited with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The static server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Static preview server did not start at ${baseUrl}.`);
}

let browser;
let failed = false;

try {
  await mkdir(outputDir, { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true });

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await installDeterministicRandom(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}",
    });

    const diagnostics = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const root = document.documentElement;
      const frame = document.querySelector("main")?.getBoundingClientRect();
      const footerBrand = document.querySelector(".orikata-footer-brand")?.getBoundingClientRect();
      const footerContact = document.querySelector(".orikata-footer-contact")?.getBoundingClientRect();
      const escaped = Array.from(
        document.querySelectorAll("main, main *, .orikata-footer-brand, .orikata-footer-brand *, .orikata-footer-contact, .orikata-footer-contact *"),
      )
        .filter((node) => node instanceof HTMLElement || node instanceof SVGElement)
        .map((node) => ({ node, rect: node.getBoundingClientRect() }))
        .filter(({ rect }) => rect.left < -0.5 || rect.right > viewportWidth + 0.5 || rect.top < -0.5 || rect.bottom > viewportHeight + 0.5)
        .map(({ node, rect }) => ({
          selector: node.className?.toString() || node.tagName.toLowerCase(),
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          top: Math.round(rect.top * 100) / 100,
          bottom: Math.round(rect.bottom * 100) / 100,
        }));

      const clipped = Array.from(document.querySelectorAll("h1, p, a, .orikata-footer-brand, .orikata-footer-contact"))
        .filter((node) => node instanceof HTMLElement)
        .filter((node) => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1)
        .map((node) => ({
          selector: node.className || node.tagName.toLowerCase(),
          client: [node.clientWidth, node.clientHeight],
          scroll: [node.scrollWidth, node.scrollHeight],
          text: node.textContent?.trim().replace(/\s+/g, " "),
        }));

      const footerOverlap = Boolean(
        footerBrand &&
          footerContact &&
          footerBrand.right > footerContact.left - 8 &&
          footerBrand.bottom > footerContact.top &&
          footerContact.bottom > footerBrand.top,
      );

      return {
        horizontalOverflow: root.scrollWidth - root.clientWidth,
        frameInset: frame
          ? {
              left: frame.left,
              right: viewportWidth - frame.right,
              top: frame.top,
              bottom: viewportHeight - frame.bottom,
            }
          : null,
        missingFooter: !footerBrand || !footerContact,
        footerOverlap,
        escaped,
        clipped,
      };
    });

    const errors = [];
    if (diagnostics.horizontalOverflow > 1) {
      errors.push(`horizontal overflow: ${diagnostics.horizontalOverflow}px`);
    }
    if (!diagnostics.frameInset) {
      errors.push("missing lockup card");
    } else if (diagnostics.frameInset.left < 11.5 || diagnostics.frameInset.right < 11.5) {
      errors.push(`lockup card inset below 12px: ${JSON.stringify(diagnostics.frameInset)}`);
    }
    if (diagnostics.missingFooter) errors.push("missing footer content");
    if (diagnostics.footerOverlap) errors.push("footer attribution overlaps contact link");
    if (diagnostics.escaped.length) errors.push(`viewport escapes: ${JSON.stringify(diagnostics.escaped)}`);
    if (diagnostics.clipped.length) errors.push(`clipped content: ${JSON.stringify(diagnostics.clipped)}`);

    const screenshotUrl = new URL(`${viewport.name}.png`, outputDir);
    await page.screenshot({ path: fileURLToPath(screenshotUrl), fullPage: true });
    await page.close();

    if (errors.length) {
      failed = true;
      console.error(`[${viewport.name}] FAIL\n${errors.join("\n")}`);
    } else {
      console.log(`[${viewport.name}] PASS -> previews/${viewport.name}.png`);
    }
  }
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}

if (failed) process.exit(1);
