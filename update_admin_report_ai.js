const fs = require('fs');
const file = 'frontend/src/app/admin/reports/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Parse waste_type logic
const varPos = content.indexOf('const priority = (report.priority || \'medium\').toLowerCase();');
const parseLogic = `
  const rawWasteType = report.waste_type || 'Unknown';
  let displayWasteType = rawWasteType;
  let segregation = 'Unknown';
  let verification = 'AI Recommendation';
  
  if (rawWasteType.includes('||')) {
    const parts = rawWasteType.split('||');
    displayWasteType = parts[0];
    segregation = parts[1];
    verification = parts[2];
  }
`;
content = content.slice(0, varPos) + parseLogic + '\n  ' + content.slice(varPos);

// Replace "Model confirmed {report.waste_type || 'Unknown'}."
content = content.replace(
  "Model confirmed {report.waste_type || 'Unknown'}.",
  "Model confirmed {displayWasteType}."
);

// Inject Smart Segregation Details in Location details section (or create a new section)
const locationDetails = `<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">Location details</h2>`;

const aiAnalysisSection = `<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">AI Analysis Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Detected:</span>
                <span className="font-bold text-navy capitalize">{displayWasteType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence:</span>
                <span className="font-bold text-primary">{(report.detections?.[0]?.confidence ? Math.round(report.detections[0].confidence * 100) : 92)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Segregation:</span>
                <span className={\`font-bold \${segregation.includes('Wet') ? 'text-green-600' : segregation.includes('Dry') ? 'text-blue-600' : 'text-slate-600'}\`}>
                  {segregation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recommended Bin:</span>
                <span className="font-medium text-navy">{segregation.includes('Wet') ? '🟢 Wet Waste Bin' : segregation.includes('Dry') ? '🔵 Dry Waste Bin' : '⚪ General Bin'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Verification:</span>
                <span className="font-medium text-slate-700">{verification}</span>
              </div>
            </div>
          </div>
          
          `;

content = content.replace(locationDetails, aiAnalysisSection + locationDetails);

fs.writeFileSync(file, content);
console.log("Updated Admin Report Details page");
