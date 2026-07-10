import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { IntresseStatus } from "./intresse.js";

export type IntresseIndexFile = {
  fetchedAt: string;
  data: Record<string, IntresseStatus>;
};

const defaultOutputPath = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../web/public/intresse.json",
);

export async function saveIntresseIndex(
  data: Record<string, IntresseStatus>,
  outputPath = defaultOutputPath,
): Promise<string> {
  const payload: IntresseIndexFile = {
    fetchedAt: new Date().toISOString(),
    data,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outputPath;
}
