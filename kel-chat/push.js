/**
 * Kel Work Log Pusher
 * Claude Code 工作时调用这个脚本把进度推送到聊天前端
 *
 * 用法:
 *   node push.js "正在修改前端样式"
 *   node push.js --code "const x = 1;" --lang js "写了一个变量"
 *   node push.js --action command "运行了 npm install"
 *   node push.js --action file --code "<文件内容>" "修改了 index.html"
 */

const http = require('http');

const SERVER = 'http://localhost:3456';

function push(options) {
  const payload = JSON.stringify({
    text: options.text || '',
    code: options.code || null,
    language: options.language || null,
    action: options.action || 'update'
  });

  return new Promise((resolve, reject) => {
    const url = new URL(SERVER + '/api/worklog');
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = { action: 'update' };
  let isChat = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--code' && args[i+1]) { options.code = args[++i]; }
    else if (args[i] === '--lang' && args[i+1]) { options.language = args[++i]; }
    else if (args[i] === '--action' && args[i+1]) { options.action = args[++i]; }
    else if (args[i] === '--chat') { isChat = true; }
    else { options.text = args[i]; }
  }

  if (isChat) {
    // Send as normal chat message (not worklog)
    const payload = JSON.stringify({ role: 'assistant', text: options.text, content: options.text });
    const http = require('http');
    const url = new URL(SERVER + '/api/send');
    const req = http.request({
      hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ const r=JSON.parse(d); console.log('✓', r.message?.id || 'sent'); }); });
    req.on('error', e => console.error('✗', e.message));
    req.write(payload); req.end();
  } else {
    push(options)
      .then(r => console.log('✓', r.id))
      .catch(e => console.error('✗', e.message));
  }
}

module.exports = { push };
