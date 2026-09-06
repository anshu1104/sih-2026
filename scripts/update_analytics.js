const fs = require('fs');
const file = 'frontend/src/app/admin/analytics/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add segregationStats map
const mapPos = content.indexOf('const wasteStats = new Map();');
const mapInsert = `const segregationStats = new Map([
    ['Wet Waste', 0],
    ['Dry Waste', 0],
    ['Manual Verification', 0],
    ['Unknown', 0]
  ]);\n  `;
content = content.slice(0, mapPos) + mapInsert + content.slice(mapPos);

// 2. Parse waste_type and segregation
const wasteTypeLogicOld = `    // Waste Type Stats
    const wt = r.waste_type || 'Unknown';
    if (!wasteStats.has(wt)) wasteStats.set(wt, { name: wt, count: 0 });
    wasteStats.get(wt).count++;`;

const wasteTypeLogicNew = `    // Waste Type & Segregation Stats
    const rawWt = r.waste_type || 'Unknown';
    let wt = rawWt;
    let seg = 'Unknown';
    
    if (rawWt.includes('||')) {
      const parts = rawWt.split('||');
      wt = parts[0];
      seg = parts[1];
    } else {
      // Legacy data fallback (simple rule mapping)
      const wtLower = wt.toLowerCase();
      if (['plastic', 'metal', 'glass', 'paper', 'cardboard', 'e-waste'].some(x => wtLower.includes(x))) seg = 'Dry Waste';
      else if (['food', 'vegetable', 'fruit', 'organic'].some(x => wtLower.includes(x))) seg = 'Wet Waste';
    }

    // Waste Type Stats
    if (!wasteStats.has(wt)) wasteStats.set(wt, { name: wt, count: 0 });
    wasteStats.get(wt).count++;

    // Segregation Stats
    if (seg === 'Manual Verification Required' || seg === 'Unknown' || seg.includes('Manual')) {
      segregationStats.set('Manual Verification', segregationStats.get('Manual Verification') + 1);
    } else if (seg === 'Wet Waste') {
      segregationStats.set('Wet Waste', segregationStats.get('Wet Waste') + 1);
    } else if (seg === 'Dry Waste') {
      segregationStats.set('Dry Waste', segregationStats.get('Dry Waste') + 1);
    } else {
      segregationStats.set('Unknown', segregationStats.get('Unknown') + 1);
    }`;
content = content.replace(wasteTypeLogicOld, wasteTypeLogicNew);

// 3. Format segregation chart data
const chartDataPos = content.indexOf('const COLORS = [');
const chartDataInsert = `  const segregationData = Array.from(segregationStats.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);
  const totalSegregated = segregationData.reduce((acc, curr) => acc + curr.value, 0) || 1;
`;
content = content.slice(0, chartDataPos) + chartDataInsert + content.slice(chartDataPos);

// 4. Inject Segregation UI block
const teamPerformaceStr = '{/* Team Performance */}';
const uiInsert = `{/* Waste Segregation Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Waste Segregation Analysis</h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <p className="text-slate-500 text-sm mb-4">Smart Segregation Distribution</p>
            <div className="space-y-4">
              {segregationData.map((item, i) => {
                const percent = ((item.value / totalSegregated) * 100).toFixed(1);
                const color = item.name === 'Wet Waste' ? 'bg-green-500' : item.name === 'Dry Waste' ? 'bg-blue-500' : 'bg-orange-500';
                const text = item.name === 'Wet Waste' ? 'text-green-700' : item.name === 'Dry Waste' ? 'text-blue-700' : 'text-orange-700';
                const bg = item.name === 'Wet Waste' ? 'bg-green-50' : item.name === 'Dry Waste' ? 'bg-blue-50' : 'bg-orange-50';
                
                return (
                  <div key={i} className={\`p-4 rounded-xl border \${bg} border-transparent\`}>
                    <div className="flex justify-between items-end mb-2">
                      <span className={\`font-bold \${text}\`}>{item.name}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-navy block">{percent}%</span>
                        <span className="text-xs text-slate-500">{item.value} reports</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={\`\${color} h-2 rounded-full\`} style={{ width: \`\${percent}%\` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segregationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segregationData.map((entry, index) => (
                    <Cell 
                      key={\`cell-\${index}\`} 
                      fill={entry.name === 'Wet Waste' ? '#22c55e' : entry.name === 'Dry Waste' ? '#3b82f6' : '#f97316'} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Reports']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      `;
content = content.replace(teamPerformaceStr, uiInsert + teamPerformaceStr);

fs.writeFileSync(file, content);
console.log("Updated analytics successfully.");
