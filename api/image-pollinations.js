module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`🎨 Pollinations image request: ${message}`);
        
        // Fixed Pollinations URL - use correct domain
        const cleanPrompt = encodeURIComponent(message.substring(0, 200));
        const imageUrl = `https://pollinations.ai/p/${cleanPrompt}?width=512&height=512&nologo=true&model=flux`;
        
        console.log(`✅ Pollinations image URL: ${imageUrl}`);
        
        res.status(200).json({
            output_url: imageUrl,
            provider: 'Pollinations.ai (Free)',
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Pollinations error:', error);
        res.status(500).json({ 
            error: 'Pollinations image generation failed',
            detail: error.message
        });
    }
};
