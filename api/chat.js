import fetch from 'node-fetch'; // If using Node 18+, you may not need to import fetch.

export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROK_API_KEY = process.env.GROK_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const GROK_API_URL = "https://api.grok.com/v1/chat"; // Replace with real Grok endpoint

  async function callGemini(userMessage) {
    const gRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });
    const data = await gRes.json();
    if (data?.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts.text;
    }
    throw new Error(data.error?.message || "Gemini failed");
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
    const userMessage = req.body.message || "";
    const geminiReply = await callGemini(userMessage);
    return res.status(200).json({ response: geminiReply, provider: "Gemini" });
  } catch (err) {
    try {
      const grokReply = await callGrok(req.body.message || "");
      return res.status(200).json({ response: grokReply, provider: "Grok" });
    } catch (err2) {
      return res.status(500).json({ error: "Both Gemini and Grok failed.", details: [err.message, err2.message] });
    }
  }
}
