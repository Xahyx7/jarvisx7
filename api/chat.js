module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        console.log('💬 Processing message:', message.substring(0, 50) + '...');

        let response;
        let provider;

        // Try DeepSeek first
        try {
            console.log('🧠 Attempting DeepSeek API...');
            response = await callDeepSeek(message, history);
            provider = 'DeepSeek (Current Knowledge)';
            console.log('✅ DeepSeek success');
        } catch (deepSeekError) {
            console.log('❌ DeepSeek failed:', deepSeekError.message);
            
            // Fallback to Groq
            try {
                console.log('⚡ Attempting Groq fallback...');
                response = await callGroq(message, history);
                provider = 'Groq (Fallback)';
                console.log('✅ Groq success');
            } catch (groqError) {
                console.log('❌ Groq also failed:', groqError.message);
                res.status(500).json({ 
                    error: 'Both APIs failed', 
                    deepseek_error: deepSeekError.message,
                    groq_error: groqError.message
                });
                return;
            }
        }

        res.status(200).json({
            response: response,
            provider: provider,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Chat handler error:', error);
        res.status(500).json({ error: error.message });
    }
};

async function callDeepSeek(message, history) {
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses with current knowledge." },
        ...history.slice(-4),
        { role: 'user', content: message }
    ];

    console.log('🔗 DeepSeek request with', messages.length, 'messages');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            max_tokens: 1500,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log('🔴 DeepSeek HTTP error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices.message) {
        throw new Error('Invalid DeepSeek response format');
    }

    return data.choices.message.content;
}

async function callGroq(message, history) {
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses." },
        ...history.slice(-4),
        { role: 'user', content: message }
    ];

    console.log('🔗 Groq request with', messages.length, 'messages');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 1500,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log('🔴 Groq HTTP error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices.message) {
        throw new Error('Invalid Groq response format');
    }

    return data.choices.message.content;
}
