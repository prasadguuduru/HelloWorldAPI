const http = require('http');
const https = require('https');

const LAMBDA_ENDPOINT = 'https://h7d40w93ze.execute-api.us-east-1.amazonaws.com/dev/mcp';
const LOCAL_PORT = 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const proxyReq = https.request(LAMBDA_ENDPOINT, options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Proxy error');
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

server.listen(LOCAL_PORT, () => {
  console.log(`MCP Proxy server running on http://localhost:${LOCAL_PORT}`);
  console.log(`Forwarding to: ${LAMBDA_ENDPOINT}`);
});