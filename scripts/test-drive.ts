import { uploadToDrive } from "../src/lib/drive/service";
import * as dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  console.log("Iniciando prueba de Google Drive...");
  try {
    const buffer = Buffer.from("H");
    const result = await uploadToDrive(
      buffer,
      "test-tiny.txt",
      "text/plain",
      process.env.DRIVE_FOLDER_ID
    );
    console.log("✅ Subida exitosa!");
    console.log("ID del archivo:", result.id);
    console.log("Link:", result.webViewLink);
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

test();
