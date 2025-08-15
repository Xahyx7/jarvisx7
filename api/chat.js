export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history, requestType } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required',
                message: 'Please provide a valid message string'
            });
        }

        if (message.length > 10000) {
            return res.status(400).json({
                error: 'Message too long',
                message: 'Please keep messages under 10,000 characters'
            });
        }

        console.log(`🤖 Processing message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

        // AI providers configuration
        const API_PROVIDERS = [
            {
                name: "Groq-Ultra-Fast",
                url: "https://api.groq.com/openai/v1/chat/completions",
                key: process.env.GROQ_API_KEY,
                model: "mixtral-8x7b-32768",
                type: "openai-compatible",
                priority: 1,
                maxTokens: 2000
            },
            {
                name: "DeepSeek-Intelligence",
                url: "https://api.deepseek.com/v1/chat/completions", 
                key: process.env.DEEPSEEK_API_KEY,
                model: "deepseek-chat",
                type: "openai-compatible",
                priority: 2,
                maxTokens: 2000
            },
            {
                name: "Together-AI-Llama",
                url: "https://api.together.xyz/v1/chat/completions",
                key: process.env.TOGETHER_API_KEY,
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                type: "openai-compatible", 
                priority: 3,
                maxTokens: 2000
            },
            {
                name: "HuggingFace-Backup",
                url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
                key: process.env.HUGGINGFACE_API_KEY,
                type: "huggingface",
                priority: 4
            }
        ];

        // Filter and sort providers by priority
        const sortedProviders = API_PROVIDERS
            .filter(p => p.key && p.key.length > 10)
            .sort((a, b) => a.priority - b.priority);

        if (sortedProviders.length === 0) {
            return res.status(503).json({
                error: 'No AI providers configured',
                message: 'Server configuration error - no API keys available'
            });
        }

        // Try providers in priority order
        for (const provider of sortedProviders) {
            try {
                console.log(`🔄 Trying ${provider.name}...`);
                const response = await callAIProvider(provider, message, history || []);
                
                if (response && response.length > 10) {
                    console.log(`✅ Success with ${provider.name} (${response.length} chars)`);
                    return res.json({
                        response: response,
                        provider: provider.name,
                        model: provider.model || 'Unknown',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.log(`❌ ${provider.name} failed: ${error.message}`);
                continue;
            }
        }

        // All providers failed
        res.status(503).json({
            error: 'All AI providers are currently unavailable',
            message: 'Please try again in a moment. All configured providers are experiencing issues.',
            providers_tried: sortedProviders.map(p => p.name)
        });

    } catch (error) {
        console.error('💥 Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

async function callAIProvider(provider, message, history) {
    const systemPrompt = `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant with unlimited knowledge and capabilities.

Guidelines:
- Provide helpful, accurate, and detailed responses
- Be engaging, supportive, and intelligent  
- Use clear formatting with bold and italic when helpful
- No topic restrictions - answer any question asked
- Include examples and real-world applications when relevant
- Be encouraging and positive in your responses
- For educational queries, provide CBSE-aligned content when appropriate

You can discuss any topic without limitations. Provide comprehensive, intelligent responses that demonstrate your advanced capabilities.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: message }
    ];

    if (provider.type === 'openai-compatible') {
        return await callOpenAICompatible(provider, messages);
    } else if (provider.type === 'huggingface') {
        return await callHuggingFace(provider, message);
    }
    
    throw new Error(`Unsupported provider type: ${provider.type}`);
}

async function callOpenAICompatible(provider, messages) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.key}`,
            'User-Agent': 'JARVIS-AI-Ultimate/5.0'
        },
        body: JSON.stringify({
            model: provider.model,
            messages: messages,
            max_tokens: provider.maxTokens || 2000,
            temperature: 0.7,
            stream: false,
            top_p: 0.9
        })
    });

    if (!response.ok) {
        let errorText;
        try {
            const errorData = await response.json();
            errorText = errorData.error?.message || errorData.message || 'Unknown error';
        } catch {
            errorText = await response.text() || `HTTP ${response.status}`;
        }
        throw new Error(`${provider.name} API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices.message) {
        throw new Error(`Invalid response format from ${provider.name}`);
    }
    
    return data.choices.message.content;
}

async function callHuggingFace(provider, message) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'JARVIS-AI-Ultimate/5.0'
        },
        body: JSON.stringify({
            inputs: message,
            parameters: {
                max_length: 500,
                temperature: 0.7,
                do_sample: true,
                return_full_text: false,
                repetition_penalty: 1.1
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HuggingFace API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data[0] && data.generated_text) {
        return data.generated_text;
    } else if (data.generated_text) {
        return data.generated_text;
    } else if (data.error) {
        throw new Error(`HuggingFace error: ${data.error}`);
    }
    
    throw new Error('Invalid HuggingFace response format');
}
