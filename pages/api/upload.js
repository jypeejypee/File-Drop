// pages/api/upload.js
import { google } from 'googleapis';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // important: disable Next.js default body parser
  },
};

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  // Wrap form.parse in a Promise to handle it properly
  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    console.log('Files:', files);

    // Handle both array and single file cases
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if filepath exists (different versions of formidable use different property names)
    const filePath = file.filepath || file.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path missing' });
    }

    const fileMetadata = {
      name: file.originalFilename || file.name || 'uploaded-file',
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
    };

    const media = {
      mimeType: file.mimetype || file.type || 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError.message);
    }

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileId: response.data.id,
      fileName: response.data.name,
      fileLink: response.data.webViewLink,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Make sure we always send a response
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: error.message || 'Upload failed' 
      });
    }
  }
}

