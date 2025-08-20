export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // Use the correct Gemini model endpoint
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  async function callGemini(userMessage) {
    try {
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
      
      // Check for API errors
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
      }

      // Safely extract response text
      if (data?.candidates?.[0]?.content?.parts?.?.text) {
        return data.candidates.content.parts.text;
      }
      
      // Handle blocked or filtered content
      if (data?.candidates?.?.finishReason === 'SAFETY') {
        return "I cannot provide a response to that request due to safety guidelines.";
      }
      
      throw new Error("No valid response from Gemini");
      
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini failed: ${error.message}`);
    }
  }

  // Handle the request
  try {
    const userMessage = req.body?.message?.trim();
    
    if (!userMessage) {
      return res.status(400).json({ 
        error: "Message is required",
        response: "Please provide a message to process." 
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "API key not configured",
        response: "The Gemini API key is not properly configured." 
      });
    }

    // Call Gemini API
    const geminiReply = await callGemini(userMessage);
    
    return res.status(200).json({ 
      response: geminiReply, 
      provider: "Gemini",
      success: true
    });

  } catch (error) {
    console.error('Handler error:', error);
    
    return res.status(500).json({ 
      error: error.message,
      response: `Sorry, I encountered an error: ${error.message}`,
      provider: "Error",
      success: false
    });
  }
}
