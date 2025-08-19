module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        
        console.log('🎨 Pollinations request:', message);
        
        // CORRECT POLLINATIONS API FORMAT (from official docs)
        const cleanPrompt = encodeURIComponent(message.trim());
        const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&model=flux&nologo=true&enhance=true`;
        
        console.log('✅ Generated URL:', imageUrl);
        
        res.status(200).json({
            output_url: imageUrl,
            provider: "Pollinations.AI",
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Pollinations error:', error);
        res.status(500).json({ 
            error: 'Pollinations failed',
            detail: error.message
        });
    }
};
