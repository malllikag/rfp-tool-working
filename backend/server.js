// server.js - Backend for RFP Tool
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

// Gemini AI configuration
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup with file size limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Helper: extract text from supported files
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // PDF
  if (ext === ".pdf") {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      // If valid text extracted, use it
      if (data?.text && data.text.trim().length > 0) {
        // Clean up the text: normalize newlines and spaces
        let cleanText = data.text
          .replace(/\r\n/g, "\n")
          .replace(/\n\s*\n/g, "\n\n") // Preserve paragraph breaks
          .replace(/[ \t]+/g, " ")     // Collapse multiple spaces
          .trim();
        return cleanText;
      }

      // ❗If pdf-parse returned nothing, DO NOT read raw PDF bytes
      console.error("PDF parsed but text is empty — treating as parse failure.");
      return null;
    } catch (e) {
      console.error("PDF parse error:", e);
      return null;
    }
  }

  // Plain text / markdown
  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filePath, "utf-8");
  }
  // HTML
  if (ext === ".html" || ext === ".htm") {
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw.replace(/<[^>]+>/g, " ");
  }
  throw new Error("Unsupported file type.");
}

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// File upload with error handling
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File too large. Maximum size is 50MB." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    console.log("Upload request received");
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("File uploaded:", req.file.filename);
    const fileId = req.file.filename;
    res.json({
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadTime: new Date().toISOString(),
    });
  });
});

// Download raw file
app.get("/api/file/:fileId", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.fileId);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.download(filePath);
});

// View file as text
app.get("/api/file/:fileId/view", async (req, res) => {
  console.log("View request for:", req.params.fileId);
  const filePath = path.join(uploadsDir, req.params.fileId);
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return res.status(404).json({ error: "File not found" });
  }
  try {
    const text = await extractTextFromFile(filePath);
    if (!text) {
      return res.status(400).json({
        error: "Could not extract text from the PDF. Try uploading a readable (non-scanned) PDF."
      });
    }
    console.log("Text extracted, length:", text.length);
    res.type("text/plain").send(text);
  } catch (e) {
    console.error("View error:", e);
    res.status(500).json({ error: e.message || "Failed to read file" });
  }
});

// List projects
app.get("/api/projects", (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const list = files.map((file) => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      return {
        fileId: file,
        originalName: file.substring(file.indexOf("-") + 1),
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
      };
    });
    list.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    res.json(list);
  } catch (e) {
    console.error("List error:", e);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// Generate PID
app.post("/api/generate-pid", async (req, res) => {
  const { fileId, rfpText } = req.body;
  if (!fileId && !rfpText) {
    return res.status(400).json({ error: "Either fileId or rfpText is required" });
  }
  let textContent = rfpText;
  if (fileId && !rfpText) {
    const filePath = path.join(uploadsDir, fileId);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    try {
      textContent = await extractTextFromFile(filePath);
      if (!textContent) {
        return res.status(400).json({
          error: "Could not extract text from the PDF. Try uploading a readable (non-scanned) PDF."
        });
      }
    } catch (e) {
      console.error("Extract error:", e);
      return res.status(500).json({ error: "Failed to extract text from file" });
    }
  }
  if (!textContent || textContent.trim().length === 0) {
    return res.status(400).json({ error: "No content to process" });
  }
  if (!genAI) {
    console.warn("Gemini not configured – returning placeholder PID");
    return res.json({ pid: "Generated PID placeholder (AI service not configured)" });
  }
  try {
    // Use gemini-2.0-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an expert project manager. Based on the following Request for Proposal (RFP), generate a comprehensive Project Initiation Document (PID).\n\nThe PID should include:\n1. Business Case - Why this project is needed\n2. Project Scope - What will be delivered\n3. Objectives - Specific measurable goals\n4. Deliverables - Key outputs\n5. Timeline - Estimated project duration and milestones\n6. Resources Required - Team, budget, tools\n7. Risks and Mitigation Strategies\n\nRFP Content:\n${textContent}\n\nGenerate a well‑structured PID:`;

    const result = await model.generateContent(prompt);
    const pid = result.response.text();
    res.json({ pid });
  } catch (e) {
    console.error("Gemini generation error:", e);
    // Return the actual error message for debugging
    res.json({ pid: `Generated PID placeholder (AI generation error: ${e.message})` });
  }
});

// Refine PID (AI Assistant)
app.post("/api/refine-pid", async (req, res) => {
  const { currentPid, instruction } = req.body;
  if (!currentPid || !instruction) {
    return res.status(400).json({ error: "currentPid and instruction are required" });
  }
  if (!genAI) {
    return res.status(503).json({ error: "AI service not configured" });
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an expert project manager. I have a Project Initiation Document (PID) and I need to refine it based on a specific instruction.

Current PID:
${currentPid}

Instruction:
${instruction}

Please provide the updated PID content only, incorporating the changes requested. Do not include any conversational text.`;

    const result = await model.generateContent(prompt);
    const refinedPid = result.response.text();
    res.json({ refinedPid });
  } catch (e) {
    console.error("Refine error:", e);
    res.status(500).json({ error: `Failed to refine PID: ${e.message}` });
  }
});

// Delete project
app.delete("/api/projects/:fileId", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.fileId);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  try {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted successfully" });
  } catch (e) {
    console.error("Delete error:", e);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
