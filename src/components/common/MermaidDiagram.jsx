import React from "react";
import mermaid from "mermaid";
import { mermaidConfig } from "../../config/mermaidConfig";

/**
 * A reusable component for rendering any type of Mermaid diagram
 * 
 * @param {Object} props - Component props
 * @param {string} props.code - The Mermaid diagram code to render
 * @param {string} props.className - Additional CSS classes to apply to the container
 * @returns {JSX.Element} - The rendered component
 */
class MermaidDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    
    // Initialize mermaid with our configuration
    mermaid.initialize({
      ...mermaidConfig,
      startOnLoad: false,
      securityLevel: 'loose'
    });
  }
  
  componentDidMount() {
    this.renderDiagram();
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.code !== this.props.code) {
      this.renderDiagram();
    }
  }
  
  renderDiagram() {
    if (!this.containerRef.current) return;
    
    try {
      // Clear any previous content
      this.containerRef.current.innerHTML = '';
      
      // Create a new div for the diagram
      const diagramDiv = document.createElement('div');
      diagramDiv.className = 'mermaid';
      diagramDiv.textContent = this.props.code;
      this.containerRef.current.appendChild(diagramDiv);
      
      // Process the diagram
      mermaid.init(undefined, diagramDiv);
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      
      // Display error message
      this.containerRef.current.innerHTML = `
        <div class="p-4 bg-red-50 text-red-700 rounded">
          <p class="font-bold">Error rendering diagram:</p>
          <p>${error.message || 'Unknown error'}</p>
        </div>
      `;
    }
  }
  
  render() {
    const { className } = this.props;
    
    return (
      <div 
        ref={this.containerRef}
        className={`overflow-x-auto bg-white p-4 rounded-lg border border-gray-200 min-h-[200px] ${className || ''}`}
      />
    );
  }
}

export default MermaidDiagram;
