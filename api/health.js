module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Check only Groq API key
    const groqKey = process.env.GROQ_API_KEY;
    const isGroqConfigured = !!(groqKey && groqKey.length > 10);

    res.status(200).json({
        status: 'JARVIS Backend Online - Single API Mode',
        timestamp: new Date().toISOString(),
        version: '6.0.0-groq-only',
        environment: process.env.NODE_ENV || 'production',
        api_provider: 'Groq Ultra-Fast',
        api_configured: isGroqConfigured,
        groq_status: isGroqConfigured ? 'Ready' : 'Missing Key',
        message: isGroqConfigured ? 
            'JARVIS is ready with Groq AI for optimal performance' : 
            'Groq API key is missing - please check environment variables'
    });
};
