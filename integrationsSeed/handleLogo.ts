import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import sharp from "sharp";

const execAsync = promisify(exec);

async function downloadLogo(
  url: string,
  integrationPath: string
): Promise<void> {
  console.log(`Attempting to download logo from ${url}`);

  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  const contentType = response.headers["content-type"];
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(
      `Invalid content-type. Expected image/* but received ${contentType}`
    );
  }

  const writer = fs.createWriteStream(`${integrationPath}/logo.png`);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function convertLogoToSvg(integrationPath: string) {
  console.log(`Attempting to convert logo to SVG`);

  const pngPath = `${integrationPath}/logo.png`;
  const svgPath = `${integrationPath}/logo.svg`;

  const pngBuffer = await sharp(pngPath).png().toBuffer();
  const base64Png = pngBuffer.toString("base64");

  const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <image href="data:image/png;base64,${base64Png}" width="200" height="200"/>
      </svg>
    `;

  fs.writeFileSync(svgPath, svgContent);

  await execAsync(`rm ${pngPath}`);
  await execAsync(`mv ${svgPath} ${integrationPath}/icon.svg`);
  console.log(`SVG file created at ${svgPath}`);
}

export async function handleLogo(integrationPath: string, logoUrl: string) {
  console.log(`Handling logo for integration at ${integrationPath}`);
  await downloadLogo(logoUrl, integrationPath);
  await convertLogoToSvg(integrationPath);
  console.log(
    `Logo successfully handled for integration at ${integrationPath}`
  );
}
