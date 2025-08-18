module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    const groqKey = process.env.GROQ_API_KEY;
    const isConfigured = !!(groqKey && groqKey.length > 10);
    res.status(200).json({
        status: 'JARVIS Backend Online',
        timestamp: new Date().toISOString(),
        version: '7.2.1-foundation-intelligence', // Updated version
        api_provider: 'Groq',
        api_configured: isConfigured,
        groq_status: isConfigured ? 'Ready' : 'Missing Key'
    });
};
