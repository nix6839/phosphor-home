#!/usr/bin/env node

import * as fs from "node:fs/promises";
import axios from "axios";
import chalk from "chalk";
import { Command } from "commander";
import packageJson from "../package.json" assert { type: "json" };

const ICON_API_URL = "https://api.phosphoricons.com";

async function main() {
  const program = new Command();
  program
    .version(packageJson.version)
    .option(
      "-r --release <version>",
      "Fetch icons from Phosphor API and compile to internal data structure"
    )
    .option("-p --published", "Published status of icons")
    .option("-P, --no-published", "Published status of icons")
    .option("-q --query <text>", "Fulltext search term")
    .option("-n --name <name>", "Exact icon namee match");

  program.parse(process.argv);
  const params = new URLSearchParams(Object.entries(program.opts())).toString();

  try {
    const res = await axios.get(`${ICON_API_URL}?${params}`);
    if (res.data) {
      let fileString = `\
import * as Icons from "phosphor-react";
import { IconEntry, IconCategory } from ".";

export const icons: ReadonlyArray<IconEntry> = [
`;

      res.data.icons.forEach((icon) => {
        let categories = "[";
        icon.searchCategories?.forEach((c) => {
          categories += `IconCategory.${c.toUpperCase()},`;
        });
        categories += "]";

        fileString += `\
  {
    name: "${icon.name}",
    categories: ${categories},
    tags: ${JSON.stringify(["*new*", ...icon.tags])},
    Icon: Icons.${icon.name
      .split("-")
      .map((substr) => substr.replace(/^\w/, (c) => c.toUpperCase()))
      .join("")},
  },
`;
        console.log(`${chalk.inverse.green(" DONE ")} ${icon.name}`);
      });

      fileString += `
];

if (process.env.NODE_ENV === "development") {
  console.log(\`\${icons.length} icons\`);
}

export const iconCount = (icons.length * 6)
  .toString()
  .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

`;

      try {
        await fs.writeFile(
          new URL("../src/lib/new.ts", import.meta.url).pathname,
          fileString
        );
        console.log(
          `${chalk.green(" DONE ")} ${res.data.icons.length} icons ingested`
        );
      } catch (e) {
        console.error(`${chalk.inverse.red(" FAIL ")} Could not write file`);
      }
    } else {
      console.error(`${chalk.inverse.red(" FAIL ")} No data`);
    }
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
}

main();
