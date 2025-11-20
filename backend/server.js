const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Configuration ---
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --- Helper: Extract Text ---
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  console.log("extractTextFromFile for:", filePath, "ext:", ext);

  // 1) PDF
  if (ext === ".pdf") {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
      console.warn("pdf-parse returned empty text, falling back to raw read");
    } catch (err) {
      console.error("pdf-parse error, falling back to raw read:", err);
    }
    // fallback
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error("Fallback PDF read error:", err);
      throw new Error("Could not read PDF file.");
    }
  }

  // 2) Plain text
  if (ext === ".txt" || ext === ".md") {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error("Text file read error:", err);
      throw new Error("Failed to read text file.");
    }
  }

  // 3) HTML
  if (ext === ".html" || ext === ".htm") {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return raw.replace(/<[^>]+>/g, " ");
    } catch (err) {
      console.error("HTML file read error:", err);
      throw new Error("Failed to read HTML file.");
    }
  }

  throw new Error("Unsupported file type.");
}

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// --- Endpoints ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileId = req.file.filename;
  console.log("Uploaded file stored as:", fileId);
  res.json({
    fileId,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadTime: new Date().toISOString(),
  });
});

app.get("/api/file/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  const filePath = path.join(uploadsDir, fileId);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  res.download(filePath);
});

app.get("/api/file/:fileId/view", async (req, res) => {
  const fileId = req.params.fileId;
  const filePath = path.join(uploadsDir, fileId);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  try {
    const text = await extractTextFromFile(filePath);
    res.type("text/plain").send(text);
  } catch (err) {
    console.error("Error reading file for view:", err);
    res.status(500).json({ error: err.message || "Failed to read file" });
  }
});

const MAX_CHARS = 100000;

app.post("/api/generate-pid", async (req, res) => {
  const { fileId } = req.body || {};
  if (!fileId) return res.status(400).json({ error: "fileId is required" });
  if (!genAI) return res.status(500).json({ error: "Gemini API key missing" });

  const filePath = path.join(uploadsDir, fileId);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

  try {
    let rfpText = await extractTextFromFile(filePath);
    if (!rfpText || rfpText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from file." });
    }
    if (rfpText.length > MAX_CHARS) {
      rfpText = rfpText.slice(0, MAX_CHARS) + "\n...[TRUNCATED]...";
    }

    const prompt = `
You are an experienced project manager.
You are given the text of a Request for Proposal (RFP). Based on this RFP, draft a concise Project Initiation Document (PID).

RFP TEXT:
"""
${rfpText}
"""

Produce the PID with clear sections and headings:
1. Project Background and Context
2. Objectives and Scope
3. Key Deliverables
4. Stakeholders and Roles
5. High-Level Approach and Timeline
6. Risks and Assumptions
7. Success Criteria
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ pid: response.text() });
  } catch (error) {
    console.error("Error in /api/generate-pid:", error);
    res.status(500).json({ error: error.message || "Failed to generate PID" });
  }
});

// --- List all uploaded projects ---
app.get("/api/projects", (req, res) => {
  console.log("Listing projects...");
  try {
    const files = fs.readdirSync(uploadsDir);
    const projectList = files.map((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        fileId: file,
        originalName: file.substring(file.indexOf("-") + 1),
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
      };
    });
    projectList.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    res.json(projectList);
  } catch (err) {
    console.error("Error listing projects:", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// --- List all uploaded projects ---
app.get("/api/projects", (req, res) => {
  console.log("Listing projects...");
  try {
    const files = fs.readdirSync(uploadsDir);
    const projectList = files.map((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        fileId: file,
        originalName: file.substring(file.indexOf("-") + 1), // remove timestamp prefix
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
      };
    });
    // Sort by newest first
    projectList.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    res.json(projectList);
  } catch (err) {
    console.error("Error listing projects:", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// --- Delete a project file ---
app.delete("/api/projects/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  const filePath = path.join(uploadsDir, fileId);

  console.log("Delete requested for:", fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    fs.unlinkSync(filePath);
    console.log("File deleted:", fileId);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
