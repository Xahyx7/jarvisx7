module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`📊 Kroki diagram request: ${message}`);

        // Convert text to PlantUML syntax
        const plantUMLCode = textToPlantUML(message);
        
        const response = await fetch('https://kroki.io/plantuml/svg', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: plantUMLCode
        });

        if (!response.ok) {
            throw new Error(`Kroki API error: ${response.status}`);
        }

        const svgContent = await response.text();
        const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
        
        res.status(200).json({
            output_url: svgDataUrl,
            provider: 'Kroki.io (PlantUML Diagrams)',
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Kroki error:', error);
        res.status(500).json({ error: error.message });
    }
};

function textToPlantUML(text) {
    // Simple conversion - can be enhanced
    if (text.toLowerCase().includes('flowchart') || text.toLowerCase().includes('process')) {
        return `@startuml
start
:${text};
:Process Step 1;
:Process Step 2;
:Result;
stop
@enduml`;
    } else if (text.toLowerCase().includes('sequence')) {
        return `@startuml
Alice -> Bob: ${text}
Bob -> Alice: Response
@enduml`;
    } else {
        return `@startuml
note as N1
  ${text}
end note
@enduml`;
    }
}
