const fs = require('fs');

const filesToFix = [
  'frontend/src/components/report/CameraCapture.tsx',
  'frontend/src/app/admin/reports/[id]/page.tsx',
  'frontend/src/app/report/page.tsx'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace console.error with console.warn for expected errors
    content = content.replace(/console\.error\("Camera error:", err\);/g, 'console.warn("Camera error:", err.message);');
    content = content.replace(/console\.error\("GPS error:", err\);/g, 'console.warn("GPS error:", err.message);');
    
    if (file.includes('report/page.tsx')) {
       content = content.replace(/console\.error\(err\);/g, 'console.warn(err);');
    }
    
    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  }
}
