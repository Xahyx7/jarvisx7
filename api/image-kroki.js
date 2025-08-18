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
        
        console.log(`✅ Kroki diagram generated`);
        
        res.status(200).json({
            output_url: svgDataUrl,
            provider: 'Kroki.io (PlantUML Diagrams)',
            prompt: message
        });
        
    } catch (error) {
        console.error('❌ Kroki error:', error);
        res.status(500).json({ 
            error: 'Kroki diagram generation failed',
            detail: error.message
        });
    }
};

function textToPlantUML(text) {
    // Enhanced text-to-diagram conversion
    const textLower = text.toLowerCase();
    
    if (textLower.includes('flowchart') || textLower.includes('process') || textLower.includes('workflow')) {
        return `@startuml
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E1F5FE
  BorderColor #0288D1
  FontColor #0277BD
}

start
:${text};
:Step 1: Initialize;
:Step 2: Process;
:Step 3: Complete;
stop
@enduml`;
    } else if (textLower.includes('sequence') || textLower.includes('interaction')) {
        return `@startuml
skinparam backgroundColor #FEFEFE
User -> System: ${text}
activate System
System -> Database: Query
activate Database
Database --> System: Result
deactivate Database
System --> User: Response
deactivate System
@enduml`;
    } else if (textLower.includes('class') || textLower.includes('object')) {
        return `@startuml
skinparam backgroundColor #FEFEFE
class ${text.split(' ')[0]} {
  +property1
  +property2
  +method1()
  +method2()
}
@enduml`;
    } else {
        return `@startuml
skinparam backgroundColor #FEFEFE
note as N1 #E8F5E8
  <b>${text}</b>
  ----
  Generated diagram
  from text description
end note
@enduml`;
    }
}
