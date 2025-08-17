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
        const { query, num = 5 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`🔍 Searching for: ${query}`);

        // Search API configurations with fallbacks
        const searchApis = [
            {
                name: 'serper',
                url: 'https://google.serper.dev/search',
                key: process.env.SERPER_API_KEY,
                headers: { 'X-API-KEY': process.env.SERPER_API_KEY }
            },
            {
                name: 'serpstack',
                url: `http://api.serpstack.com/search?access_key=${process.env.SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}`,
                key: process.env.SERPSTACK_API_KEY,
                method: 'GET'
            }
        ];

        let lastError;

        // Try each search API
        for (const api of searchApis) {
            try {
                if (!api.key) {
                    console.log(`⚠️ Missing API key for ${api.name}`);
                    continue;
                }

                const result = await callSearchAPI(api, query, num);
                
                return res.status(200).json({
                    results: result.results,
                    query: query,
                    provider: api.name,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.log(`❌ ${api.name} search failed: ${error.message}`);
                lastError = error;
                continue;
            }
        }

        throw new Error(`All search APIs failed. Last error: ${lastError?.message}`);

    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({
            error: 'Search failed',
            detail: error.message
        });
    }
};

async function callSearchAPI(api, query, num) {
    try {
        let response;
        
        if (api.name === 'serper') {
            response = await fetch(api.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...api.headers
                },
                body: JSON.stringify({
                    q: query,
                    num: num
                })
            });
        } else {
            response = await fetch(api.url);
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Format results consistently
        let results = [];
        
        if (api.name === 'serper' && data.organic) {
            results = data.organic.slice(0, num).map(item => ({
                title: item.title,
                snippet: item.snippet,
                url: item.link
            }));
        } else if (api.name === 'serpstack' && data.organic_results) {
            results = data.organic_results.slice(0, num).map(item => ({
                title: item.title,
                snippet: item.snippet,
                url: item.url
            }));
        }

        return { results };

    } catch (error) {
        throw new Error(`${api.name} API call failed: ${error.message}`);
    }
}
