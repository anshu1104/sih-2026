const fs = require('fs');
const file = 'frontend/src/app/reports/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const proofCode = `
            {/* Resolution Proof */}
            {isResolved && report.report_media?.find((m: any) => m.media_type === 'after') && (
              (() => {
                const proofMedia = report.report_media.find((m: any) => m.media_type === 'after');
                const history = report.report_status_history?.find((h: any) => h.status === 'resolved' && h.note);
                let proofMeta = null;
                try {
                  if (history && history.note) proofMeta = JSON.parse(history.note);
                } catch(e) {}
                
                return (
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm overflow-hidden mb-6">
                    <div className="p-4 bg-emerald-100/50 border-b border-emerald-200 flex justify-between items-center">
                      <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        Resolution Proof
                      </h2>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-200/50 px-2 py-1 rounded">CLEANED</span>
                    </div>
                    
                    <div className="aspect-video bg-slate-900 relative">
                      <img src={proofMedia.storage_path} alt="Resolution Proof" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Handled By</p>
                          <p className="font-bold text-navy text-sm">{proofMeta?.team || report.assigned_team || 'Municipal Team'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Resolution Date</p>
                          <p className="font-bold text-navy text-sm">{new Date(proofMedia.created_at).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 font-medium mb-1">Proof Location</p>
                          <p className="font-mono text-xs text-navy bg-white border border-emerald-100 p-2 rounded">
                            {proofMeta?.latitude && proofMeta?.longitude 
                              ? \`\${proofMeta.latitude}, \${proofMeta.longitude}\` 
                              : 'Verified via GPS'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
`;

content = content.replace(
  '{/* Timeline */}',
  proofCode + '\n            {/* Timeline */}'
);

// We should also replace `report.report_media[0]` logic in original Image to make sure it filters for 'original'
content = content.replace(
  'report.report_media && report.report_media[0]',
  "report.report_media && report.report_media.find((m: any) => m.media_type === 'original')"
);

content = content.replace(
  'report.report_media[0].storage_path',
  "report.report_media.find((m: any) => m.media_type === 'original')?.storage_path"
);

fs.writeFileSync(file, content);
console.log("Updated Citizen Report Detail successfully.");
