const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const API_FILE = path.join(__dirname, '../mobile/src/services/api.js');
let currentTunnel = null;
let isRestarting = false;

async function startTunnel() {
  if (isRestarting) return;
  console.log('Starting localtunnel...');
  try {
    currentTunnel = await localtunnel({ port: 8000 });
    console.log('Tunnel started at: ' + currentTunnel.url);

    if (fs.existsSync(API_FILE)) {
      let content = fs.readFileSync(API_FILE, 'utf8');
      content = content.replace(/export const API_URL = '.*?';/, 'export const API_URL = \'' + currentTunnel.url + '/api/v1\';');
      
      // Ensure headers are back to bypass localtunnel reminder
      if (!content.includes('Bypass-Tunnel-Reminder')) {
        content = content.replace(
          /headers: \{/,
          "headers: {\n    'Bypass-Tunnel-Reminder': 'true',\n    'bypass-tunnel-reminder': 'true',"
        );
      }
      
      fs.writeFileSync(API_FILE, content);
      console.log('Updated api.js successfully!');
    }

    currentTunnel.on('close', () => {
      console.log('Tunnel closed naturally.');
      restartTunnel();
    });
    
    currentTunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      restartTunnel();
    });
    
  } catch(err) {
    console.error('Error starting tunnel:', err);
    restartTunnel();
  }
}

function restartTunnel() {
  if (isRestarting) return;
  isRestarting = true;
  if (currentTunnel) {
    try { currentTunnel.close(); } catch(e){}
  }
  console.log('Restarting in 2 seconds...');
  setTimeout(() => {
    isRestarting = false;
    startTunnel();
  }, 2000);
}

startTunnel();
