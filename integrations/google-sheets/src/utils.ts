import * as sdk from "@botpress/sdk";

export const extractSpreadsheetId = (url: string): string => {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);

  if (!match?.[1]) {
    throw new sdk.RuntimeError("Invalid Google Sheets URL format");
  }

  return match[1];
};
