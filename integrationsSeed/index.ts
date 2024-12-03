import fs from "fs";
import csv from "csv-parser";
import { exec } from "child_process";
import { promisify } from "util";
import { handleLogo } from "./handleLogo";
import { handleSetup } from "./handleSetup";
const execAsync = promisify(exec);

interface CsvRow {
  title: string;
  logoPng: string;
}

function getDashedString(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function seedIntegrations() {
  const csvRows: CsvRow[] = [];

  const errors: string[] = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("./integrationsList.csv")
      .pipe(csv())
      .on("data", (data: CsvRow) => csvRows.push(data))
      .on("end", resolve)
      .on("error", reject);
  });

  for (const { title, logoPng } of csvRows) {
    try {
      console.log("=======================");
      console.log("Seeding integration", title);

      const dashedTitle = getDashedString(title);
      const newPath = "../integrations/" + dashedTitle;

      await execAsync(`cp -R ./placeholder-integration ${newPath}`);

      await handleLogo(
        newPath,
        logoPng || `https://logo.clearbit.com/${title}.com`
      );

      await handleSetup(newPath, title, dashedTitle);

      console.log(`Attempting to publicly deploy ${title} integration`);

      await execAsync(`cd ${newPath} && npm i && bp deploy -y --public`);

      console.log(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        `Successfully publicly deployed ${title} integration`
      );
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        errors.push(`Error seeding ${title}: ${e.message}`);
      } else {
        errors.push(`Unknown error seeding ${title}`);
      }
    }
  }
  console.log("Finished processing with the following errors:");
  errors.forEach((error) => console.error(error));
}

seedIntegrations();
