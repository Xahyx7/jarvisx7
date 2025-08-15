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

        console.log(`Processing: ${message}`);

        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({ 
                error: 'Groq API key not configured'
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
                        content: 'You are JARVIS, Tony Stark\'s intelligent AI assistant. Provide helpful, accurate, and engaging responses to any question.' 
                    },
                    ...(history || []).slice(-4),
                    { role: 'user', content: message }
                ],
                max_tokens: 1500,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const err = await response.text().catch(() => 'Unknown error');
            console.log('Groq API error:', response.status, err);
            return res.status(response.status).json({ 
                error: 'Groq API error', 
                detail: err,
                status: response.status
            });
        }

        const data = await response.json();
        console.log('Groq response data:', JSON.stringify(data, null, 2));

        // More flexible AI response extraction
        let ai = null;
        
        if (data.choices && data.choices[0]) {
            if (data.choices.message && data.choices.message.content) {
                ai = data.choices.message.content;
            } else if (data.choices.text) {
                ai = data.choices.text;
            }
        }

        console.log('Extracted AI response:', ai);

        if (!ai) {
            console.log('No AI content found in response');
            return res.status(502).json({ 
                error: 'No AI response found',
                detail: 'Groq returned data but no content was extracted',
                debug_data: data
            });
        }

        if (ai.trim().length === 0) {
            console.log('AI response is empty after trimming');
            return res.status(502).json({ 
                error: 'Empty AI response',
                detail: 'AI returned empty content',
                raw_response: ai
            });
        }

        console.log(`✅ Success! AI response length: ${ai.length}`);
        
        res.status(200).json({
            response: ai,
            provider: 'Groq-Ultra-Fast',
            model: 'mixtral-8x7b-32768',
            tokens: data.usage?.total_tokens ?? 'n/a',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            detail: error.message,
            stack: error.stack
        });
    }
};
