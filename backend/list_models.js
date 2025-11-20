const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require("dotenv").config();

async function main() {
    try {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            console.error("No API key found in .env");
            return;
        }
        console.log("Using API Key ending in:", key.slice(-4));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            const modelList = data.models.map(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    return `- ${m.name} (supports generateContent)`;
                } else {
                    return `- ${m.name}`;
                }
            }).join('\n');

            console.log("Available models:");
            console.log(modelList);

            fs.writeFileSync('models_full.txt', modelList, 'utf8');
            console.log("Wrote models to models_full.txt");
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

main();
