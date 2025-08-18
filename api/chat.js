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

        // --- Context reference support for follow-ups ("explain again", etc.) ---
        let match = message.match(/\(REFERENCE:(.*?)\)$/s);
        if (match) {
            const referencedText = match[1].trim();
            if (referencedText) {
                message = `Previous context: ${referencedText}\n\nUser follow-up: ${message.replace(match, '').trim()}`;
            }
        }

        // Detect search queries if no task specified
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
                        detail: `Both search APIs failed: ${serperError.message}, ${serpstackError.message}`
                    });
                }
            }
            const formattedResults = results.slice(0, 3).map((item, index) =>
                `${index + 1}. **${item.title}**\n   ${item.snippet}\n   🔗 ${item.url}`
            ).join('\n\n');
            const searchSummary = `🔍 Here's what I found about "${message}":\n\n${formattedResults}`;
            return res.status(200).json({
                response: searchSummary,
                provider: provider,
                timestamp: new Date().toISOString()
            });
        } else {
            // Handle chat with sanitized messages
            try {
                const sanitizedHistory = history.slice(-4).map(m => ({
                    role: m.role,
                    content: m.content
                }));

                const chatResponse = await callGroq(message, sanitizedHistory);
                return res.status(200).json({
                    response: chatResponse,
                    provider: 'Groq (Primary)',
                    timestamp: new Date().toISOString()
                });
            } catch (groqError) {
                return res.status(500).json({
                    error: 'Chat failed',
                    detail: groqError.message
                });
            }
        }
    } catch (error) {
        return res.status(500).json({
            error: 'Chat processing failed',
            detail: error.message
        });
    }
};

async function callGroq(message, history) {
    const messages = [
        { role: 'system', content: "You are JARVIS, Tony Stark's AI assistant. Provide helpful responses." },
        ...history,
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
    if (!data || !Array.isArray(data.choices) || data.choices.length === 0 ||
        !data.choices[0] || !data.choices.message || !data.choices.message.content) {
        throw new Error('Invalid Groq response');
    }
    return data.choices.message.content;
}

async function callSerper(query) {
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
