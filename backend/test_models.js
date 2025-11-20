const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function listModels() {
    try {
        console.log("Testing gemini-1.5-pro...");
        const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        await model1.generateContent("Hello");
        console.log("gemini-1.5-pro works!");
    } catch (error) {
        console.error("gemini-1.5-pro failed:", error.message);
    }

    try {
        console.log("Testing gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model2.generateContent("Hello");
        console.log("gemini-pro works!");
    } catch (error) {
        console.error("gemini-pro failed:", error.message);
    }
}

listModels();
