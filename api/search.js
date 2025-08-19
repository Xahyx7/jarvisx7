module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        
        console.log('🔍 Web search request:', message);
        
        // Try Serper first
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
                    detail: 'Both search APIs failed'
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
        
    } catch (error) {
        console.error('❌ Search error:', error);
        return res.status(500).json({
            error: 'Search failed',
            detail: error.message
        });
    }
};

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
        body: JSON.stringify({ q: query, num: 5 })
    });
    
    if (!response.ok) throw new Error(`Serper error: ${response.status}`);
    
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
    
    const response = await fetch(`http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=5`);
    
    if (!response.ok) throw new Error(`Serpstack error: ${response.status}`);
    
    const data = await response.json();
    return data.organic_results?.slice(0, 3).map(item => ({
        title: item.title || 'No title',
        snippet: item.snippet || 'No description',
        url: item.url || '#'
    })) || [];
}
