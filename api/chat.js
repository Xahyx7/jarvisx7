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

        // Context reference support for follow-ups
        let match = message.match(/\(REFERENCE:(.*?)\)$/s);
        if (match) {
            const referencedText = match[1].trim().substring(0, 500); // Limit context
            if (referencedText) {
                message = `Previous context: ${referencedText}\n\nUser follow-up: ${message.replace(match, '').trim()}`;
            }
        }

        const isSearchQuery = task === 'search' || detectSearchIntent(message);
        const finalTask = task || (isSearchQuery ? 'search' : 'chat');

        if (finalTask === 'search') {
            let results, provider;
            try {
                results = await callSerper(message);
                provider = 'Serper (Primary)';
            } catch (serperError) {
                try {
                    results = await callSerpstack(message);
                    provider = 'Serpstack (Fallback)';
                } catch (serpstackError) {
                    return res.status(500).json({
                        error: 'Search failed',
                        detail: `Both search APIs failed`
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
        } else {
            // Fixed Groq chat handling
            try {
                // Limit history to prevent token overflow
                const sanitizedHistory = Array.isArray(history) 
                    ? history.slice(-3).filter(m => m && m.role && m.content).map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: String(m.content).substring(0, 1000) // Limit content length
                    }))
                    : [];

                const chatResponse = await callGroq(message, sanitizedHistory);
                return res.status(200).json({
                    response: chatResponse,
                    provider: 'Groq (Primary)',
                    timestamp: new Date().toISOString()
                });
            } catch (groqError) {
                console.error('Groq Error:', groqError.message);
                return res.status(500).json({
                    error: 'Chat failed',
                    detail: groqError.message
                });
            }
        }
    } catch (error) {
        console.error('Chat handler error:', error);
        return res.status(500).json({
            error: 'Chat processing failed',
            detail: error.message
        });
    }
};

async function callGroq(message, history) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
    }
    
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful, clear responses." },
        ...history,
        { role: 'user', content: message.substring(0, 2000) } // Limit user message length
    ];

    console.log('Groq request messages:', messages.length);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Groq response data keys:', Object.keys(data));
    
    // Fixed response parsing
    if (!data) {
        throw new Error('Empty Groq response');
    }
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('No choices in Groq response');
    }
    if (!data.choices[0] || !data.choices.message || !data.choices.message.content) {
        throw new Error('Invalid choice structure in Groq response');
    }

    return data.choices.message.content;
}

async function callSerper(query) {
    if (!process.env.SERPER_API_KEY) {
        throw new Error('Serper API key not configured');
    }
    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': process.env.SERPER_API_KEY },
        body: JSON.stringify({ q: query, num: 5 })
    });
    if (!response.ok) throw new Error(`Serper error: ${response.status}`);
    const data = await response.json();
    return data.organic?.slice(0, 3).map(item => ({
        title: item.title, snippet: item.snippet, url: item.link
    })) || [];
}

async function callSerpstack(query) {
    if (!process.env.SERPSTACK_API_KEY) {
        throw new Error('Serpstack API key not configured');
    }
    const response = await fetch(`http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=5`);
    if (!response.ok) throw new Error(`Serpstack error: ${response.status}`);
    const data = await response.json();
    return data.organic_results?.slice(0, 3).map(item => ({
        title: item.title, snippet: item.snippet, url: item.url
    })) || [];
}

function detectSearchIntent(message) {
    const searchKeywords = [
        'search for', 'find information', 'look up', "what's happening",
        'latest news', 'current events', 'recent', 'today', 'news',
        'what happened', 'tell me about', 'information on', 'search'
    ];
    const messageLower = message.toLowerCase();
    return searchKeywords.some(keyword => messageLower.includes(keyword)) ||
        messageLower.includes('2024') || messageLower.includes('2025') ||
        messageLower.includes('latest') || messageLower.includes('current');
}
