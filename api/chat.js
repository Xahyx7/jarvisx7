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
        const { message, history = [] } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`💬 Processing message: ${message.substring(0, 50)}...`);

        // Detect if this is a search query
        const isSearchQuery = detectSearchIntent(message);
        
        if (isSearchQuery) {
            // Handle search query
            const searchResponse = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message })
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                
                // Format search results for JARVIS response
                const formattedResults = searchData.results.slice(0, 3).map((result, index) => 
                    `${index + 1}. **${result.title}**\n   ${result.snippet}\n   🔗 ${result.url}`
                ).join('\n\n');

                const searchSummary = `🔍 Here's what I found about "${message}":\n\n${formattedResults}`;
                
                return res.status(200).json({
                    response: searchSummary,
                    provider: `Search via ${searchData.provider}`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Route to AI selector for regular chat
        const aiResponse = await fetch('/api/ai-selector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: 'chat',
                message: message,
                history: history
            })
        });

        const result = await aiResponse.json();
        
        if (!aiResponse.ok) {
            throw new Error(result.error || 'AI processing failed');
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Smart chat error:', error);
        res.status(500).json({
            error: 'Chat processing failed',
            detail: error.message,
            provider: 'Error Handler'
        });
    }
};

function detectSearchIntent(message) {
    const searchKeywords = [
        'search for', 'find information about', 'look up', 'what\'s happening',
        'latest news', 'current events', 'recent', 'today', 'now', 'currently',
        'what happened', 'news about', 'information on'
    ];
    
    const messageLower = message.toLowerCase();
    return searchKeywords.some(keyword => messageLower.includes(keyword)) ||
           messageLower.includes('2024') || messageLower.includes('2025');
}
