import { scrapeLagenheter } from "./scraper.js";

async function main() {
  const allPages = process.argv.includes("--all");
  const lagenheter = await scrapeLagenheter({ allPages });

  console.log(JSON.stringify(lagenheter, null, 2));
  console.error(`Fetched ${lagenheter.length} lägenheter`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
