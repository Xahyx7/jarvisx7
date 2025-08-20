// /api/chat.js - Fixed version for Vercel (CommonJS + Correct Optional Chaining)

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // Validate API key
  if (!GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY missing');
    return res.status(500).json({ 
      error: "API key missing",
      response: "Go to aistudio.google.com to get your free API key, then add it to Vercel environment variables as GEMINI_API_KEY"
    });
  }

  const userMessage = req.body?.message;
  if (!userMessage) {
    console.log('❌ No message provided');
    return res.status(400).json({ 
      error: "No message",
      response: "Please provide a message."
    });
  }

  console.log('📤 Sending to Gemini:', userMessage.substring(0, 50));

  try {
    // Use Gemini 1.5 Flash (completely free)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    const data = await response.json();
    console.log('📥 Gemini response received');
    
    // ✅ FIXED: Correct optional chaining with proper array access
    if (data?.candidates?.[0]?.content?.parts?.?.text) {
      const reply = data.candidates.content.parts.text;
      console.log('✅ Success:', reply.substring(0, 50));
      return res.status(200).json({ 
        response: reply, 
        provider: "Gemini 1.5 Flash (Free)"
      });
    }

    // Handle safety blocks
    if (data?.candidates?.?.finishReason === 'SAFETY') {
      return res.status(200).json({ 
        response: "I can't respond to that request due to safety guidelines. Please try rephrasing.",
        provider: "Gemini 1.5 Flash (Free)"
      });
    }

    // Fallback for unexpected response
    console.log('⚠️ Unexpected response format:', JSON.stringify(data, null, 2));
    return res.status(200).json({ 
      response: "I'm having trouble right now. Please try again.",
      provider: "Gemini 1.5 Flash (Free)"
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message,
      response: "Technical difficulties. Please try again."
    });
  }
};
