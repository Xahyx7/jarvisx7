export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check API key availability from environment variables
    const apiKeys = {
        groq: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10,
        deepseek: !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 10,
        together: !!process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_KEY.length > 10,
        huggingface: !!process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.length > 10
    };

    const configuredApis = Object.values(apiKeys).filter(Boolean).length;
    const totalApis = Object.keys(apiKeys).length;

    res.status(200).json({
        status: 'JARVIS Backend Online',
        timestamp: new Date().toISOString(),
        version: '5.0.0-vercel',
        environment: process.env.NODE_ENV || 'production',
        apis_configured: configuredApis,
        apis_total: totalApis,
        keys_valid: configuredApis > 0,
        providers: {
            groq: apiKeys.groq ? 'Ready' : 'Missing Key',
            deepseek: apiKeys.deepseek ? 'Ready' : 'Missing Key', 
            together: apiKeys.together ? 'Ready' : 'Missing Key',
            huggingface: apiKeys.huggingface ? 'Ready' : 'Missing Key'
        }
    });
}
