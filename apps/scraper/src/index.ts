async function main() {
  console.log("Scraper ready. Add your scraping logic in apps/scraper/src/index.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
