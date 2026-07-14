# AMPD

**GNA Company 마케팅 AM(Account Manager)을 위한 광고주·캠페인·정산 관리 플랫폼**입니다.
광고주(Account)와 게임, 캠페인 성과를 한곳에서 관리하고, MMP(AppsFlyer/Adjust) 데이터를
Google Sheets로 수집·시각화하며, 정산서(Invoice) 발행·발송까지 처리합니다.

- 프로덕션: [amkit.vercel.app](https://amkit.vercel.app) (Vercel 배포)
- 스택: Next.js 15 (App Router) · TypeScript · Supabase · Tailwind CSS · shadcn/ui
- 패키지 매니저: **bun**

---

## 주요 기능

### 광고주 · 게임 (Accounts / Games)

- 광고주(Account) CRUD 및 담당 AM 배정
- 광고주별 게임 등록/수정 (스토어 URL로 아이콘·이름 자동 조회, `package_identifier`, MMP 토큰 관리)
- 게임 정보 캐싱으로 반복 조회 최소화

### 캠페인 · 성과 (Campaigns)

- 캠페인 CRUD, 담당자·지역·기간·타입(CPI 등) 관리
- **성과 대시보드**: Google Sheets(광고주별 시트)의 일간/월간 데이터를 읽어 표·차트로 표시
  - 일간/월간 성과 테이블, ROAS 배경 강조, 셀 메모(hover) 표시
  - **스프레드시트식 셀 선택**: 드래그로 범위 선택 → 합계/평균/개수/최소/최대 집계, TSV 복사
    (일간·월간 공통 `useCellSelection` 훅)
  - 기간 비교, 일/주/월 단위 차트
- **변경 기록 / CPI 단가 변경**: 비고(카테고리 다중선택)는 셀 텍스트로, 상세 메모는 셀 노트로,
  CPI 변경은 해당 날짜 단가 셀에 기록 (`/api/campaigns/[id]/note`)
- 내 캠페인(`/campaigns/my`) / 전체 캠페인(`/campaigns`) 뷰, 캠페인 빠른 전환 스위처

### MMP 데이터 수집 (북마클릿)

- **AppsFlyer / Adjust 북마클릿**으로 각 대시보드에서 성과를 긁어 Google Sheets로 동기화
  - 수집 범위 40일, endDate = KST 기준 "오늘"
  - Adjust: 광고주별 `adjust_account_id`로 계정 자동 전환, `package_identifier`로 `app_token` 자동 탐지
  - 필수 필드(타임존/시트 URL/토큰/패키지) 누락 캠페인은 사유별로 그룹핑해 스킵 안내
- 외부 연동 API(`/api/external/*`)는 세션 또는 `X-API-Key`(사용자별 발급) 인증

### 정산 · 인보이스 (Settlements / Invoices)

- 정산서 생성, 정산 대상 캠페인/라인 관리
- 인보이스 PDF 생성(Puppeteer + `@sparticuz/chromium`, 서버리스 대응) 및 Gmail 발송
- 인보이스 이메일 템플릿 및 변수 치환, 발송 이력 관리

### 이메일 템플릿 (Email Templates)

- 인보이스 이메일 템플릿 편집, 변수 하이라이트

### 인증 · 권한

- Google OAuth 로그인, **@gna.company 도메인만 허용**
- 역할(`admin` / `am`) 기반 접근 제어, 담당 캠페인만 조회하는 스코프

---

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router, Turbopack), React 18, TypeScript 5 |
| 백엔드/DB | Supabase (Postgres + Auth + RLS), `@supabase/ssr` |
| 데이터 | TanStack Query, Zustand, React Hook Form + Zod |
| UI | Tailwind CSS 3, shadcn/ui (Radix UI), lucide-react, Recharts, sonner |
| 외부 API | Google Sheets API v4 · Gmail API (`googleapis`, 서비스 계정) |
| PDF | puppeteer-core + `@sparticuz/chromium` |
| 배포 | Vercel |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                        # 홈
│   ├── accounts/                       # 광고주 목록/상세
│   │   └── [id]/settlements/...        # 정산서·인보이스
│   ├── campaigns/                      # 캠페인 목록 / my / [id] 상세(성과)
│   ├── email-templates/                # 이메일 템플릿
│   ├── settings/ · permissions/        # 설정 · 권한
│   ├── auth/callback/route.ts          # OAuth 콜백
│   └── api/
│       ├── campaigns/[id]/note         # 비고/CPI 시트 기록
│       ├── external/{campaigns,sync-sheet}  # 북마클릿·외부 연동(API Key)
│       ├── google-sheets · fetch-game-info
│       ├── gmail/signature
│       └── invoices/[id]/{pdf,send}
├── components/
│   ├── ui/                             # shadcn/ui 프리미티브
│   ├── common/                         # TableWrapper, layout, date-range-picker 등 공용
│   ├── accounts/ · campaigns/ · games/ · settlements/ · invoices/ · users/ ...
│   └── campaigns/campaign-detail/
│       ├── daily-report-table.tsx      # 일간 성과 표
│       ├── monthly-summary-table.tsx   # 월간 성과 표
│       └── use-cell-selection.tsx      # 셀 선택·집계·복사 공용 훅
├── hooks/                              # use-*-management, use-auth 등
└── lib/
    ├── supabase.ts · database.types.ts # Supabase 클라이언트 / 타입
    ├── google-sheets.ts                # 시트 읽기/쓰기(쿼터 재시도·캐싱)
    ├── gmail-send.ts · google-oauth.ts
    ├── invoice-pdf.ts · invoice-html-template.ts
    ├── permissions.ts
    └── utils/                          # roas, sheet-formatters, campaign-metrics 등
```

### 데이터 모델 (Supabase 주요 테이블)

`user_profiles`, `accounts`, `games`, `campaigns`, `settlements`,
`settlement_campaigns`, `settlement_lines`, `invoices`,
`invoice_email_templates`, `invoice_send_history`, `company_info`

---

## 시작하기

### 1. 의존성 설치

```bash
bun install
```

### 2. 환경 변수 (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 사이트 URL (OAuth 리다이렉트 등에 사용)
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # 프로덕션: https://amkit.vercel.app

# Google OAuth (Gmail 발송 등)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...

# Google 서비스 계정 (Sheets API)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. 개발 서버

```bash
bun dev        # Turbopack (기본)
bun dev:webpack  # webpack 폴백
```

[http://localhost:3000](http://localhost:3000) 에서 확인하세요.

### 4. 빌드 / 린트

```bash
bun run build
bun run lint
```

---

## 외부 연동 메모

- **Google Sheets**: 서비스 계정 JWT로 접근. 광고주별로 하나의 스프레드시트를 공유하고
  캠페인은 탭으로 구분. 읽기 쿼터(≈60 req/min/user) 대응을 위해 값+노트를 한 번의
  `spreadsheets.get`으로 읽고, 지수 백오프 재시도와 메타(title) 캐싱을 사용.
- **셀 노트/CPI**: `spreadsheets.batchUpdate`의 `updateCells`(note) 및
  `values.batchUpdate`로 기록. CPI가 수식이면 값으로 덮어씀.
- **PDF**: 로컬은 puppeteer, Vercel(서버리스)은 `@sparticuz/chromium` + puppeteer-core.
  관련 패키지는 `next.config.ts`의 `serverExternalPackages`에 등록.

---

## 개발 규칙 / 주의사항

- 패키지 매니저는 **bun** (npm/yarn 아님).
- **ESLint**: `next/core-web-vitals` 설정에는 `@typescript-eslint/no-explicit-any` 룰이
  정의돼 있지 않음 → `// eslint-disable-next-line @typescript-eslint/...` 지시문을 쓰면
  "rule not found"로 **빌드가 실패**함. 사용 금지. `any`가 필요하면 좁은 타입 단언
  (`const e = err as { code?: number }`)으로 처리.
- **프로덕션 Google Sheets에 테스트 데이터 기록 금지** (실제 광고주 시트임).
- 컴포넌트/페이지/훅/유틸은 각각 `components/`, `app/`, `hooks/`, `lib/`(+`lib/utils/`)에 배치.
- DB 타입은 `src/lib/database.types.ts`로 관리.
