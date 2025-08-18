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

        console.log(`🤖 Hugging Face image request: ${message}`);

        const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: message,
                parameters: {
                    width: 512,
                    height: 512
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        // Hugging Face returns binary image data
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Image}`;
        
        res.status(200).json({
            output_url: imageUrl,
            provider: 'Hugging Face (Stable Diffusion 2.1)',
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Hugging Face error:', error);
        res.status(500).json({ 
            error: 'Hugging Face image generation failed',
            detail: error.message
        });
    }
};
