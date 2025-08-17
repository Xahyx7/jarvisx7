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

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`💬 Chat handler: ${message.substring(0, 50)}...`);

        // Detect search queries
        const isSearchQuery = detectSearchIntent(message);
        const task = isSearchQuery ? 'search' : 'chat';

        console.log(`🎯 Detected task: ${task}`);

        // Route to AI selector
        const aiResponse = await fetch(`${req.headers.host || 'localhost:3000'}/api/ai-selector`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: task,
                message: message,
                history: history
            })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            throw new Error(errorData.error || 'AI Selector failed');
        }

        const result = await aiResponse.json();

        if (task === 'search') {
            // Format search results for display
            const formattedResults = result.results.slice(0, 3).map((item, index) => 
                `${index + 1}. **${item.title}**\n   ${item.snippet}\n   🔗 ${item.url}`
            ).join('\n\n');

            const searchSummary = `🔍 Here's what I found about "${message}":\n\n${formattedResults}`;
            
            return res.status(200).json({
                response: searchSummary,
                provider: result.provider,
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(200).json({
                response: result.response,
                provider: result.provider,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('💥 Chat handler error:', error);
        return res.status(500).json({
            error: 'Chat processing failed',
            detail: error.message
        });
    }
};

function detectSearchIntent(message) {
    const searchKeywords = [
        'search for', 'find information', 'look up', 'what\'s happening',
        'latest news', 'current events', 'recent', 'today', 'news',
        'what happened', 'tell me about', 'information on', 'search'
    ];
    
    const messageLower = message.toLowerCase();
    return searchKeywords.some(keyword => messageLower.includes(keyword)) ||
           messageLower.includes('2024') || messageLower.includes('2025') ||
           messageLower.includes('latest') || messageLower.includes('current');
}
