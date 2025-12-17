const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const API_SECRET = process.env.API_SECRET || 'change-me';
const WORKSPACE_BASE = '/tmp/workspace';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== API_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/execute', auth, async (req, res) => {
  const { prompt, projectId } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const workdir = path.join(WORKSPACE_BASE, projectId || uuidv4());
  if (!fs.existsSync(workdir)) fs.mkdirSync(workdir, { recursive: true });

  console.log('Executing Claude Code:', prompt.substring(0, 100));

  const claude = spawn('claude', ['-p', prompt, '--allowedTools', 'Write', 'Read', 'Edit'], {
    cwd: workdir,
    env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
  });

  let stdout = '', stderr = '';
  claude.stdout.on('data', d => { stdout += d; console.log('stdout:', d.toString()); });
  claude.stderr.on('data', d => { stderr += d; console.error('stderr:', d.toString()); });

  claude.on('close', code => {
    const files = {};
    const readDir = (dir, base = '') => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(item => {
        const full = path.join(dir, item);
        const rel = path.join(base, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          readDir(full, rel);
        } else if (stat.isFile()) {
          files[rel] = fs.readFileSync(full, 'utf-8');
        }
      });
    };
    readDir(workdir);
    res.json({ success: code === 0, exitCode: code, stdout, stderr, files });
  });

  claude.on('error', err => {
    console.error('Process error:', err);
    res.status(500).json({ error: err.message });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Claude Code Server running on port ' + PORT));