const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'data', 'knowledge-base.json');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MAX_QUESTION_LEN = 800;
const MAX_HISTORY_TURNS = 6;

let cachedSystemPrompt = null;

function buildSystemPrompt() {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  const lectures = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
  const kbText = lectures
    .map((l) => {
      const parts = [`### ${l.num}강 · ${l.title.replace(/^📘\s*\d+강\s*[·:]?\s*/, '')}`];
      if (l.sub) parts.push(`요약: ${l.sub}`);
      if (l.concepts) parts.push(`핵심 개념:\n${l.concepts}`);
      if (l.terms) parts.push(`용어집:\n${l.terms}`);
      if (l.quiz) parts.push(`퀴즈:\n${l.quiz}`);
      if (l.discuss) parts.push(`생각해볼 질문:\n${l.discuss}`);
      return parts.join('\n');
    })
    .join('\n\n');

  cachedSystemPrompt = `당신은 "경제학 원론" 온라인 강좌(오스트리아학파 경제학, 1강~18강)를 정리한 학습노트 사이트의 질의응답 도우미입니다.

아래는 각 강의를 재구성한 핵심 개념·용어집·퀴즈·생각해볼 질문 자료입니다. 사용자의 질문에는 반드시 이 자료의 내용에 근거해서만 한국어로 답변하세요.

규칙:
- 자료에 없는 내용은 "이 강좌 자료에서는 다루지 않는 내용입니다"라고 솔직히 말하고, 추측성 답변을 최소화하세요.
- 답변할 때 관련된 강의 번호를 (예: "5강 참고")처럼 언급해주면 좋습니다.
- 정치적 편향이나 극단적 주장을 강요하지 말고, 강좌가 소개하는 오스트리아학파의 논리를 설명하는 방식으로 answer하세요.
- 답변은 간결하고 명확하게, 보통 3~6문장 정도로 작성하세요.
- 원본 유튜브 강의 스크립트 전체나 긴 인용문을 그대로 출력하지 마세요. 이 자료 자체가 이미 원문이 아닌 재구성된 요약입니다.

=== 강의 자료 ===
${kbText}`;

  return cachedSystemPrompt;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 지원합니다.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.' });
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

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const history = Array.isArray(body.history) ? body.history : [];

  if (!question) {
    res.status(400).json({ error: '질문을 입력해주세요.' });
    return;
  }
  if (question.length > MAX_QUESTION_LEN) {
    res.status(400).json({ error: `질문은 ${MAX_QUESTION_LEN}자 이내로 입력해주세요.` });
    return;
  }

  const trimmedHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_QUESTION_LEN) }],
    }));

  const contents = [...trimmedHistory, { role: 'user', parts: [{ text: question }] }];

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt() }] },
          contents,
          generationConfig: { maxOutputTokens: 700 },
        }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(502).json({ error: 'AI 응답 생성에 실패했습니다.', detail: errText.slice(0, 500) });
      return;
    }

    const data = await upstream.json();
    const candidate = (data.candidates || [])[0];
    const answer = ((candidate && candidate.content && candidate.content.parts) || [])
      .map((part) => part.text || '')
      .join('\n')
      .trim();

    if (!answer) {
      const blockReason = data.promptFeedback && data.promptFeedback.blockReason;
      res.status(200).json({
        answer: blockReason
          ? '이 질문에는 답변할 수 없습니다. 다른 방식으로 다시 질문해주세요.'
          : '답변을 생성하지 못했습니다.',
      });
      return;
    }

    res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: '요청 처리 중 오류가 발생했습니다.', detail: String(err).slice(0, 500) });
  }
};
