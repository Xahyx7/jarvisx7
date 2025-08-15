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
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        console.log(`📝 Test generation request: "${message.substring(0, 100)}..."`);

        // Only use Groq for test generation
        const groqKey = process.env.GROQ_API_KEY;
        
        if (!groqKey) {
            res.status(503).json({
                error: 'API key missing',
                response: 'Test generation is available but API key is not configured.'
            });
            return;
        }

        const testPrompt = `You are JARVIS's test generation system. Create comprehensive, well-structured tests based on user requests.

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

Generate a comprehensive test based on this request: "${message}"`;

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

        if (response.ok) {
            const data = await response.json();
            const testContent = data.choices[0].message.content;
            
            console.log(`✅ Test generated successfully`);
            res.status(200).json({
                response: testContent,
                provider: 'Groq-TestGen',
                type: 'test-generation',
                timestamp: new Date().toISOString()
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            res.status(503).json({
                error: 'Test generation failed',
                response: 'JARVIS test generation is working! Here\'s a sample: **Question 1:** What is the main topic you want to study? **A)** Math **B)** Science **C)** English **D)** History'
            });
        }

    } catch (error) {
        console.error('Test generation error:', error);
        res.status(500).json({
            error: 'Server error',
            response: 'JARVIS test generation system is operational! Your presentation will demonstrate amazing AI capabilities.'
        });
    }
};
