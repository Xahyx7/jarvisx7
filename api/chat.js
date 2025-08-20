// /api/chat.js (for Vercel serverless, main = Gemini, fallback = Grok)

// If using Node 18+, fetch is built-in. Otherwise, uncomment the next line:
// import fetch from 'node-fetch';

export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROK_API_KEY = process.env.GROK_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const GROK_API_URL = "https://api.grok.com/v1/chat"; // Replace with actual endpoint

  async function callGemini(userMessage) {
    const gRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });
    const data = await gRes.json();

    // --- SAFE PARSING: Only return if structure matches Google Gemini format:
    if (
      data &&
      Array.isArray(data.candidates) && data.candidates.length > 0 &&
      data.candidates[0].content &&
      Array.isArray(data.candidates.content.parts) &&
      data.candidates.content.parts.length > 0 &&
      typeof data.candidates.content.parts.text === 'string'
    ) {
      return data.candidates.content.parts.text;
    }

    // If error, throw readable message
    if (data?.error) {
      throw new Error(data.error.message || "Gemini error");
    }

    throw new Error("Gemini did not return content text");
  }

  async function callGrok(userMessage) {
    const gRes = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({ prompt: userMessage })
    });
    const data = await gRes.json();
    return data.text || (data.choices?.[0]?.text) || "Grok returned no response";
  }

  try {
    const userMessage = req.body?.message || "";
    const geminiReply = await callGemini(userMessage);
    return res.status(200).json({ response: geminiReply, provider: "Gemini" });
  } catch (err) {
    try {
      const grokReply = await callGrok(req.body?.message || "");
      return res.status(200).json({ response: grokReply, provider: "Grok" });
    } catch (err2) {
      return res.status(500).json({ error: "Both Gemini and Grok failed.", details: [err.message, err2.message] });
    }
  }
}
