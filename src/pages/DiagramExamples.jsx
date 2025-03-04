import React, { useState } from "react";
import MermaidDiagram from "../components/common/MermaidDiagram";

export default function DiagramExamples() {
  const [selectedDiagram, setSelectedDiagram] = useState("flowchart");
  
  // Example diagram codes
  const diagrams = {
    flowchart: `
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
`,
    sequence: `
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
`,
    classDiagram: `
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
`,
    stateDiagram: `
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
`,
    entityRelationship: `
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
`,
    userJourney: `
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
`
  };
  
  // Editable code state
  const [editableCode, setEditableCode] = useState(diagrams[selectedDiagram]);
  
  // Handle diagram type change
  const handleDiagramChange = (type) => {
    setSelectedDiagram(type);
    setEditableCode(diagrams[type]);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Mermaid Diagram Examples</h1>
      
      {/* Diagram type selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Diagram Type
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(diagrams).map((type) => (
            <button
              key={type}
              onClick={() => handleDiagramChange(type)}
              className={`px-4 py-2 rounded text-sm ${
                selectedDiagram === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code editor */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Edit Diagram Code</h2>
          <textarea
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            className="w-full h-80 p-4 font-mono text-sm border border-gray-300 rounded-md"
            spellCheck="false"
          />
        </div>
        
        {/* Diagram preview */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Diagram Preview</h2>
          <div className="border border-gray-300 rounded-md p-4 bg-white min-h-80">
            <MermaidDiagram code={editableCode} />
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">How to Use the MermaidDiagram Component</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <pre className="text-sm overflow-x-auto">
{`import MermaidDiagram from "../components/common/MermaidDiagram";

// In your component:
const diagramCode = \`
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
\`;

return (
  <MermaidDiagram 
    code={diagramCode} 
    className="bg-white p-4 rounded-lg shadow" 
  />
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
