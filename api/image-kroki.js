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
        
        // Generate proper PlantUML syntax
        const plantUMLCode = textToPlantUML(message);
        console.log('Generated PlantUML:', plantUMLCode);
        
        // Use correct Kroki API endpoint
        const response = await fetch('https://kroki.io/plantuml/png', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: plantUMLCode
        });
        
        if (!response.ok) {
            throw new Error(`Kroki API error: ${response.status}`);
        }
        
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;
        
        console.log(`✅ Kroki diagram generated`);
        
        res.status(200).json({
            output_url: dataUrl,
            provider: 'Kroki.io (PlantUML)',
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
    const textLower = text.toLowerCase();
    
    if (textLower.includes('flowchart') || textLower.includes('process') || textLower.includes('workflow')) {
        return `@startuml
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E1F5FE
  BorderColor #0288D1
}
start
:${text.substring(0, 100)};
:Step 1: Initialize;
:Step 2: Process;
:Step 3: Complete;
stop
@enduml`;
    } else if (textLower.includes('sequence') || textLower.includes('interaction')) {
        return `@startuml
skinparam backgroundColor #FEFEFE
participant User
participant System
participant Database
User -> System: ${text.substring(0, 50)}
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
class MainClass {
  +property1
  +property2
  +method1()
  +method2()
}
note top : ${text.substring(0, 80)}
@enduml`;
    } else {
        return `@startuml
skinparam backgroundColor #FEFEFE
note as N1 #E8F5E8
  <b>${text.substring(0, 100)}</b>
  ----
  Generated diagram
  from description
end note
@enduml`;
    }
}
