import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ⏳ השגת הנתיב של הקובץ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 נתיב לתיקיית הפונטים שלך
const fontsDir = path.join(__dirname);
const outputFile = path.join(fontsDir, "vfs_fonts.js");

const vfsFonts = {};

(async () => {
  try {
    const files = await fs.readdir(fontsDir);

    for (const file of files) {
      if (file.endsWith(".ttf")) {
        const fontName = file.replace(".ttf", "");
        const fontData = await fs.readFile(path.join(fontsDir, file), {
          encoding: "base64",
        });
        vfsFonts[`${fontName}.ttf`] = fontData;
      }
    }

    await fs.writeFile(
      outputFile,
      `export const pdfMakeVfs = ${JSON.stringify(vfsFonts, null, 2)};`
    );

    console.log(
      "✅ Fonts converted successfully! `vfs_fonts.js` has been created."
    );
  } catch (error) {
    console.error("❌ Error converting fonts:", error);
  }
})();
