import { google } from "googleapis";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no configurado");
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

export async function uploadToDrive(fileBuffer: ArrayBuffer | Buffer, fileName: string, mimeType: string, parentFolderId?: string): Promise<{ id: string; webViewLink?: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const requestBody: Record<string, unknown> = { name: fileName };
  if (parentFolderId) requestBody.parents = [parentFolderId];
  const body = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  const res = await drive.files.create({
    requestBody,
    media: { mimeType, body },
    fields: "id, webViewLink",
  });
  return { id: res.data.id!, webViewLink: res.data.webViewLink || undefined };
}
