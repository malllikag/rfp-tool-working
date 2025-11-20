const { GoogleGenerativeAI } = require('@google/generative-ai');

const MAX_CHARS = 100000;

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

    const { rfpText } = req.body || {};

    if (!rfpText || typeof rfpText !== 'string') {
        return res.status(400).json({ error: 'rfpText is required and must be a string' });
    }

    const genAI = process.env.GEMINI_API_KEY
        ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        : null;

    if (!genAI) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    try {
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
3. Key. Key Deliverables
4. Stakeholders and Roles
5. High-Level Approach and Timeline
6. Risks and Assumptions
7. Success Criteria
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ pid: response.text() });
    } catch (error) {
        console.error('Error in /api/generate-pid:', error);
        res.status(500).json({ error: error.message || 'Failed to generate PID' });
    }
};
