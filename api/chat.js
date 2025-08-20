export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROK_API_KEY = process.env.GROK_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  async function callGemini(userMessage) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        })
      });

      const data = await response.json();
      
      // Check if API returned an error
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      // Safely check response structure
      if (data?.candidates?.[0]?.content?.parts?.?.text) {
        return data.candidates.content.parts.text;
      }
      
      throw new Error("Invalid Gemini response structure");
      
    } catch (error) {
      throw new Error(`Gemini failed: ${error.message}`);
    }
  }

  async function callGrok(userMessage) {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          model: "grok-beta"
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Grok API error: ${data.error.message}`);
      }

      if (data?.choices?.?.message?.content) {
        return data.choices.message.content;
      }
      
      throw new Error("Invalid Grok response structure");
      
    } catch (error) {
      throw new Error(`Grok failed: ${error.message}`);
    }
  }

  try {
    const userMessage = req.body?.message || "";
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Try Gemini first
    const geminiReply = await callGemini(userMessage);
    return res.status(200).json({ 
      response: geminiReply, 
      provider: "Gemini" 
    });

  } catch (geminiError) {
    console.warn("Gemini failed, trying Grok:", geminiError.message);
    
    try {
      // Fallback to Grok
      const grokReply = await callGrok(req.body?.message || "");
      return res.status(200).json({ 
        response: grokReply, 
        provider: "Grok" 
      });

    } catch (grokError) {
      console.error("Both APIs failed:", { geminiError, grokError });
      return res.status(500).json({ 
        error: "Both Gemini and Grok failed", 
        details: [geminiError.message, grokError.message] 
      });
    }
  }
}
