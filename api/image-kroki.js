module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        
        console.log('📊 Kroki request:', message);
        
        // Create simple PlantUML diagram
        const plantUML = `@startuml
title ${message.substring(0, 30)}
note as N1 #lightblue
  ${message}
end note
@enduml`;

        console.log('📝 PlantUML:', plantUML);
        
        // CORRECT KROKI API FORMAT (from official docs)
        const response = await fetch('https://kroki.io/plantuml/svg', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Accept': 'image/svg+xml'
            },
            body: plantUML
        });
        
        if (!response.ok) {
            console.error(`Kroki API error: ${response.status} ${response.statusText}`);
            throw new Error(`Kroki API error: ${response.status}`);
        }
        
        const svgContent = await response.text();
        console.log('✅ SVG received, length:', svgContent.length);
        
        // Return SVG as data URL
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
        
        res.status(200).json({
            output_url: dataUrl,
            provider: "Kroki.io",
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Kroki error:', error);
        res.status(500).json({ 
            error: 'Kroki failed',
            detail: error.message
        });
    }
};
