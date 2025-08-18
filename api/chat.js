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
        let { message, history = [], task } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`💬 Chat request: ${message.substring(0, 50)}...`);

        // Handle context references for follow-ups
        let match = message.match(/\(REFERENCE:(.*?)\)$/s);
        if (match) {
            const referencedText = match[1].trim().substring(0, 200);
            if (referencedText) {
                message = `Context: ${referencedText}\n\nQuestion: ${message.replace(match, '').trim()}`;
            }
        }

        // SIMPLIFIED: Only handle chat - no search routing
        if (!process.env.GROQ_API_KEY) {
            throw new Error('Groq API key not configured');
        }

        // Prepare clean messages for Groq
        const cleanHistory = Array.isArray(history) 
            ? history.slice(-2).filter(m => m && m.role && m.content).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: String(m.content).substring(0, 300)
            }))
            : [];

        const messages = [
            { 
                role: 'system', 
                content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses." 
            },
            ...cleanHistory,
            { 
                role: 'user', 
                content: message.substring(0, 800) 
            }
        ];

        console.log(`🧠 Calling Groq with ${messages.length} messages`);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Groq API error: ${response.status} - ${errorText}`);
            throw new Error(`Groq API failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📦 Groq response received`);

        // Simple response validation
        if (!data || !data.choices || !data.choices[0] || !data.choices.message) {
            throw new Error('Invalid Groq response structure');
        }

        const content = data.choices.message.content;
        if (!content) {
            throw new Error('Empty content from Groq');
        }

        console.log(`✅ Groq success, content length: ${content.length}`);

        return res.status(200).json({
            response: content,
            provider: 'Groq',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Chat error:', error.message);
        return res.status(500).json({
            error: 'Chat failed',
            detail: error.message
        });
    }
};
