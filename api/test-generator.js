const TEST_PROVIDERS = [
    {
        name: "DeepSeek-Educational",
        url: "https://api.deepseek.com/v1/chat/completions",
        key: process.env.DEEPSEEK_API_KEY,
        model: "deepseek-chat",
        priority: 1
    },
    {
        name: "Together-AI-Test",
        url: "https://api.together.xyz/v1/chat/completions", 
        key: process.env.TOGETHER_API_KEY,
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        priority: 2
    },
    {
        name: "Groq-Fast-Test",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: process.env.GROQ_API_KEY,
        model: "mixtral-8x7b-32768", 
        priority: 3
    }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`📝 Test generation request: "${message.substring(0, 100)}..."`);

        const availableProviders = TEST_PROVIDERS
            .filter(p => p.key && p.key.length > 10)
            .sort((a, b) => a.priority - b.priority);

        if (availableProviders.length === 0) {
            return res.status(503).json({
                error: 'No test generation providers available'
            });
        }

        for (const provider of availableProviders) {
            try {
                console.log(`🔄 Trying test generation with ${provider.name}...`);
                const testContent = await generateTest(provider, message, history || []);
                
                if (testContent && testContent.length > 50) {
                    console.log(`✅ Test generated with ${provider.name}`);
                    return res.json({
                        response: testContent,
                        provider: provider.name,
                        type: 'test-generation',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.log(`❌ ${provider.name} test generation failed: ${error.message}`);
                continue;
            }
        }

        throw new Error('All test generation methods failed');

    } catch (error) {
        console.error('Test generation error:', error);
        res.status(500).json({
            error: 'Test generation failed',
            message: error.message
        });
    }
}

async function generateTest(provider, message, history) {
    const testPrompt = `You are a specialized test generator for JARVIS AI. Create comprehensive, well-structured tests based on user requests.

INSTRUCTIONS:
1. **For any test generation request, create:**
   - Multiple choice questions (4 options each, mark correct answer)
   - Short answer questions
   - Long answer/essay questions when appropriate
   - Difficulty levels: Easy, Medium, Hard

2. **For CBSE subjects (Classes 6-12):**
   - Follow NCERT curriculum guidelines
   - Include previous year question patterns
   - Provide marking schemes
   - Add reference to specific chapters/topics

3. **Format your response with:**
   - Clear section headers
   - **Bold** for questions and important text
   - *Italic* for instructions and notes
   - Numbered questions
   - Proper answer keys

4. **Make tests practical and educational:**
   - Include real-world applications
   - Provide explanations for correct answers
   - Add difficulty progression
   - Include time recommendations

Generate a comprehensive test based on this request: "${message}"

Provide a complete, ready-to-use test with clear formatting.`;

    const messages = [
        { role: 'system', content: testPrompt },
        ...history.slice(-4),
        { role: 'user', content: message }
    ];

    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.key}`,
            'User-Agent': 'JARVIS-TestGen/5.0'
        },
        body: JSON.stringify({
            model: provider.model,
            messages: messages,
            max_tokens: 3000,
            temperature: 0.8,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
        throw new Error(`Invalid response from ${provider.name}`);
    }
    
    return data.choices.message.content;
}
