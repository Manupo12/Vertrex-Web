import { google } from "googleapis";

export function getDriveClient() {
  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  });
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth });
}

export async function uploadToDrive(fileName: string, fileBuffer: Buffer, mimeType: string, folderId?: string) {
  const drive = getDriveClient();
  const folder = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const response = await drive.files.create({
    requestBody: { name: fileName, parents: folder ? [folder] : [] },
    media: { mimeType, body: fileBuffer },
    fields: "id, webViewLink",
  });

  return { driveFileId: response.data.id!, url: response.data.webViewLink! };
}

export async function downloadFromDrive(fileId: string) {
  const drive = getDriveClient();
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(response.data as ArrayBuffer);
}

export async function deleteFromDrive(fileId: string) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}
