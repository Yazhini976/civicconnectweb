const fs = require('fs');

const mappings = {
  '/users/mobile': '/dXNlcnMvbW9iaWxl',
  '/users/role': '/dXNlcnMvcm9sZQ',
  '/stations/type': '/c3RhdGlvbnMvdHlwZQ', // Do this before /stations
  '/stations': '/c3RhdGlvbnM',
  '/equipment': '/ZXF1aXBtZW50',
  '/complaints/ward': '/Y29tcGxhaW50cy93YXJk',
  '/complaints/status': '/Y29tcGxhaW50cy9zdGF0dXM',
  '/complaints/stats': '/Y29tcGxhaW50cy9zdGF0cw',
  '/complaints/type-stats': '/Y29tcGxhaW50cy90eXBlLXN0YXRz',
  '/complaints': '/Y29tcGxhaW50cw',
  '/work-orders/staff': '/d29yay1vcmRlcnMvc3RhZmY',
  '/work-orders': '/d29yay1vcmRlcnM',
  '/faults/station': '/ZmF1bHRzL3N0YXRpb24',
  '/faults/pending': '/ZmF1bHRzL3BlbmRpbmc',
  '/dashboard/station-counts': '/ZGFzaGJvYXJkL3N0YXRpb24tY291bnRz',
  '/dashboard/officer-stats': '/ZGFzaGJvYXJkL29mZmljZXItc3RhdHM',
  '/logs/lifting': '/bG9ncy9saWZ0aW5n',
  '/logs/pumping': '/bG9ncy9wdW1waW5n',
  '/logs/stp': '/bG9ncy9zdHA',
  '/energy/trend': '/ZW5lcmd5L3RyZW5k',
  '/sla/trend': '/c2xhL3RyZW5k',
  '/login': '/bG9naW4',
  '/assign-officer': '/YXNzaWduLW9mZmljZXI',
  '/officers': '/b2ZmaWNlcnM',
  '/garbage/trucks': '/Z2FyYmFnZS90cnVja3M',
  '/garbage/routes': '/Z2FyYmFnZS9yb3V0ZXM',
  '/garbage/deviations': '/Z2FyYmFnZS9kZXZpYXRpb25z',
  '/garbage/stats': '/Z2FyYmFnZS9zdGF0cw',
  '/garbage/simulate': '/Z2FyYmFnZS9zaW11bGF0ZQ',
  '/ws/garbage': '/ws/Z2FyYmFnZQ'
};

const mainGoPath = '../backend/cmd/server/main.go';
const apiTsPath = '../frontend/src/services/api.ts';
const loginTsxPath = '../frontend/src/pages/Login.tsx';

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${filePath}, does not exist`);
      return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [plain, obfuscated] of Object.entries(mappings)) {
    // In Go, it looks like "/api/complaints" or "/api/complaints/ward"
    // In TS, it looks like `${API_BASE_URL}/complaints` or similar
    
    // For exact match replacements to avoid partial matching:
    content = content.replaceAll(`"${plain}"`, `"${obfuscated}"`);
    content = content.replaceAll(`"${plain}?`, `"${obfuscated}?`);
    content = content.replaceAll(`"${plain}/`, `"${obfuscated}/`); // for parameter routes
    
    // for string literals in TS
    content = content.replaceAll(`'${plain}'`, `'${obfuscated}'`);
    content = content.replaceAll(`'${plain}?`, `'${obfuscated}?`);
    
    // for template literals in TS
    content = content.replaceAll(`}${plain}"`, `}${obfuscated}"`);
    content = content.replaceAll(`}${plain}\``, `}${obfuscated}\``);
    content = content.replaceAll(`}${plain}?`, `}${obfuscated}?`);
    content = content.replaceAll(`}${plain}/`, `}${obfuscated}/`);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

replaceInFile(mainGoPath);
replaceInFile(apiTsPath);
replaceInFile(loginTsxPath);
