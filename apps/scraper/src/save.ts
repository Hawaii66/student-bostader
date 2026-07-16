import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Lagenhet } from "./schema/lagenhet.js";

const defaultOutputPath = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../web/src/data/lagenheter.json",
);

export async function saveLagenheter(
  lagenheter: Lagenhet[],
  outputPath = defaultOutputPath,
): Promise<string> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(lagenheter, null, 2)}\n`, "utf8");
  return outputPath;
}
