# AMPD

Next.js 15와 Supabase를 사용한 마케팅 플랫폼입니다.

## 🚀 주요 기능

- **Google OAuth 인증**: 간편한 Google 계정 로그인
- **반응형 대시보드**: 모바일과 데스크톱 모두 지원
- **실시간 데이터**: Supabase를 통한 실시간 데이터 동기화
- **모던 UI**: shadcn/ui와 Tailwind CSS로 구현된 세련된 인터페이스
- **타입 안전성**: TypeScript로 구현된 완전한 타입 안전성

## 기술 스택

- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **Supabase** - 백엔드 서비스 (인증, 데이터베이스)
- **Bun** - 빠른 JavaScript 런타임 및 패키지 매니저
- **ESLint** - 코드 품질 관리

## 시작하기

### 1. 의존성 설치

```bash
bun install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 개발 환경 테스트 설정 (선택사항)
# NEXT_PUBLIC_TEST_MODE=true
# NEXT_PUBLIC_BYPASS_DOMAIN_CHECK=true
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 URL과 anon key를 복사합니다.
3. Authentication > Providers에서 Google OAuth를 활성화합니다.
4. Google OAuth 설정:
   - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI에 `https://your-project-id.supabase.co/auth/v1/callback` 추가
   - Client ID와 Client Secret을 Supabase에 입력

### 4. 개발 서버 실행

```bash
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 인증 시스템

- **Google OAuth 로그인**만 지원
- **@gna.company 도메인 이메일**만 로그인 가능
- 자동 사용자 프로필 생성
- 인증 상태 관리 및 리다이렉트

## 테스트 방법

### 도메인 제한 테스트

1. **회사 도메인이 아닌 계정**으로 로그인 시도
2. **에러 메시지 확인**: "🚫 회사 계정으로만 로그인 가능합니다"
3. **자동 로그아웃** 및 로그인 페이지로 리다이렉트

### 개발 환경에서 테스트 우회 (선택사항)

`.env.local`에 다음을 추가하여 도메인 제한을 우회할 수 있습니다:

```env
NEXT_PUBLIC_TEST_MODE=true
NEXT_PUBLIC_BYPASS_DOMAIN_CHECK=true
```

⚠️ **주의**: 이 설정은 개발 환경에서만 사용하고, 프로덕션에서는 절대 사용하지 마세요!

## 프로젝트 구조

```
src/
├── app/                    # App Router 디렉토리
│   ├── dashboard/         # 대시보드 페이지
│   ├── login/            # 로그인 페이지
│   ├── globals.css       # 전역 스타일
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 홈페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth-guard.tsx    # 인증 가드 컴포넌트
│   └── login-form.tsx    # 로그인 폼
├── hooks/                 # 커스텀 훅
│   └── use-auth.tsx      # 인증 훅
└── lib/                   # 유틸리티 함수
    ├── auth-utils.ts     # 인증 유틸리티
    ├── database.types.ts # 데이터베이스 타입
    └── supabase.ts      # Supabase 클라이언트
```

## 개발 가이드

- 컴포넌트는 `src/components/` 디렉토리에 생성
- 페이지는 `src/app/` 디렉토리에 생성
- 유틸리티 함수는 `src/lib/` 디렉토리에 생성
- 커스텀 훅은 `src/hooks/` 디렉토리에 생성
- 타입 정의는 `src/lib/database.types.ts`에 관리
