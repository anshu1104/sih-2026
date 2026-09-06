const fs = require('fs');
const file = 'frontend/src/app/report/result/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add segregation logic variables
const stateInsert = `
  const [segregationOverride, setSegregationOverride] = useState<string | null>(null);
  
  const dryCategories = ['plastic', 'metal', 'glass', 'paper', 'cardboard', 'e-waste', 'rubber', 'fabric', 'can', 'bottle'];
  const wetCategories = ['food', 'vegetable', 'fruit', 'organic', 'garden', 'plant', 'leaves'];

  const getSegregation = (category: string) => {
    const c = category.toLowerCase();
    if (dryCategories.some(d => c.includes(d))) return 'Dry Waste';
    if (wetCategories.some(w => c.includes(w))) return 'Wet Waste';
    return 'Unknown';
  };
`;

const stateHookPos = content.indexOf('useEffect(() => {');
content = content.slice(0, stateHookPos) + stateInsert + content.slice(stateHookPos);

// 2. Add Smart Segregation calculations inside component
const renderStartPos = content.indexOf('return (');
const segLogic = `
  const primaryDetection = detections.length > 0 
    ? detections.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current) 
    : null;
    
  const aiSegregation = primaryDetection ? getSegregation(primaryDetection.class_name) : 'Unknown';
  const needsManual = aiSegregation === 'Unknown' || (primaryDetection && primaryDetection.confidence < 0.4);
  
  const finalSegregation = segregationOverride || (needsManual ? 'Manual Verification Required' : aiSegregation);
  const verificationStatus = segregationOverride ? 'User Verified' : 'AI Recommendation';
`;
content = content.slice(0, renderStartPos) + segLogic + '\n  ' + content.slice(renderStartPos);

// 3. Update Submission Call
content = content.replace(
  'description || "Citizen report via AI detection"',
  'description || "Citizen report via AI detection", finalSegregation, verificationStatus'
);

// 4. Inject Smart Segregation Card
const oldDetectionSummary = `{/* Detection Summary */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-navy border-b pb-2">Detection Summary</h3>
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Objects Detected</p>
                <p className="text-2xl font-bold text-navy">{stats?.object_count || 0}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Overall Confidence</p>
                <p className={\`text-xl font-bold flex items-center gap-2 \${
                  stats?.overall_confidence === 'High' ? 'text-primary' : 
                  stats?.overall_confidence === 'Medium' ? 'text-orange-500' : 'text-red-500'
                }\`}>
                  {stats?.overall_confidence || 'Unknown'} 
                  {stats?.overall_confidence === 'High' && <CheckCircle2 size={18} />}
                </p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                  <MapPin size={14} /> Location
                </p>
                {location?.type === "gps" ? (
                  <div className="font-mono text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    <p>Lat: {location.latitude?.toFixed(4)}</p>
                    <p>Lng: {location.longitude?.toFixed(4)}</p>
                  </div>
                ) : (
                  <p className="font-medium text-navy text-sm">{location?.address || "Location not set"}</p>
                )}
              </div>
            </div>`;

const smartSegregationUI = `
            {/* Smart Segregation Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  🧠 AI Waste Analysis
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Detected</p>
                  <p className="text-lg font-bold text-navy capitalize">{primaryDetection?.class_name || 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Confidence</p>
                  <p className="text-lg font-bold text-primary">{primaryDetection ? Math.round(primaryDetection.confidence * 100) : 0}%</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Smart Segregation</p>
                
                {needsManual && !segregationOverride ? (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                      <AlertTriangle size={18} /> Manual Verification Required
                    </div>
                    <p className="text-xs text-orange-600 mb-4">
                      The detected material could not be confidently assigned to wet or dry waste. Please verify before disposal.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSegregationOverride('Wet Waste')}
                        className="flex-1 bg-white border border-green-200 text-green-700 hover:bg-green-50 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        🟩 Wet Waste
                      </button>
                      <button 
                        onClick={() => setSegregationOverride('Dry Waste')}
                        className="flex-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        🟦 Dry Waste
                      </button>
                    </div>
                    <button 
                        onClick={() => setSegregationOverride('Unknown')}
                        className="w-full mt-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Not Sure
                    </button>
                  </div>
                ) : (
                  <div className={\`p-4 rounded-xl flex flex-col gap-2 border \${finalSegregation === 'Wet Waste' ? 'bg-green-50 border-green-200' : finalSegregation === 'Dry Waste' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}\`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{finalSegregation === 'Wet Waste' ? '🟩' : finalSegregation === 'Dry Waste' ? '🟦' : '⬜'}</span>
                      <span className={\`text-xl font-extrabold \${finalSegregation === 'Wet Waste' ? 'text-green-800' : finalSegregation === 'Dry Waste' ? 'text-blue-800' : 'text-slate-700'}\`}>
                        {finalSegregation.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mt-2 bg-white/60 p-2 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Recommended Bin</p>
                      <p className={\`font-bold flex items-center gap-1.5 \${finalSegregation === 'Wet Waste' ? 'text-green-700' : finalSegregation === 'Dry Waste' ? 'text-blue-700' : 'text-slate-600'}\`}>
                        {finalSegregation === 'Wet Waste' ? '🟢 Wet Waste Bin' : finalSegregation === 'Dry Waste' ? '🔵 Dry Waste Bin' : '⚪ General Bin'}
                      </p>
                    </div>
                    
                    <p className="text-xs font-medium mt-1 flex items-center gap-1.5 opacity-80">
                      {finalSegregation === 'Wet Waste' ? '♻️ Suitable for composting' : finalSegregation === 'Dry Waste' ? '♻️ Suitable for dry/recycle' : ''}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <details className="text-xs text-slate-500 group">
                  <summary className="cursor-pointer hover:text-primary font-medium list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▶</span> How Smart Segregation Works
                  </summary>
                  <div className="mt-2 pl-4 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p>1. 📷 Image is captured/uploaded.</p>
                    <p>2. 🤖 YOLO identifies the waste category.</p>
                    <p>3. 🧠 The system maps the detected category to a wet/dry waste stream.</p>
                    <p>4. 🗑️ The website recommends the appropriate bin.</p>
                    <p className="mt-2 font-medium italic">"The current AI model detects waste categories. Wet/Dry segregation is currently provided through a rule-based recommendation layer."</p>
                  </div>
                </details>
                <p className="text-[10px] text-slate-400 mt-3 italic text-center">Segregation recommendation is generated from the detected waste category.</p>
              </div>
            </div>
`;

content = content.replace(oldDetectionSummary, smartSegregationUI);

fs.writeFileSync(file, content);
console.log("Updated Citizen AI Result successfully.");
