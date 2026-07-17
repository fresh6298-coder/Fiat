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
api/ask.js           # 질의응답용 Vercel 서버리스 함수 (Gemini API 호출)
data/knowledge-base.json  # 1~18강 요약 자료를 모은 질의응답용 지식베이스
```

1강부터 18강까지 모든 강의 노트가 등록되었습니다.

GitHub Pages 또는 Vercel로 배포하면 `index.html`이 자동으로 저장소의 홈페이지로 뜹니다.

## 💬 질문하기 (AI 질의응답) 설정

`ask.html`은 사용자가 자유 형식으로 질문하면 `api/ask.js` 서버리스 함수가 `data/knowledge-base.json`(1~18강 요약 자료)을 근거로 Google Gemini API를 호출해 답변하는 페이지입니다. 원본 강의 스크립트는 저장하지 않으며, 이미 재구성된 요약 자료만 근거로 사용합니다.

동작하려면 Vercel 프로젝트에 아래 환경변수를 설정해야 합니다 (Vercel 대시보드 → 프로젝트 → Settings → Environment Variables):

- `GEMINI_API_KEY` (필수) — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 무료로 발급받는 API 키
- `GEMINI_MODEL` (선택, 기본값 `gemini-2.5-flash`) — 사용할 모델 ID

환경변수 설정 후 재배포하면 `ask.html`에서 바로 질문할 수 있습니다. API 키는 서버(서버리스 함수) 안에서만 사용되며 클라이언트에 노출되지 않습니다.
