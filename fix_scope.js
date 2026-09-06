const fs = require('fs');
const file = 'frontend/src/app/report/result/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const badBlock = `  if (!imageUrl) {
    
  const primaryDetection = detections.length > 0 
    ? detections.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current) 
    : null;
    
  const aiSegregation = primaryDetection ? getSegregation(primaryDetection.class_name) : 'Unknown';
  const needsManual = aiSegregation === 'Unknown' || (primaryDetection && primaryDetection.confidence < 0.4);
  
  const finalSegregation = segregationOverride || (needsManual ? 'Manual Verification Required' : aiSegregation);
  const verificationStatus = segregationOverride ? 'User Verified' : 'AI Recommendation';

  return (`

const fixedBlock = `
  const primaryDetection = detections.length > 0 
    ? detections.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current) 
    : null;
    
  const aiSegregation = primaryDetection ? getSegregation(primaryDetection.class_name) : 'Unknown';
  const needsManual = aiSegregation === 'Unknown' || (primaryDetection && primaryDetection.confidence < 0.4);
  
  const finalSegregation = segregationOverride || (needsManual ? 'Manual Verification Required' : aiSegregation);
  const verificationStatus = segregationOverride ? 'User Verified' : 'AI Recommendation';

  if (!imageUrl) {
  return (`

content = content.replace(badBlock, fixedBlock);

fs.writeFileSync(file, content);
