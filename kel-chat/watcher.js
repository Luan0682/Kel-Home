/**
 * Kel Chat Watcher
 * 监听前端消息，当江吟发指令时调用Claude Code执行
 *
 * 启动方式: node watcher.js
 * 它会连接本地WebSocket，实时监听新消息
 * 收到用户消息后调用 claude -p 执行并把结果推回聊天
 */

const WebSocket = require('ws');
const { execSync, spawn } = require('child_process');
const http = require('http');

const WS_URL = 'ws://localhost:3456';
const API = 'http://localhost:3456';

let lastProcessedId = null;
let processing = false;

function pushWorklog(text, options = {}) {
  const payload = JSON.stringify({
    text,
    code: options.code || null,
    language: options.language || null,
    action: options.action || 'update'
  });
  return new Promise((resolve, reject) => {
    const url = new URL(API + '/api/worklog');
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sendReply(text) {
  const payload = JSON.stringify({ role: 'assistant', text, content: text });
  return new Promise((resolve, reject) => {
    const url = new URL(API + '/api/send');
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function handleCommand(text) {
  if (processing) return;
  processing = true;

  try {
    await pushWorklog(`📥 收到指令: ${text.substring(0, 50)}...`, { action: 'command' });

    // Call Claude Code with the message
    const child = spawn('claude', ['-p', text], {
      cwd: 'D:\\Kel',
      shell: true,
      timeout: 300000 // 5 minute timeout
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', async (code) => {
      const result = stdout || stderr || '(无输出)';
      // Truncate if too long
      const truncated = result.length > 2000 ? result.substring(0, 2000) + '\n...(截断)' : result;

      if (code === 0) {
        await sendReply(truncated);
      } else {
        await pushWorklog(`⚠️ 执行出错 (code ${code}):\n${truncated}`, { action: 'command' });
      }
      processing = false;
    });

    child.on('error', async (err) => {
      await pushWorklog(`❌ 执行失败: ${err.message}`, { action: 'command' });
      processing = false;
    });

  } catch(e) {
    await pushWorklog(`❌ 错误: ${e.message}`, { action: 'command' });
    processing = false;
  }
}

function connect() {
  console.log('🔌 连接到 Kel Chat 服务器...');
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✓ 已连接，等待指令...');
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'history') {
        // 记住最后一条消息的ID，不处理历史
        if (msg.messages.length > 0) {
          lastProcessedId = msg.messages[msg.messages.length - 1].id;
        }
        return;
      }

      if (msg.type === 'new_message' && msg.message.role === 'user') {
        // 跳过已处理的
        if (msg.message.id === lastProcessedId) return;
        lastProcessedId = msg.message.id;

        const text = msg.message.text || msg.message.content || '';
        if (!text.trim()) return;

        // 所有用户消息都当作指令执行
        console.log(`📨 收到: ${text.substring(0, 60)}`);
        handleCommand(text);
      }
    } catch(e) {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    console.log('⚠️ 断开连接，3秒后重连...');
    setTimeout(connect, 3000);
  });

  ws.on('error', () => {
    ws.close();
  });
}

connect();
console.log('🤖 Kel Watcher 启动');
console.log('   江吟在手机发的消息会自动交给 Claude Code 执行');
console.log('   Ctrl+C 停止\n');
