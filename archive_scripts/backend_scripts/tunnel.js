const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 8000 });
    fs.writeFileSync('lt.out', tunnel.url);
    console.log('Tunnel started:', tunnel.url);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (error) {
    fs.writeFileSync('lt.out', 'Error: ' + error.message);
  }
})();
