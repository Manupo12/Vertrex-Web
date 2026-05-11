import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciales de Google OAuth2 no configuradas (CLIENT_ID, CLIENT_SECRET o REFRESH_TOKEN)");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function uploadToDrive(fileBuffer: ArrayBuffer | Buffer, fileName: string, mimeType: string, parentFolderId?: string): Promise<{ id: string; webViewLink?: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const requestBody: Record<string, unknown> = { name: fileName };

  if (parentFolderId) {
    console.log("Subiendo a la carpeta:", parentFolderId);
    requestBody.parents = [parentFolderId];
  }

  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  const body = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody,
    media: { mimeType, body },
    fields: "id, webViewLink",
  });

  return { id: res.data.id!, webViewLink: res.data.webViewLink || undefined };
}
