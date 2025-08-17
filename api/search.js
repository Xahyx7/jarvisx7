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
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`🔍 Searching: ${query}`);

        let results;
        let provider;

        try {
            // Try Serper first
            results = await callSerper(query);
            provider = 'Serper';
        } catch (serperError) {
            console.log('❌ Serper failed, trying Serpstack...');
            try {
                results = await callSerpstack(query);
                provider = 'Serpstack';
            } catch (serpstackError) {
                throw new Error(`Search failed: ${serperError.message}`);
            }
        }

        res.status(200).json({
            results: results,
            query: query,
            provider: provider
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({
            error: 'Search failed',
            detail: error.message
        });
    }
};

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
        throw new Error(`Serper error: ${response.status}`);
    }

    const data = await response.json();
    return data.organic?.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link
    })) || [];
}

async function callSerpstack(query) {
    const response = await fetch(`http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=5`);

    if (!response.ok) {
        throw new Error(`Serpstack error: ${response.status}`);
    }

    const data = await response.json();
    return data.organic_results?.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        url: item.url
    })) || [];
}
