import { google } from "googleapis";
import * as dotenv from "dotenv";
import path from "path";
import readline from "readline";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

async function generateToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ ERROR: Debes configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local");
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3000" // O cualquier URL configurada en la consola de Google
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n1. Abre esta URL en tu navegador:\n", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\n2. Después de autorizar, serás redirigido a una URL. Pega aquí el valor del parámetro 'code' de esa URL: ", async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log("\n✅ ¡ÉXITO! Añade esto a tu .env.local:\n");
      console.log(`GOOGLE_REFRESH_TOKEN='${tokens.refresh_token}'`);
      console.log(`GOOGLE_CLIENT_ID='${clientId}'`);
      console.log(`GOOGLE_CLIENT_SECRET='${clientSecret}'`);
    } catch (error) {
      console.error("❌ Error al obtener el token:", error instanceof Error ? error.message : String(error));
    }
    rl.close();
  });
}

generateToken();
