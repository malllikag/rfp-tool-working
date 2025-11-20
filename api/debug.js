export default function handler(req, res) {
    const { name = 'World' } = req.query;

    const envCheck = {
        nodeVersion: process.version,
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        envKeys: Object.keys(process.env).filter(k => !k.startsWith('VERCEL')),
    };

    return res.status(200).json({
        message: `Hello ${name}!`,
        debug: envCheck,
        timestamp: new Date().toISOString(),
    });
}
