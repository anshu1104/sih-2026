const fs = require('fs');
const file = 'frontend/src/lib/services/reportService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldSignature = `  async createReport(
    userId: string, // Kept for backwards compatibility but we'll fetch from auth
    location: ReportLocation, 
    imageFile: File, 
    detections: any[], 
    priority: string = 'normal',
    description: string = ''
  ) {`;

const newSignature = `  async createReport(
    userId: string, // Kept for backwards compatibility but we'll fetch from auth
    location: ReportLocation, 
    imageFile: File, 
    detections: any[], 
    priority: string = 'normal',
    description: string = '',
    segregation: string = '',
    verification: string = ''
  ) {`;

content = content.replace(oldSignature, newSignature);

const oldWasteLogic = `      // Calculate highest confidence waste type
      const wasteType = detections.length > 0 
        ? detections.sort((a, b) => b.confidence - a.confidence)[0].class_name 
        : 'Unknown';`;

const newWasteLogic = `      // Calculate highest confidence waste type
      let wasteType = detections.length > 0 
        ? detections.sort((a, b) => b.confidence - a.confidence)[0].class_name 
        : 'Unknown';
        
      if (segregation && verification) {
        wasteType = \`\${wasteType}||\${segregation}||\${verification}\`;
      }`;

content = content.replace(oldWasteLogic, newWasteLogic);

fs.writeFileSync(file, content);
console.log("Updated reportService.ts");
