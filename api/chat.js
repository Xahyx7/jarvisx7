module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { message = "", history = [] } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        
        console.log('📨 Processing message:', message.substring(0, 50));
        
        const cleanHistory = Array.isArray(history) 
            ? history.slice(-2).map(m => ({role: m.role, content: m.content})) 
            : [];
            
        const messages = [
            {role: "system", content: "You are JARVIS, Tony Stark's AI assistant."},
            ...cleanHistory,
            {role: "user", content: String(message)}
        ];
        
        console.log('🔑 Using API key:', process.env.GROQ_API_KEY ? 'SET' : 'NOT SET');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Groq API error:', errorText);
            throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw response keys:', Object.keys(data));
        console.log('📦 Choices length:', data.choices?.length);
        
        // SIMPLIFIED VALIDATION - This is the key fix!
        let content = null;
        
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                content = choice.message.content;
            } else if (choice.text) {
                content = choice.text;
            } else if (choice.delta && choice.delta.content) {
                content = choice.delta.content;
            }
        }
        
        if (!content) {
            console.error('❌ Full response structure:', JSON.stringify(data, null, 2));
            throw new Error("No content found in response");
        }
        
        console.log('✅ Content extracted, length:', content.length);
        
        res.status(200).json({
            response: content,
            provider: "Groq (llama-3.3-70b)",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('💥 Chat error:', error.message);
        res.status(500).json({
            error: "Chat failed",
            detail: error.message
        });
    }
};
