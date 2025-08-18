module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const groqKey = process.env.GROQ_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;
    const serpstackKey = process.env.SERPSTACK_API_KEY;
    const huggingfaceKey = process.env.HUGGINGFACE_API_KEY;
    
    const isGroqConfigured = !!(groqKey && groqKey.length > 10);
    const isSerperConfigured = !!(serperKey && serperKey.length > 10);
    const isSerpstackConfigured = !!(serpstackKey && serpstackKey.length > 10);
    const isHuggingfaceConfigured = !!(huggingfaceKey && huggingfaceKey.length > 10);
    
    res.status(200).json({
        status: 'JARVIS Backend Online',
        timestamp: new Date().toISOString(),
        version: '7.2.1-foundation-intelligence-fixed',
        apis: {
            groq: {
                configured: isGroqConfigured,
                status: isGroqConfigured ? 'Ready' : 'Missing Key',
                endpoint: '/api/chat'
            },
            serper: {
                configured: isSerperConfigured,
                status: isSerperConfigured ? 'Ready' : 'Missing Key',
                endpoint: '/api/chat (search mode)'
            },
            serpstack: {
                configured: isSerpstackConfigured,
                status: isSerpstackConfigured ? 'Ready (Fallback)' : 'Missing Key',
                endpoint: '/api/chat (search fallback)'
            },
            huggingface: {
                configured: isHuggingfaceConfigured,
                status: isHuggingfaceConfigured ? 'Ready' : 'Missing Key',
                endpoint: '/api/image-huggingface'
            },
            pollinations: {
                configured: true,
                status: 'Ready (No Key Required)',
                endpoint: '/api/image-pollination'
            },
            kroki: {
                configured: true,
                status: 'Ready (No Key Required)',
                endpoint: '/api/kroki'
            }
        },
        endpoints: [
            '/api/health',
            '/api/chat',
            '/api/image-pollination',
            '/api/image-huggingface',
            '/api/kroki'
        ]
    });
};
