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
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message (prompt) is required' });
        }

        console.log(`🎨 Image generation request: ${message}`);

        // Use Pollinations.ai - completely free
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(message)}?width=512&height=512&nologo=true`;
        
        console.log(`✅ Image generated: ${imageUrl}`);
        
        res.status(200).json({
            output_url: imageUrl,
            provider: 'Pollinations.ai (Free)',
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Image generation error:', error);
        res.status(500).json({ 
            error: 'Image generation failed',
            detail: error.message
        });
    }
};
