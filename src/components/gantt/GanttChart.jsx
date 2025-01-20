import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { CopyButton } from "../common/CopyButton";
import { DebugSection } from "./DebugSection";
import { Statistics } from "./Statistics";
import { debounce } from "../../utils/debounce";
import { mermaidConfig } from "../../config/mermaidConfig";

export default function GanttChart({ markup }) {
  const chartRef = useRef(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let mounted = true;
    let currentId = chartId.current;

    const renderChart = debounce(async () => {
      if (!mounted) return;

      try {
        // Reset mermaid to clear any previous state
        await mermaid.initialize({
          ...mermaidConfig,
          startOnLoad: false,
        });

        if (mounted && chartRef.current) {
          chartRef.current.innerHTML = "";
          const { svg } = await mermaid.render(chartId.current, markup);

          if (mounted && chartRef.current) {
            chartRef.current.innerHTML = svg;
          }
        }
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
        if (mounted && chartRef.current) {
          chartRef.current.innerHTML = `
            <div class="p-4 bg-red-50 text-red-700 rounded">
              Error rendering Gantt chart: ${error.message}
            </div>
          `;
        }
      }
    }, 300);

    renderChart();

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      // Clean up any pending mermaid renders
      try {
        mermaid.mermaidAPI.reset();
      } catch (e) {
        console.warn("Mermaid reset failed:", e);
      }
    };
  }, [markup]);

  return (
    <div className="w-full space-y-8">
      {/* <Statistics /> */}
      <div
        ref={chartRef}
        className="mermaid-container overflow-x-auto bg-white p-4 rounded-lg border border-gray-200"
      />

      <div className="p-4 bg-gray-50 rounded-lg print:hidden">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-600">
                Mermaid Markup
              </h4>
              <CopyButton text={markup} />
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 overflow-x-auto">
              {markup}
            </pre>
          </div>
        </div>
      </div>
      <DebugSection />
    </div>
  );
}
// import React, { useEffect, useRef } from "react";
// import mermaid from "mermaid";
// import { CopyButton } from "../common/CopyButton";
// import { DebugSection } from "./DebugSection";
// import { Statistics } from "./Statistics";
// import { debounce } from "../../utils/debounce";
// import { mermaidConfig } from "../../config/mermaidConfig";
//
// export default function GanttChart({ markup }) {
//   const chartRef = useRef(null);
//   const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
//
//   useEffect(() => {
//     let mounted = true;
//     let currentId = chartId.current;
//
//     const renderChart = debounce(async () => {
//       if (!mounted) return;
//
//       try {
//         // Reset mermaid to clear any previous state
//         await mermaid.initialize({
//           ...mermaidConfig,
//           startOnLoad: false,
//         });
//
//         if (mounted && chartRef.current) {
//           chartRef.current.innerHTML = "";
//           const { svg } = await mermaid.render(chartId.current, markup);
//
//           if (mounted && chartRef.current) {
//             chartRef.current.innerHTML = svg;
//           }
//         }
//       } catch (error) {
//         console.error("Mermaid rendering failed:", error);
//         if (mounted && chartRef.current) {
//           chartRef.current.innerHTML = `
//             <div class="p-4 bg-red-50 text-red-700 rounded">
//               Error rendering Gantt chart: ${error.message}
//             </div>
//           `;
//         }
//       }
//     }, 300);
//
//     renderChart();
//
//     return () => {
//       mounted = false;
//       if (chartRef.current) {
//         chartRef.current.innerHTML = "";
//       }
//       // Clean up any pending mermaid renders
//       try {
//         mermaid.mermaidAPI.reset();
//       } catch (e) {
//         console.warn("Mermaid reset failed:", e);
//       }
//     };
//   }, [markup]);
//
//   return (
//     <div className="w-full space-y-8">
//       <Statistics />
//       <div
//         ref={chartRef}
//         className="mermaid-container overflow-x-auto bg-white p-4 rounded-lg border border-gray-200"
//       />
//
//       <div className="p-4 bg-gray-50 rounded-lg">
//         <div className="space-y-4">
//           <div>
//             <div className="flex justify-between items-center">
//               <h4 className="text-sm font-medium text-gray-600">
//                 Mermaid Markup
//               </h4>
//               <CopyButton text={markup} />
//             </div>
//             <pre className="mt-2 whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 overflow-x-auto">
//               {markup}
//             </pre>
//           </div>
//         </div>
//       </div>
//       <DebugSection />
//     </div>
//   );
// }
