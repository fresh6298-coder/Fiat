const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const MAX_NOTES = 300;
const CODE_RE = /^[a-z0-9-]{6,64}$/i;

function redisConfigured() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`redis GET failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'content-type': 'text/plain' },
    body: value,
  });
  if (!res.ok) throw new Error(`redis SET failed: ${res.status}`);
  return res.json();
}

function loadArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeCode(code) {
  return typeof code === 'string' ? code.trim() : '';
}

module.exports = async (req, res) => {
  if (!redisConfigured()) {
    res.status(500).json({ error: '서버에 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되어 있지 않습니다.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const code = normalizeCode(req.query && req.query.code);
      if (!CODE_RE.test(code)) {
        res.status(400).json({ error: '동기화 코드 형식이 올바르지 않습니다.' });
        return;
      }
      const raw = await redisGet(`notes:${code}`);
      res.status(200).json({ notes: loadArray(raw) });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};
    const code = normalizeCode(body.code);
    if (!CODE_RE.test(code)) {
      res.status(400).json({ error: '동기화 코드 형식이 올바르지 않습니다.' });
      return;
    }
    const key = `notes:${code}`;

    if (req.method === 'POST') {
      const question = typeof body.question === 'string' ? body.question.trim().slice(0, 800) : '';
      const answer = typeof body.answer === 'string' ? body.answer.trim().slice(0, 4000) : '';
      if (!question || !answer) {
        res.status(400).json({ error: '저장할 질문/답변이 없습니다.' });
        return;
      }
      const existing = loadArray(await redisGet(key));
      const note = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        question,
        answer,
        savedAt: new Date().toISOString(),
      };
      const updated = [note, ...existing].slice(0, MAX_NOTES);
      await redisSet(key, JSON.stringify(updated));
      res.status(200).json({ notes: updated });
      return;
    }

    if (req.method === 'DELETE') {
      const id = typeof body.id === 'string' ? body.id : '';
      const existing = loadArray(await redisGet(key));
      const updated = id ? existing.filter((n) => n.id !== id) : [];
      await redisSet(key, JSON.stringify(updated));
      res.status(200).json({ notes: updated });
      return;
    }

    res.status(405).json({ error: 'GET/POST/DELETE 요청만 지원합니다.' });
  } catch (err) {
    res.status(500).json({ error: '동기화 서버 처리 중 오류가 발생했습니다.', detail: String(err).slice(0, 500) });
  }
};
