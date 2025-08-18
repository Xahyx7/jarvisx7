module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        const cleanPrompt = encodeURIComponent(message.replace(/\\s+/g," "));
        const imageUrl = `https://pollinations.ai/p/${cleanPrompt}?width=512&height=512`;
        res.status(200).json({
            output_url: imageUrl,
            provider: "Pollinations.AI (2025 URL)",
            prompt: message
        });
    } catch (error) {
        res.status(500).json({ error: 'Pollinations image generation failed', detail: error.message });
    }
};
