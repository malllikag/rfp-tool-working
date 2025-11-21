const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const response = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // The above is just to get the client, but listModels is on the client or manager.
        // Actually listModels is a method on the GoogleGenerativeAI instance or we use the model manager.
        // Let's check the docs or try the standard way.
        // SDK v0.1.3+ has listModels on the client.

        // Wait, the SDK usage is:
        // const genAI = new GoogleGenerativeAI(API_KEY);
        // const model = genAI.getGenerativeModel({ model: "MODEL_NAME" });

        // To list models, we might need to use the API directly if the SDK doesn't expose it easily in this version,
        // OR just try to print what we can.

        // Let's try to use the model manager if it exists, or just fetch from the API endpoint manually to be sure.

        console.log("Fetching models via SDK...");
        // Note: In newer SDKs it might be different. Let's try a direct fetch to be 100% sure what the API sees.

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        // const fetch = require("node-fetch"); // We might not have node-fetch installed.
        // Let's use https module.
        const fs = require("fs");
        const https = require("https");
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.models) {
                    const names = json.models.map(m => m.name).join("\n");
                    fs.writeFileSync("available_models.txt", names);
                    console.log("Wrote models to available_models.txt");
                } else {
                    console.log("No models found or error:", json);
                }
            });
        }).on('error', (e) => {
            console.error(e);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
