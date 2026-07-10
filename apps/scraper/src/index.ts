import { saveLagenheter } from "./save.js";
import { scrapeLagenheter } from "./scraper.js";

async function main() {
  const save = process.argv.includes("--save");
  const allPages = process.argv.includes("--all") || save;
  const lagenheter = await scrapeLagenheter({ allPages });

  if (save) {
    const outputPath = await saveLagenheter(lagenheter);
    console.error(`Saved ${lagenheter.length} lägenheter to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(lagenheter, null, 2));
  console.error(`Fetched ${lagenheter.length} lägenheter`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
