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

        // Get Groq API key
        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({ 
                error: 'API key missing',
                response: 'Groq API key is not configured in environment variables.'
            });
            return;
        }

        // ACTUALLY CALL GROQ AI - NO FALLBACK FAKE RESPONSES
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
                        content: 'You are JARVIS, Tony Stark\'s intelligent AI assistant. Provide helpful, accurate, and engaging responses to any question. Be supportive and encouraging.' 
                    },
                    ...(history || []).slice(-4),
                    { role: 'user', content: message }
                ],
                max_tokens: 1500,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        // Check if Groq API call was successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            
            res.status(503).json({
                error: 'AI provider error',
                response: `I'm experiencing connectivity issues with the AI service (Status: ${response.status}). Please try again in a moment.`,
                debug: errorText
            });
            return;
        }

        // Parse the successful response
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices.message) {
            console.error('Invalid Groq response format:', data);
            res.status(503).json({
                error: 'Invalid AI response',
                response: 'The AI service returned an unexpected format. Please try again.'
            });
            return;
        }

        const aiResponse = data.choices[0].message.content;
        
        if (!aiResponse || aiResponse.trim().length === 0) {
            res.status(503).json({
                error: 'Empty AI response',
                response: 'The AI service returned an empty response. Please rephrase your question and try again.'
            });
            return;
        }

        // SUCCESS - Return the actual AI response
        console.log(`✅ Groq AI responded successfully (${aiResponse.length} chars)`);
        
        res.status(200).json({
            response: aiResponse,
            provider: 'Groq-Ultra-Fast',
            model: 'mixtral-8x7b-32768',
            timestamp: new Date().toISOString(),
            tokens: data.usage ? data.usage.total_tokens : 'unknown'
        });

    } catch (error) {
        console.error('Function error:', error);
        
        // Only show fallback message if there's a real server error
        res.status(500).json({
            error: 'Server error',
            response: `Internal server error: ${error.message}. Please try again.`,
            debug: error.stack
        });
    }
};
