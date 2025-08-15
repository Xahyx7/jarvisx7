module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const apiKeys = {
        groq: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10,
        deepseek: !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 10,
        together: !!process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_KEY.length > 10,
        huggingface: !!process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.length > 10
    };

    const configuredApis = Object.values(apiKeys).filter(Boolean).length;

    res.status(200).json({
        status: 'JARVIS Backend Online',
        timestamp: new Date().toISOString(),
        apis_configured: configuredApis,
        providers: {
            groq: apiKeys.groq ? 'Ready' : 'Missing Key',
            deepseek: apiKeys.deepseek ? 'Ready' : 'Missing Key',
            together: apiKeys.together ? 'Ready' : 'Missing Key',
            huggingface: apiKeys.huggingface ? 'Ready' : 'Missing Key'
        }
    });
};
