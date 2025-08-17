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

        let response;
        let provider;

        try {
            response = await callDeepSeek(message, history);
            provider = 'DeepSeek (Current Knowledge)';
        } catch (e) {
            try {
                response = await callGroq(message, history);
                provider = 'Groq (Fallback)';
            } catch (e) {
                res.status(500).json({ error: 'Both DeepSeek and Groq APIs failed', detail: e.message });
                return;
            }
        }

        res.status(200).json({
            response: response,
            provider: provider,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

async function callDeepSeek(message, history) {
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses with current knowledge." },
        ...history.slice(-4),
        { role: 'user', content: message }
    ];

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
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function callGroq(message, history) {
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses." },
        ...history.slice(-4),
        { role: 'user', content: message }
    ];

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
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
