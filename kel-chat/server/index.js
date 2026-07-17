const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3456;
const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Messages store
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
let messages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try { messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); } catch(e) { messages = []; }
}

function saveMessages() {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

// Simple MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// HTTP server
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API routes
  if (url.pathname === '/api/messages' && req.method === 'GET') {
    // Get messages, optionally since a timestamp or before a timestamp
    const since = url.searchParams.get('since');
    const before = url.searchParams.get('before');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    let result = messages;
    let hasMore = false;
    if (since) {
      const sinceTs = parseInt(since);
      result = messages.filter(m => m.ts > sinceTs);
    } else if (before) {
      const beforeTs = parseInt(before);
      result = messages.filter(m => m.ts < beforeTs);
      hasMore = result.length > limit;
      result = result.slice(-limit); // 取最近的N条
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: result, hasMore }));
    return;
  }

  if (url.pathname === '/api/send' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        msg.ts = Date.now();
        msg.id = msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        messages.push(msg);
        saveMessages();
        // Broadcast via WebSocket
        broadcast({ type: 'new_message', message: msg });
        // 触发自动回复
        if (msg.role === 'user') watcherOnMessage(msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: msg }));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, online: true, ts: Date.now() }));
    return;
  }

  // Work log endpoint - Claude Code pushes progress here
  if (url.pathname === '/api/worklog' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const msg = {
          role: 'assistant',
          type: 'worklog',
          text: data.text || '',
          code: data.code || null,
          language: data.language || null,
          action: data.action || 'update', // update|code|file|command|thinking
          ts: Date.now(),
          id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        };
        messages.push(msg);
        saveMessages();
        broadcast({ type: 'new_message', message: msg });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id: msg.id }));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // File upload endpoint
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    const boundary = (req.headers['content-type'] || '').split('boundary=')[1];
    if (!boundary) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No boundary' }));
      return;
    }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      // Simple multipart parser
      const boundaryBuf = Buffer.from('--' + boundary);
      const parts = [];
      let start = buf.indexOf(boundaryBuf) + boundaryBuf.length + 2; // skip first boundary + CRLF
      while (true) {
        const end = buf.indexOf(boundaryBuf, start);
        if (end === -1) break;
        parts.push(buf.slice(start, end - 2)); // -2 for CRLF before boundary
        start = end + boundaryBuf.length + 2;
      }
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headers = part.slice(0, headerEnd).toString();
        const fileData = part.slice(headerEnd + 4);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (!filenameMatch) continue;
        const origName = filenameMatch[1];
        const safeName = `${Date.now()}_${origName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const savePath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(savePath, fileData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, url: `/uploads/${safeName}`, name: origName, size: fileData.length }));
        return;
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No file found' }));
    });
    return;
  }

  // Serve uploaded files
  if (url.pathname.startsWith('/uploads/')) {
    const fileName = url.pathname.slice('/uploads/'.length);
    const uploadPath = path.join(UPLOADS_DIR, fileName);
    if (!uploadPath.startsWith(UPLOADS_DIR)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.readFile(uploadPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      const ext = path.extname(uploadPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }

  // Serve static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// WebSocket server
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
  // Send recent messages on connect
  ws.send(JSON.stringify({ type: 'history', messages: messages.slice(-50) }));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

// Make broadcast available for external use (e.g., when Kel replies)
server.broadcast = broadcast;
server.addMessage = (msg) => {
  msg.ts = msg.ts || Date.now();
  msg.id = msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  messages.push(msg);
  saveMessages();
  broadcast({ type: 'new_message', message: msg });
  return msg;
};

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Kel Chat Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  // Show LAN address
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  LAN:     http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(`\n  手机连同一个WiFi后打开上面的LAN地址就能聊天`);
  console.log(`  自动回复已启用 — 收到消息会调用 Claude Code\n`);
});

// ─── Auto-reply Watcher (内置) ───
const { spawn } = require('child_process');

let watcherProcessing = false;

function watcherOnMessage(msg) {
  const text = msg.text || msg.content || '';
  if (!text.trim()) return;
  if (watcherProcessing) {
    console.log('[watcher] 忙碌中，跳过:', text.substring(0, 40));
    return;
  }

  watcherProcessing = true;
  console.log(`[watcher] 收到: ${text.substring(0, 60)}`);

  const child = spawn('claude', ['-p', '--dangerously-skip-permissions', text], {
    cwd: 'D:\\Kel',
    shell: true,
    timeout: 300000 // 5分钟超时
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });

  child.on('close', (code) => {
    const result = stdout || stderr || '(无输出)';
    const truncated = result.length > 2000 ? result.substring(0, 2000) + '\n...(截断)' : result;

    if (code === 0) {
      server.addMessage({ role: 'assistant', text: truncated, content: truncated });
    } else {
      console.error(`[watcher] 执行出错 (code ${code})`);
      server.addMessage({ role: 'assistant', type: 'worklog', text: `⚠️ 执行出错:\n${truncated}`, action: 'command' });
    }
    watcherProcessing = false;
  });

  child.on('error', (err) => {
    console.error(`[watcher] spawn error: ${err.message}`);
    watcherProcessing = false;
  });
}
