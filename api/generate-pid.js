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
        const { rfpText } = req.body || {};

        if (!rfpText || typeof rfpText !== 'string') {
            return res.status(400).json({ error: 'rfpText is required and must be a string' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured. Please add GEMINI_API_KEY to environment variables.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        let text = rfpText;
        if (text.length > MAX_CHARS) {
            text = text.slice(0, MAX_CHARS) + '\n...[TRUNCATED]...';
        }

        const prompt = `
You are an experienced project manager.
You are given the text of a Request for Proposal (RFP). Based on this RFP, draft a concise Project Initiation Document (PID).

RFP TEXT:
"""
${text}
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

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.status(200).json({ pid: response.text() });
    } catch (error) {
        console.error('Error in /api/generate-pid:', error);

        // Ensure we always return JSON
        const errorMessage = error.message || 'Failed to generate PID';
        const errorDetails = error.stack ? error.stack.substring(0, 200) : '';

        res.status(500).json({
            error: errorMessage,
            details: errorDetails,
            hint: 'Check that GEMINI_API_KEY is set in Vercel environment variables'
        });
    }
}
