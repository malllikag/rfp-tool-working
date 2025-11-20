const multiparty = require('multiparty');
const { put } = require('@vercel/blob');

// Store file metadata in memory (will be lost on function restart)
// For production, use a database like Vercel KV or Postgres
const fileStore = new Map();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ error: 'Failed to parse upload' });
            }

            const file = files.file?.[0];
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fs = require('fs');
            const fileBuffer = fs.readFileSync(file.path);
            const fileId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

            // Store file content in memory (temporary solution)
            fileStore.set(fileId, {
                buffer: fileBuffer,
                originalName: file.originalFilename,
                size: file.size,
                uploadTime: new Date().toISOString(),
                contentType: file.headers['content-type']
            });

            res.json({
                fileId,
                originalName: file.originalFilename,
                size: file.size,
                uploadTime: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

// Export fileStore for other functions to access
module.exports.fileStore = fileStore;
