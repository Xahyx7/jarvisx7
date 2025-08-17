module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { task, message, history = [] } = req.body;
        
        console.log(`🧠 AI Selector processing: ${task}`);

        // API configurations with fallbacks
        const apiConfig = {
            chat: [
                { 
                    name: 'deepseek', 
                    url: 'https://api.deepseek.com/v1/chat/completions',
                    key: process.env.DEEPSEEK_API_KEY,
                    model: 'deepseek-chat'
                },
                { 
                    name: 'groq', 
                    url: 'https://api.groq.com/openai/v1/chat/completions',
                    key: process.env.GROQ_API_KEY,
                    model: 'llama-3.3-70b-versatile'
                }
            ]
        };

        const apis = apiConfig[task] || apiConfig.chat;
        let lastError;

        // Try each API in the chain
        for (const api of apis) {
            try {
                if (!api.key) {
                    console.log(`⚠️ Missing API key for ${api.name}`);
                    continue;
                }

                const result = await callChatAPI(api, message, history);
                
                return res.status(200).json({
                    response: result.content,
                    provider: api.name,
                    task: task,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.log(`❌ ${api.name} failed: ${error.message}`);
                lastError = error;
                continue;
            }
        }

        throw new Error(`All APIs failed. Last error: ${lastError?.message}`);

    } catch (error) {
        console.error('AI Selector error:', error);
        res.status(500).json({
            error: 'AI selection failed',
            detail: error.message
        });
    }
};

async function callChatAPI(api, message, history) {
    const messages = [
        { 
            role: 'system', 
            content: 'You are JARVIS, Tony Stark\'s advanced AI assistant. Provide helpful, intelligent responses with current knowledge when possible.' 
        },
        ...history.slice(-6), // Include recent context
        { role: 'user', content: message }
    ];

    const response = await fetch(api.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.key}`
        },
        body: JSON.stringify({
            model: api.model,
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`${response.status}: ${errorData.error?.message || errorData.detail || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
        throw new Error('No response from API');
    }

    return {
        content: data.choices.message.content
    };
}
