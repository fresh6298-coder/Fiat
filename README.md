# Fiat

📘 경제학 학습노트 — 경제학 원론 강의 시리즈

`index.html`을 브라우저로 열면 전체 강의 목록 허브가 뜹니다. 각 강의를 누르면 그 강의의 학습노트로 이동합니다.

각 강의 노트는 원본 강의를 그대로 옮긴 것이 아니라, 핵심 개념 · 용어집 · 이해도 확인 퀴즈 · 생각해볼 질문 탭으로 재구성한 요약 자료입니다.

## 폴더 구성

```
index.html          # 강의 목록 허브 페이지
lecture-01.html      # 1강 · 인간행동과 경제학의 방법론
lecture-02.html      # 2강 · 가치와 한계효용
lecture-03.html      # 3강 · 시간
lecture-04.html      # 4강 · 노동
lecture-05.html      # 5강 · 재산권
lecture-06.html      # 6강 · 자본
lecture-07.html      # 7강 · 기술
lecture-08.html      # 8강 · 에너지와 권력
lecture-09.html      # 9강 · 무역
lecture-10.html      # 10강 · 화폐
lecture-11.html      # 11강 · 시장
lecture-12.html      # 12강 · 자본주의
lecture-13.html      # 13강 · 시간선호
lecture-14.html      # 14강 · 신용과 은행업
lecture-15.html      # 15강 · 통화팽창
lecture-16.html      # 16강 · 폭력
lecture-17.html      # 17강 · 국방
lecture-18.html      # 18강 · 문명과 자본주의
ask.html             # 💬 AI 질의응답 페이지
notes.html           # 📒 저장한 노트 페이지 (질문하기에서 저장한 답변 모음)
api/ask.js           # 질의응답용 Vercel 서버리스 함수 (Gemini API 호출)
api/notes.js         # 노트 동기화용 Vercel 서버리스 함수 (Upstash Redis 호출)
data/knowledge-base.json  # 1~18강 요약 자료를 모은 질의응답용 지식베이스
```

1강부터 18강까지 모든 강의 노트가 등록되었습니다.

GitHub Pages 또는 Vercel로 배포하면 `index.html`이 자동으로 저장소의 홈페이지로 뜹니다.

## 💬 질문하기 (AI 질의응답) 설정

`ask.html`은 사용자가 자유 형식으로 질문하면 `api/ask.js` 서버리스 함수가 `data/knowledge-base.json`(1~18강 요약 자료)을 근거로 Google Gemini API를 호출해 답변하는 페이지입니다. 원본 강의 스크립트는 저장하지 않으며, 이미 재구성된 요약 자료만 근거로 사용합니다.

동작하려면 Vercel 프로젝트에 아래 환경변수를 설정해야 합니다 (Vercel 대시보드 → 프로젝트 → Settings → Environment Variables):

- `GEMINI_API_KEY` (필수) — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 무료로 발급받는 API 키
- `GEMINI_MODEL` (선택, 기본값 `gemini-3.5-flash`) — 사용할 모델 ID. 구글이 모델을 새로 내놓거나 기존 모델을 내리면([ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) 참고) 이 값을 최신 모델명으로 갱신해주세요.

환경변수 설정 후 재배포하면 `ask.html`에서 바로 질문할 수 있습니다. API 키는 서버(서버리스 함수) 안에서만 사용되며 클라이언트에 노출되지 않습니다.

## 📒 저장한 노트 & 기기 간 동기화

`ask.html`에서 AI 답변마다 "💾 저장" 버튼을 누르면 `notes.html`에서 언제든 다시 볼 수 있습니다. 기본적으로는 브라우저 로컬 저장소(localStorage)에만 저장되어 같은 브라우저·기기에서만 보입니다.

**여러 기기에서 동기화하려면** `ask.html` 또는 `notes.html`의 "🔗 동기화" 버튼을 눌러 동기화 코드를 만들고, 다른 기기에도 같은 코드를 입력하면 됩니다. 이 코드는 비밀번호처럼 작동하는 공유 식별자이며(로그인 계정 없이 코드 자체가 접근 권한), 노트는 서버 쪽 Redis(Upstash)에 코드별로 저장됩니다.

동기화 기능이 동작하려면 Vercel 프로젝트에 아래 환경변수가 필요합니다:

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (필수) — [upstash.com](https://upstash.com)에서 무료로 Redis 데이터베이스를 만들면 발급되는 REST URL과 토큰. Vercel 대시보드의 Marketplace/Storage에서 Upstash를 연결하면 자동으로 채워지기도 하고, upstash.com에서 직접 발급받아 Vercel 환경변수에 수동으로 등록해도 됩니다.

이 환경변수가 없어도 사이트는 정상 동작하며, 동기화 없이 로컬 저장(브라우저별 저장)만 사용됩니다.
