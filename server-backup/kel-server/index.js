const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const axios   = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app     = express();
const PORT    = 3000;
const DATA    = '/home/app-data';

// ── 初始化数据文件 ────────────────────────────────────────────
['memories.json','todos.json','photos.json'].forEach(f => {
  const p = path.join(DATA, f);
  if (!fs.existsSync(p)) fs.writeFileSync(p, '[]');
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── 文件上传配置 ──────────────────────────────────────────────
const upload = multer({
  dest: path.join(DATA, 'uploads/'),
  limits: { fileSize: 20 * 1024 * 1024 }
});
if (!fs.existsSync(path.join(DATA,'uploads')))
  fs.mkdirSync(path.join(DATA,'uploads'), { recursive: true });

// ── 工具函数 ──────────────────────────────────────────────────
const readJSON  = f => JSON.parse(fs.readFileSync(path.join(DATA,f),'utf8'));
const writeJSON = (f,d) => fs.writeFileSync(path.join(DATA,f), JSON.stringify(d,null,2));
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ── POST /api/chat ─────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], image, imageMime, apiKey, systemPrompt } = req.body;
  if (!apiKey) return res.status(400).json({ error: '缺少 apiKey' });

  const client = new Anthropic({ apiKey });

  const messages = [];
  for (const h of history) {
    messages.push({ role: h.role, content: h.content || h.text || '' });
  }

  if (image) {
    messages.push({ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: imageMime || 'image/jpeg', data: image }},
      { type: 'text', text: message || '这张图片里有什么？' }
    ]});
  } else {
    messages.push({ role: 'user', content: message });
  }

  try {
    const resp = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt || '',
      messages
    });

    const reply = resp.content[0].text;

    // 自动识别待办意图
    const todoPattern = /(?:提醒我|记得|别忘了|待办[：:]?\s*)(.+?)(?:[，。\n]|$)/g;
    let m;
    const todos = readJSON('todos.json');
    let newTodos = 0;
    while ((m = todoPattern.exec(reply)) !== null) {
      todos.push({ id: genId(), text: m[1].trim(), done: false, createdAt: Date.now() });
      newTodos++;
    }
    if (newTodos) writeJSON('todos.json', todos);

    // 自动识别记忆意图
    const memPattern = /(?:记住[：:]?\s*|你要记住|我叫|我是|我的[^，。\n]{0,4}是)(.{4,60}?)(?:[，。\n]|$)/g;
    const mems = readJSON('memories.json');
    let newMems = 0;
    while ((m = memPattern.exec(message || '')) !== null) {
      mems.push({ id: genId(), text: m[1].trim(), createdAt: Date.now() });
      newMems++;
    }
    if (newMems) writeJSON('memories.json', mems);

    // 图片存相册
    if (image) {
      const photos = readJSON('photos.json');
      photos.push({ id: genId(), mimeType: imageMime || 'image/jpeg', data: image, createdAt: Date.now(), caption: message || '' });
      writeJSON('photos.json', photos);
    }

    res.json({ reply, newTodos, newMems });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/memories ──────────────────────────────────────────────
app.get('/api/memories',  (req, res) => res.json(readJSON('memories.json')));
app.post('/api/memories', (req, res) => {
  const items = readJSON('memories.json');
  const item  = { id: genId(), text: req.body.text, createdAt: Date.now() };
  items.push(item);
  writeJSON('memories.json', items);
  res.json(item);
});

// ── /api/todos ─────────────────────────────────────────────────
app.get('/api/todos',  (req, res) => res.json(readJSON('todos.json')));
app.post('/api/todos', (req, res) => {
  const items = readJSON('todos.json');
  const item  = { id: genId(), text: req.body.text, done: false, createdAt: Date.now() };
  items.push(item);
  writeJSON('todos.json', items);
  res.json(item);
});
app.put('/api/todos/:id', (req, res) => {
  const items = readJSON('todos.json');
  const idx   = items.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '找不到' });
  items[idx] = { ...items[idx], ...req.body };
  writeJSON('todos.json', items);
  res.json(items[idx]);
});

// ── /api/photos ────────────────────────────────────────────────
app.get('/api/photos', (req, res) => {
  const photos = readJSON('photos.json');
  res.json(photos.map(p => ({ id: p.id, createdAt: p.createdAt, caption: p.caption })));
});

// ── /api/upload ────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有文件' });
  res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname });
});
app.use('/uploads', express.static(path.join(DATA, 'uploads')));

// ── /api/music/search ──────────────────────────────────────────
app.get('/api/music/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const r = await axios.get('https://music.163.com/api/search/get', {
      params: { s: keyword, type: 1, limit: 10 },
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' },
      timeout: 8000
    });
    const songs = (r.data.result?.songs || []).map(s => ({
      id: s.id, name: s.name,
      artist: s.artists?.map(a => a.name).join('/') || ''
    }));
    res.json(songs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/music/play ────────────────────────────────────────────
app.get('/api/music/play', async (req, res) => {
  try {
    const { id } = req.query;
    await axios.get('https://music.163.com/song/media/outer/url', {
      params: { id }, maxRedirects: 0, timeout: 5000,
      validateStatus: s => s < 400
    });
    res.json({ url: 'https://music.163.com/song/media/outer/url?id=' + id });
  } catch (e) {
    res.json({ url: 'https://music.163.com/song/media/outer/url?id=' + id });
  }
});

// ── 健康检查 ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => console.log('kel-server running on port', PORT));
