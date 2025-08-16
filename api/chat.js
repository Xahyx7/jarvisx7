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

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid message', 
                received: typeof message 
            });
        }

        console.log(`🤖 JARVIS processing: "${message.substring(0, 100)}"`);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey.length < 20) {
            console.error('❌ Groq API key missing or invalid');
            return res.status(503).json({ 
                error: 'API configuration error',
                detail: 'Groq API key not properly configured'
            });
        }

        const payload = {
            model: 'llama-3.3-70b-versatile', // ← Updated to current model
            messages: [
                { 
                    role: 'system', 
                    content: 'You are JARVIS, Tony Stark\'s AI assistant. Be helpful, intelligent, and engaging. Always provide complete responses.' 
                },
                ...history.slice(-4),
                { role: 'user', content: message }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.9,
            stream: false
        };

        console.log('📡 Calling Groq API with llama-3.3-70b-versatile...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'JARVIS-Ultimate/6.2'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📊 Groq response status: ${response.status}`);

        if (!response.ok) {
            let errorDetail = 'Unknown error';
            try {
                const errorData = await response.text();
                errorDetail = errorData;
                console.error('❌ Groq API error:', response.status, errorDetail);
            } catch (e) {
                console.error('❌ Failed to read error response');
            }

            return res.status(response.status >= 500 ? 503 : response.status).json({
                error: 'Groq API error',
                status: response.status,
                detail: errorDetail
            });
        }

        let data;
        try {
            data = await response.json();
            console.log('✅ Groq response received');
        } catch (e) {
            console.error('❌ Failed to parse Groq JSON response');
            return res.status(502).json({
                error: 'Invalid response format',
                detail: 'Could not parse AI response'
            });
        }

        const aiMessage = data?.choices?.[0]?.message?.content;

        if (!aiMessage) {
            console.error('❌ No AI content in response:', JSON.stringify(data, null, 2));
            return res.status(502).json({
                error: 'No AI response',
                detail: 'AI returned empty content',
                debug: data
            });
        }

        if (typeof aiMessage !== 'string' || aiMessage.trim().length === 0) {
            console.error('❌ Invalid AI response format');
            return res.status(502).json({
                error: 'Invalid AI response',
                detail: 'Response is not valid text'
            });
        }

        console.log(`✅ Success! Response length: ${aiMessage.length} chars`);

        return res.status(200).json({
            response: aiMessage.trim(),
            provider: 'Groq-Llama-3.3-70B',
            model: 'llama-3.3-70b-versatile',
            tokens: data?.usage?.total_tokens || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Server error:', error);
        
        if (error.name === 'AbortError') {
            return res.status(408).json({
                error: 'Request timeout',
                detail: 'AI service took too long to respond'
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            detail: error.message,
            type: error.name
        });
    }
};
