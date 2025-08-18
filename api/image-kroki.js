module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        // Provide VERY simple PlantUML syntax
        const diagram = `@startuml
title Diagram
note as N1
${message}
end note
@enduml`;
        const diagramRes = await fetch('https://kroki.io/plantuml/svg', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: diagram
        });
        if (!diagramRes.ok) throw new Error('Kroki diagram error');
        const svg = await diagramRes.text();
        // Inline SVG for browser rendering
        res.status(200).json({
            output_url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
            provider: 'Kroki.io svg',
            prompt: message
        });
    } catch (error) {
        res.status(500).json({ error: 'Kroki diagram generation failed', detail: error.message });
    }
};
