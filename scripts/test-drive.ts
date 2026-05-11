import { uploadToDrive } from "../src/lib/drive/service";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  console.log("Iniciando prueba de Google Drive...");
  try {
    const buffer = Buffer.from("H");
    const result = await uploadToDrive(
      "test-tiny.txt",
      buffer,
      "text/plain",
      process.env.DRIVE_FOLDER_ID
    );
    console.log("✅ Subida exitosa!");
    console.log("ID del archivo:", result.driveFileId);
    console.log("Link:", result.url);
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

test();
