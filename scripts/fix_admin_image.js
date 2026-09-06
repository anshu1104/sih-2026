const fs = require('fs');
const file = 'frontend/src/app/admin/reports/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'report.report_media?.[0]?.storage_path',
  "report.report_media?.find((m: any) => m.media_type === 'original')?.storage_path"
);

content = content.replace(
  'report.report_media[0].storage_path',
  "report.report_media.find((m: any) => m.media_type === 'original')?.storage_path"
);

fs.writeFileSync(file, content);
