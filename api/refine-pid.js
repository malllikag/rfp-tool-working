import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_CHARS = 100000;

export default async function handler(req, res) {
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
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error('Failed to parse body as JSON:', e);
            }
        }

        const { currentPid, instruction } = body || {};

        if (!currentPid || typeof currentPid !== 'string') {
            return res.status(400).json({ error: 'currentPid is required' });
        }
        if (!instruction || typeof instruction !== 'string') {
            return res.status(400).json({ error: 'instruction is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        let text = currentPid;
        if (text.length > MAX_CHARS) {
            text = text.slice(0, MAX_CHARS) + '\n...[TRUNCATED]...';
        }

        const prompt = `
You are an expert Project Manager.
Here is the current Project Initiation Document (PID):
"""
${text}
"""

The user wants to refine this PID with the following instruction:
"${instruction}"

Please rewrite the PID to incorporate these changes. 
- Maintain the existing markdown formatting and structure where possible, unless the instruction implies changing it.
- Be professional and concise.
- Return ONLY the updated PID text. Do not include conversational filler before or after.
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        res.status(200).json({ refinedPid: responseText });
    } catch (error) {
        console.error('Error in /api/refine-pid:', error);
        res.status(500).json({
            error: error.message || 'Failed to refine PID',
            details: error.stack ? error.stack.substring(0, 200) : ''
        });
    }
}
