module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { message, history = [] } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        // Prepare history (max 2 previous exchanges)
        const safeHistory = (Array.isArray(history) ? history : []).slice(-2)
            .map(m => ({ role: m.role, content: m.content }));
        const messages = [
            {role: "system", content: "You are JARVIS, Tony Stark's AI assistant."},
            ...safeHistory,
            {role: "user", content: message}
        ];
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 500, temperature: 0.7 })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices.message)
            throw new Error('No model response');
        res.status(200).json({
            response: data.choices.message.content,
            provider: "Groq",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Chat failed", detail: error.message });
    }
};
