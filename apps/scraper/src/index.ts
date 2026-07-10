import { saveIntresseIndex } from "./save-intresse.js";
import { saveLagenheter } from "./save.js";
import { scrapeAll } from "./scraper.js";

async function main() {
  const save = process.argv.includes("--save");
  const allPages = process.argv.includes("--all") || save;
  const { lagenheter, intresseIndex } = await scrapeAll({
    allPages,
    withIntresse: save,
  });

  if (save) {
    const outputPath = await saveLagenheter(lagenheter);
    console.error(`Saved ${lagenheter.length} lägenheter to ${outputPath}`);

    const intressePath = await saveIntresseIndex(intresseIndex);
    const intresseCount = Object.keys(intresseIndex).length;
    console.error(`Saved intresse data for ${intresseCount} lägenheter to ${intressePath}`);
    return;
  }

  console.log(JSON.stringify(lagenheter, null, 2));
  console.error(`Fetched ${lagenheter.length} lägenheter`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
