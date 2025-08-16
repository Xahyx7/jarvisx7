module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        console.log(`🤖 Processing: ${message}`);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'API key not configured' });
        }

        // EXACT same format that worked in Hoppscotch
        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 1000  // Reduced from 2000 to avoid limits
        };

        console.log('📡 Calling Groq API...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`📊 Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Groq error:', errorText);
            return res.status(response.status).json({
                error: 'Groq API error',
                detail: errorText
            });
        }

        const data = await response.json();
        const aiMessage = data?.choices?.[0]?.message?.content;

        if (!aiMessage) {
            return res.status(502).json({
                error: 'No AI response',
                debug: data
            });
        }

        console.log(`✅ Success: ${aiMessage.length} chars`);

        return res.status(200).json({
            response: aiMessage,
            provider: 'Groq-Llama-3.3',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Error:', error);
        return res.status(500).json({
            error: 'Server error',
            detail: error.message
        });
    }
};
