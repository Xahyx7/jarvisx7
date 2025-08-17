module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { task, message, history = [] } = req.body;
        console.log(`🎯 AI Selector: task=${task}, message=${message?.substring(0, 30)}...`);

        if (!task || !message) {
            return res.status(400).json({ error: 'Task and message are required' });
        }

        // CHAT TASK - Use Groq only (no more DeepSeek bullshit)
        if (task === 'chat') {
            try {
                console.log('⚡ Calling Groq chat API...');
                const response = await callGroq(message, history);
                console.log('✅ Groq chat success');
                return res.status(200).json({
                    response: response,
                    provider: 'Groq (Primary)',
                    task: 'chat'
                });
            } catch (error) {
                console.error('❌ Groq chat failed:', error.message);
                return res.status(500).json({
                    error: 'Chat API failed',
                    detail: error.message
                });
            }
        }

        // SEARCH TASK - Use Serper → Serpstack fallback
        else if (task === 'search') {
            let results, provider;

            try {
                console.log('🔍 Calling Serper search API...');
                results = await callSerper(message);
                provider = 'Serper (Primary)';
                console.log('✅ Serper search success');
            } catch (serperError) {
                console.log('❌ Serper failed:', serperError.message);
                
                try {
                    console.log('🔍 Calling Serpstack search fallback...');
                    results = await callSerpstack(message);
                    provider = 'Serpstack (Fallback)';
                    console.log('✅ Serpstack search success');
                } catch (serpstackError) {
                    console.error('❌ Both search APIs failed');
                    return res.status(500).json({
                        error: 'Search API failed',
                        serper_error: serperError.message,
                        serpstack_error: serpstackError.message
                    });
                }
            }

            return res.status(200).json({
                results: results,
                provider: provider,
                task: 'search'
            });
        }

        else {
            return res.status(400).json({ error: `Unsupported task: ${task}` });
        }

    } catch (error) {
        console.error('💥 AI Selector error:', error);
        return res.status(500).json({ error: error.message });
    }
};

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
    if (!data.choices || !data.choices[0] || !data.choices.message) {
        throw new Error('Invalid Groq response format');
    }

    return data.choices.message.content;
}

async function callSerper(query) {
    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.SERPER_API_KEY
        },
        body: JSON.stringify({ q: query, num: 5 })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Serper API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.organic || data.organic.length === 0) {
        throw new Error('No search results from Serper');
    }

    return data.organic.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link
    }));
}

async function callSerpstack(query) {
    const url = `http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=5`;

    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Serpstack API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.request || !data.request.success) {
        throw new Error(data.error?.info || 'Serpstack API error');
    }

    if (!data.organic_results || data.organic_results.length === 0) {
        throw new Error('No search results from Serpstack');
    }

    return data.organic_results.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link || item.url
    }));
}
