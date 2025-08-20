export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // Validate API key
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "Get your free API key at https://aistudio.google.com",
      response: "Please set your free Gemini API key in environment variables.",
      provider: "System"
    });
  }

  // Validate message
  const userMessage = req.body?.message?.trim();
  if (!userMessage) {
    return res.status(400).json({ 
      error: "Message required",
      response: "Please provide a message to process.",
      provider: "System"
    });
  }

  try {
    // Call Gemini 1.5 Flash (completely free)
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: userMessage }] 
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle API errors
    if (data.error) {
      return res.status(500).json({ 
        error: `Gemini error: ${data.error.message}`,
        response: "I'm having technical difficulties. Please try again.",
        provider: "Gemini 1.5 Flash (Free)"
      });
    }

    // Extract response safely
    if (data?.candidates?.[0]?.content?.parts?.?.text) {
      return res.status(200).json({ 
        response: data.candidates.content.parts.text, 
        provider: "Gemini 1.5 Flash (Free)",
        success: true
      });
    }

    // Handle safety blocks
    if (data?.candidates?.?.finishReason === 'SAFETY') {
      return res.status(200).json({ 
        response: "I cannot provide a response to that request due to safety guidelines. Please try rephrasing.",
        provider: "Gemini 1.5 Flash (Free)",
        success: true
      });
    }

    // Fallback
    return res.status(200).json({ 
      response: "I'm having trouble generating a response right now. Please try again.",
      provider: "Gemini 1.5 Flash (Free)",
      success: true
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      response: "I'm experiencing technical difficulties. Please try again later.",
      provider: "System"
    });
  }
}
