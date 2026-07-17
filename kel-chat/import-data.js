/**
 * Import chat data from Kel-Home export JSON into kel-chat server format.
 * Usage: node import-data.js [chatId]
 * Default imports the largest chat ("宝宝" / mr7rzj7i5ev0xe)
 */
const fs = require('fs');
const path = require('path');

const EXPORT_FILE = path.join(__dirname, '..', 'data', 'kel-selective-14parts-2026-07-16..json');
const OUTPUT_FILE = path.join(__dirname, 'data', 'messages.json');

// Ensure output dir
const outDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Reading export file...');
const data = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));

// Pick chat
const chatId = process.argv[2] || 'mr7rzj7i5ev0xe';
const chat = data.chats[chatId];
if (!chat) {
  console.error(`Chat ${chatId} not found. Available:`);
  Object.entries(data.chats).forEach(([id, c]) => console.log(`  ${id}: ${c.title} (${(c.messages||[]).length} msgs)`));
  process.exit(1);
}

console.log(`Importing chat: "${chat.title}" (${chat.messages.length} messages)`);

// Convert messages
// Since original doesn't have timestamps, we'll generate them starting from a base date
// and spacing them ~2 minutes apart (just for display purposes)
const BASE_TS = new Date('2025-05-01T10:00:00+08:00').getTime();
const MSG_INTERVAL = 2 * 60 * 1000; // 2 minutes between messages

const messages = [];
let ts = BASE_TS;

for (let i = 0; i < chat.messages.length; i++) {
  const m = chat.messages[i];
  if (!m.text && !m.content) continue; // skip empty

  const msg = {
    id: m.id || `imported_${i}_${Math.random().toString(36).slice(2,8)}`,
    role: m.role === 'user' ? 'user' : 'assistant',
    text: m.text || m.content || '',
    content: m.text || m.content || '',
    ts: ts,
  };

  // Include thinking/thought chain if present
  if (m.thinking) {
    msg.thinking = m.thinking;
  }

  messages.push(msg);

  // Vary the interval a bit
  const variation = Math.floor(Math.random() * 60000); // 0-60s variation
  ts += MSG_INTERVAL + variation;
}

// Write
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(messages, null, 2), 'utf8');
console.log(`✓ Imported ${messages.length} messages to ${OUTPUT_FILE}`);
console.log(`  Time range: ${new Date(BASE_TS).toLocaleDateString()} - ${new Date(ts).toLocaleDateString()}`);

// Also export memories for reference
if (data.memories) {
  const memFile = path.join(outDir, 'memories.json');
  fs.writeFileSync(memFile, JSON.stringify(data.memories, null, 2), 'utf8');
  console.log(`✓ Exported ${Array.isArray(data.memories) ? data.memories.length : Object.keys(data.memories).length} memories to ${memFile}`);
}

// Export persona
if (data.personas) {
  const personaFile = path.join(outDir, 'persona.json');
  fs.writeFileSync(personaFile, JSON.stringify(data.personas, null, 2), 'utf8');
  console.log(`✓ Exported persona to ${personaFile}`);
}
