module.exports = async (req, res) => {
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

        console.log(`Test generation: ${message.substring(0, 100)}...`);

        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({ error: 'Groq API key not configured' });
            return;
        }

        const testPrompt = `You are JARVIS's test generation system. Create comprehensive, well-structured tests based on user requests.

INSTRUCTIONS:
1. For any test generation request, create:
   - Multiple choice questions (4 options each, mark correct answer)
   - Short answer questions
   - Long answer/essay questions when appropriate
   - Difficulty levels: Easy, Medium, Hard

2. For CBSE subjects (Classes 6-12):
   - Follow NCERT curriculum guidelines
   - Include previous year question patterns
   - Provide marking schemes
   - Add reference to specific chapters/topics

3. Format your response with:
   - Clear section headers
   - Bold for questions and important text
   - Italic for instructions and notes
   - Numbered questions
   - Proper answer keys

4. Make tests practical and educational:
   - Include real-world applications
   - Provide explanations for correct answers
   - Add difficulty progression
   - Include time recommendations

Generate a comprehensive test based on: "${message}"`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: testPrompt },
                    ...(history || []).slice(-4),
                    { role: 'user', content: message }
                ],
                max_tokens: 3000,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            const err = await response.text().catch(() => 'Unknown error');
            return res.status(response.status).json({ 
                error: 'Groq API error', 
                detail: err 
            });
        }

        const data = await response.json();
        const testContent = data.choices?.[0]?.message?.content;

        if (!testContent || !testContent.trim()) {
            return res.status(502).json({ 
                error: 'Empty test generation response' 
            });
        }
        
        console.log('Test generated successfully');
        res.status(200).json({
            response: testContent,
            provider: 'Groq-TestGen',
            type: 'test-generation',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Test generation error:', error);
        res.status(500).json({
            error: 'Test generation failed',
            detail: error.message
        });
    }
};
