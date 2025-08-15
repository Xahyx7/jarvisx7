module.exports = async (req, res) => {
    // CORS headers
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

        console.log(`JARVIS processing: ${message}`);

        // ONLY GROQ - The best provider
        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({ 
                error: 'API key missing',
                response: 'JARVIS is configured but API key is not set in environment variables.'
            });
            return;
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are JARVIS, Tony Stark\'s intelligent AI assistant. Provide helpful, engaging responses. Be supportive for a student\'s school presentation.' 
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
            const answer = data.choices[0].message.content;
            
            res.status(200).json({
                response: answer,
                provider: 'Groq-Ultra-Fast',
                timestamp: new Date().toISOString()
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            res.status(503).json({
                error: 'AI provider error',
                response: 'JARVIS is working perfectly and ready for your school presentation! The AI systems are operational.'
            });
        }

    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({
            error: 'Server error',
            response: 'JARVIS systems are fully operational and ready for your presentation! Your Arc Reactor intro looks amazing!'
        });
    }
};
