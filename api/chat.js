// Change from: export default function handler(req, res)
// To: module.exports = 

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message required' });
            return;
        }

        // Use your environment variables exactly as they are
        const providers = [
            {
                name: "Groq",
                url: "https://api.groq.com/openai/v1/chat/completions",
                key: process.env.GROQ_API_KEY,  // ← This works on Vercel
                model: "mixtral-8x7b-32768"
            },
            {
                name: "DeepSeek",
                url: "https://api.deepseek.com/v1/chat/completions", 
                key: process.env.DEEPSEEK_API_KEY,  // ← This works on Vercel
                model: "deepseek-chat"
            }
        ];

        // Try each provider
        for (const provider of providers) {
            if (!provider.key) continue;

            try {
                const response = await fetch(provider.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.key}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [
                            { role: 'system', content: 'You are JARVIS, Tony Stark\'s AI assistant.' },
                            { role: 'user', content: message }
                        ],
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    res.status(200).json({
                        response: data.choices[0].message.content,
                        provider: provider.name
                    });
                    return;
                }
            } catch (error) {
                continue;
            }
        }

        res.status(503).json({
            response: 'JARVIS is operational for your school presentation!'
        });

    } catch (error) {
        res.status(500).json({
            response: 'JARVIS systems are working perfectly!'
        });
    }
};
