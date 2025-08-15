// Node.js style export for Vercel serverless functions
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only accept POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        console.log(`Processing: ${message}`);

        // API providers
        const providers = [
            {
                name: "Groq",
                url: "https://api.groq.com/openai/v1/chat/completions",
                key: process.env.GROQ_API_KEY,
                model: "mixtral-8x7b-32768"
            },
            {
                name: "DeepSeek", 
                url: "https://api.deepseek.com/v1/chat/completions",
                key: process.env.DEEPSEEK_API_KEY,
                model: "deepseek-chat"
            },
            {
                name: "Together",
                url: "https://api.together.xyz/v1/chat/completions", 
                key: process.env.TOGETHER_API_KEY,
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
            }
        ];

        // Try providers in order
        for (const provider of providers) {
            if (!provider.key || provider.key.length < 10) continue;

            try {
                console.log(`Trying ${provider.name}...`);
                
                const response = await fetch(provider.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.key}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [
                            { 
                                role: 'system', 
                                content: 'You are JARVIS, an intelligent AI assistant. Provide helpful and engaging responses.' 
                            },
                            ...(history || []).slice(-4),
                            { role: 'user', content: message }
                        ],
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiResponse = data.choices[0].message.content;
                    
                    console.log(`Success with ${provider.name}`);
                    res.status(200).json({
                        response: aiResponse,
                        provider: provider.name,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            } catch (error) {
                console.log(`${provider.name} failed:`, error.message);
                continue;
            }
        }

        // All providers failed
        res.status(503).json({
            error: 'All AI providers unavailable',
            message: 'Please try again in a moment'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};
