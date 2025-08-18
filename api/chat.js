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

        console.log(`💬 Chat request: task=${task}, message=${message.substring(0, 50)}...`);

        // Handle context references for follow-ups
        let match = message.match(/\(REFERENCE:(.*?)\)$/s);
        if (match) {
            const referencedText = match[1].trim().substring(0, 300);
            if (referencedText) {
                message = `Context: ${referencedText}\n\nQuestion: ${message.replace(match, '').trim()}`;
            }
        }

        // Detect search intent
        const isSearchQuery = task === 'search' || detectSearchIntent(message);
        const finalTask = task || (isSearchQuery ? 'search' : 'chat');

        if (finalTask === 'search') {
            return await handleSearch(message, res);
        } else {
            return await handleChat(message, history, res);
        }

    } catch (error) {
        console.error('💥 Chat handler error:', error);
        return res.status(500).json({
            error: 'Chat processing failed',
            detail: error.message
        });
    }
};

async function handleChat(message, history, res) {
    try {
        // Validate API key
        if (!process.env.GROQ_API_KEY) {
            throw new Error('Groq API key not configured');
        }

        // Sanitize and limit history to prevent token overflow
        const sanitizedHistory = Array.isArray(history) 
            ? history.slice(-2).filter(m => m && m.role && m.content).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: String(m.content).substring(0, 500)
            }))
            : [];

        // Prepare messages with proper structure
        const messages = [
            { 
                role: 'system', 
                content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful, concise responses." 
            },
            ...sanitizedHistory,
            { 
                role: 'user', 
                content: message.substring(0, 1000) 
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
                max_tokens: 800,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Groq API error: ${response.status} - ${errorText}`);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📦 Groq response received, keys: ${Object.keys(data)}`);

        // Robust response validation
        if (!data) {
            throw new Error('Empty response from Groq');
        }
        if (!data.choices || !Array.isArray(data.choices)) {
            throw new Error('Invalid choices field in Groq response');
        }
        if (data.choices.length === 0) {
            throw new Error('Empty choices array in Groq response');
        }
        if (!data.choices[0] || typeof data.choices !== 'object') {
            throw new Error('Invalid first choice in Groq response');
        }
        if (!data.choices.message || typeof data.choices.message !== 'object') {
            throw new Error('Invalid message field in first choice');
        }
        if (!data.choices.message.content) {
            throw new Error('No content in message');
        }

        const content = data.choices.message.content;
        console.log(`✅ Groq chat success, content length: ${content.length}`);

        return res.status(200).json({
            response: content,
            provider: 'Groq (Primary)',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Groq chat error:', error.message);
        return res.status(500).json({
            error: 'Chat failed',
            detail: error.message
        });
    }
}

async function handleSearch(query, res) {
    let results, provider;
    
    try {
        console.log('🔍 Trying Serper search...');
        results = await callSerper(query);
        provider = 'Serper (Primary)';
    } catch (serperError) {
        console.log(`❌ Serper failed: ${serperError.message}`);
        try {
            console.log('🔍 Trying Serpstack fallback...');
            results = await callSerpstack(query);
            provider = 'Serpstack (Fallback)';
        } catch (serpstackError) {
            return res.status(500).json({
                error: 'Search failed',
                detail: 'Both search APIs failed'
            });
        }
    }

    const formattedResults = results.slice(0, 3).map((item, index) =>
        `${index + 1}. **${item.title}**\n   ${item.snippet}\n   🔗 ${item.url}`
    ).join('\n\n');

    const searchSummary = `🔍 Here's what I found:\n\n${formattedResults}`;

    return res.status(200).json({
        response: searchSummary,
        provider: provider,
        timestamp: new Date().toISOString()
    });
}

async function callSerper(query) {
    if (!process.env.SERPER_API_KEY) {
        throw new Error('Serper API key not configured');
    }
    
    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.SERPER_API_KEY
        },
        body: JSON.stringify({
            q: query,
            num: 5
        })
    });

    if (!response.ok) {
        throw new Error(`Serper error: ${response.status}`);
    }

    const data = await response.json();
    return data.organic?.slice(0, 3).map(item => ({
        title: item.title || 'No title',
        snippet: item.snippet || 'No description',
        url: item.link || '#'
    })) || [];
}

async function callSerpstack(query) {
    if (!process.env.SERPSTACK_API_KEY) {
        throw new Error('Serpstack API key not configured');
    }

    const url = `http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=5`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Serpstack error: ${response.status}`);
    }

    const data = await response.json();
    return data.organic_results?.slice(0, 3).map(item => ({
        title: item.title || 'No title',
        snippet: item.snippet || 'No description',
        url: item.url || '#'
    })) || [];
}

function detectSearchIntent(message) {
    const searchKeywords = [
        'search for', 'find information', 'look up', "what's happening",
        'latest news', 'current events', 'recent', 'today', 'news',
        'what happened', 'tell me about', 'information on', 'search',
        'google', 'web search'
    ];
    
    const messageLower = message.toLowerCase();
    return searchKeywords.some(keyword => messageLower.includes(keyword)) ||
           messageLower.includes('2024') || messageLower.includes('2025') ||
           messageLower.includes('latest') || messageLower.includes('current');
}
