const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const DEFAULT_UPLOAD = path.join(DATA_DIR, 'uploaded.edi');

function parseBapli(text) {
  const segments = text.split(/~|\r?\n/).map(s => s.trim()).filter(Boolean);
  const parsed = segments.map(seg => {
    const parts = seg.split(/\+|\*|:/).map(p => p.trim()).filter(Boolean);
    return { raw: seg, parts };
  });
  return { segments: parsed };
}

app.get('/api/load-default', (req, res) => {
  const possible = '/mnt/data/ARTABAZ(1.5).EDI';
  if (fs.existsSync(possible)) {
    const text = fs.readFileSync(possible, 'utf8');
    return res.json({ ok: true, filename: path.basename(possible), content: text, parsed: parseBapli(text) });
  }
  if (fs.existsSync(DEFAULT_UPLOAD)) {
    const text = fs.readFileSync(DEFAULT_UPLOAD, 'utf8');
    return res.json({ ok: true, filename: path.basename(DEFAULT_UPLOAD), content: text, parsed: parseBapli(text) });
  }
  return res.json({ ok: false, message: 'No default file found' });
});

app.post('/api/upload', (req, res) => {
  const { filename, content } = req.body;
  if (!content) return res.status(400).json({ ok: false, message: 'No content provided' });
  const dest = path.join(DATA_DIR, filename || 'uploaded.edi');
  fs.writeFileSync(dest, content, 'utf8');
  return res.json({ ok: true, filename: path.basename(dest), parsed: parseBapli(content) });
});

app.post('/api/save', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).json({ ok: false, message: 'filename and content required' });
  const dest = path.join(DATA_DIR, filename);
  fs.writeFileSync(dest, content, 'utf8');
  return res.json({ ok: true, filename: path.basename(dest) });
});

app.post('/api/parse', (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ ok: false, message: 'content must be a string' });
  return res.json({ ok: true, parsed: parseBapli(content) });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
