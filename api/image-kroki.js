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
        console.log('Generated PlantUML:', plantUMLCode.substring(0, 100) + '...');
        
        // Use Kroki API with proper base64 encoding
        const encodedDiagram = Buffer.from(plantUMLCode).toString('base64');
        const krokyUrl = `https://kroki.io/plantuml/png/${encodedDiagram}`;
        
        // Test the Kroki endpoint
        const response = await fetch(krokyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'image/png'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Kroki API error: ${response.status} ${response.statusText}`);
        }
        
        // Convert to base64 data URL for embedding
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;
        
        console.log(`✅ Kroki diagram generated successfully`);
        
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
!theme plain
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E1F5FE
  BorderColor #0288D1
  FontColor #01579B
}
title ${text.substring(0, 50)}
start
:Initialize Process;
:Execute Main Logic;
:Validate Results;
:Complete Task;
stop
@enduml`;
    } 
    
    else if (textLower.includes('sequence') || textLower.includes('interaction')) {
        return `@startuml
!theme plain
skinparam backgroundColor #FEFEFE
title ${text.substring(0, 50)}
participant User
participant System
participant Database
User -> System: Request
activate System
System -> Database: Query Data
activate Database
Database --> System: Return Data
deactivate Database
System --> User: Response
deactivate System
@enduml`;
    } 
    
    else if (textLower.includes('class') || textLower.includes('object') || textLower.includes('uml')) {
        return `@startuml
!theme plain
skinparam backgroundColor #FEFEFE
title ${text.substring(0, 50)}
class MainClass {
  +property1: String
  +property2: Integer
  +method1(): void
  +method2(): Boolean
}
class SubClass {
  +subProperty: String
  +subMethod(): void
}
MainClass --> SubClass
@enduml`;
    } 
    
    else {
        return `@startuml
!theme plain
skinparam backgroundColor #FEFEFE
note as N1 #E8F5E8
  <b>Generated Diagram</b>
  ----
  ${text.substring(0, 100)}
  ----
  <i>Created with JARVIS AI</i>
end note
@enduml`;
    }
}
