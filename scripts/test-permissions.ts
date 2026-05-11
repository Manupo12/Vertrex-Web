import { google } from "googleapis";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no configurado");
  const credentials = JSON.parse(json);
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
  });
}

async function test() {
  console.log("Probando permisos de lectura en la carpeta...");
  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });
    const folderId = process.env.DRIVE_FOLDER_ID;
    
    console.log("ID Carpeta:", folderId);
    
    const res = await drive.files.get({
      fileId: folderId,
      fields: "id, name, owners",
    });
    
    console.log("✅ Acceso concedido!");
    console.log("Nombre de la carpeta:", res.data.name);
    console.log("Dueños:", JSON.stringify(res.data.owners));
    
  } catch (error) {
    console.error("❌ Error de permisos:", error.message);
    if (error.response) {
      console.error("Detalles:", error.response.data);
    }
  }
}

test();
