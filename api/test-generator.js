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
        const { message, history } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message required' });
            return;
        }

        console.log(`📝 Test generation: ${message.substring(0, 100)}...`);

        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({ error: 'Groq API key not configured' });
            return;
        }

        // UPDATED MODEL - Same as chat.js
        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are JARVIS's test generation system. Create comprehensive, well-structured tests and educational content based on user requests. Include multiple choice questions, explanations, and proper formatting."
                },
                {
                    role: "user", 
                    content: message
                }
            ],
            max_tokens: 1500
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Test generation error:', errorText);
            return res.status(response.status).json({
                error: 'Groq API error',
                detail: errorText
            });
        }

        const data = await response.json();
        const testContent = data?.choices?.[0]?.message?.content;

        if (!testContent) {
            return res.status(502).json({
                error: 'No test content generated'
            });
        }
        
        console.log('✅ Test generated successfully');
        res.status(200).json({
            response: testContent,
            provider: 'Groq-TestGen',
            type: 'test-generation',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Test generation error:', error);
        res.status(500).json({
            error: 'Test generation failed',
            detail: error.message
        });
    }
};
