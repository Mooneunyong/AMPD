# 인증 보안 분석 및 개선 방안

## 현재 상황 분석

### ❌ 실제 구현 상태
- **토큰 저장 위치**: localStorage (클라이언트 사이드)
- **보안 취약점**: XSS 공격에 취약
- **토큰 접근**: JavaScript로 접근 가능 → 악성 스크립트가 토큰 탈취 가능

### 🔍 코드 확인 결과

**src/lib/supabase.ts:**
```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,  // localStorage에 세션 저장
    detectSessionInUrl: true,
  },
});
```

**문제점:**
1. `persistSession: true` → Supabase가 기본적으로 localStorage에 토큰 저장
2. XSS 공격 시 악성 스크립트가 `localStorage.getItem()`으로 토큰 접근 가능
3. 토큰이 탈취되면 공격자가 사용자 세션을 하이재킹 가능

### ✅ 완화 요소 (현재 적용된 보안)

1. **Content Security Policy (CSP)**
   - XSS 공격 자체를 차단하는 방어 계층
   - 하지만 완벽하지 않음 (인라인 스크립트 허용)

2. **Supabase PKCE Flow**
   - OAuth 인증 시 토큰 교환 과정 보호
   - 하지만 이미 저장된 토큰은 여전히 취약

3. **Row Level Security (RLS)**
   - 데이터베이스 레벨 권한 제어
   - 토큰 탈취 시에도 데이터 접근 제한

4. **짧은 토큰 수명**
   - Access token: 1시간 (기본값)
   - Refresh token: 더 긴 수명이지만 한 번만 사용 가능

## 개선 방안

### 옵션 1: @supabase/ssr 패키지 사용 (권장) ⭐

**장점:**
- Next.js SSR 환경에 최적화
- 서버 사이드에서 쿠키 기반 인증
- HttpOnly 쿠키로 XSS 공격 방어
- 클라이언트와 서버 모두 지원

**구현 방식:**
1. 서버 사이드: 쿠키에 토큰 저장 (HttpOnly)
2. 클라이언트 사이드: localStorage 사용 (필요시)
3. 미들웨어에서 세션 자동 갱신

**단점:**
- 기존 코드 수정 필요
- 클라이언트 컴포넌트와 서버 컴포넌트 분리 필요

### 옵션 2: 현재 방식 유지 + 보안 강화

**추가 조치:**
1. CSP 강화 (인라인 스크립트 제거)
2. 토큰 만료 시간 단축
3. 세션 타임아웃 구현
4. 비정상적인 활동 감지

**단점:**
- 근본적인 XSS 취약점은 여전히 존재
- localStorage는 여전히 JavaScript로 접근 가능

### 옵션 3: 하이브리드 방식

**구현:**
- 서버 사이드 작업: 쿠키 사용
- 클라이언트 사이드 작업: localStorage 사용 (필요한 경우만)

## 권장 사항

**즉시 적용 가능:**
1. ✅ CSP 강화 (인라인 스크립트 최소화)
2. ✅ 토큰 만료 시간 확인 및 조정
3. ⚠️ 세션 타임아웃 추가

**중기 개선 (권장):**
1. **@supabase/ssr 패키지 도입**
   - 서버 사이드에서 쿠키 기반 인증
   - 클라이언트는 localStorage 사용 (Supabase 클라이언트 라이브러리 요구)
   - 최대한 많은 인증 로직을 서버 사이드로 이동

**현재 위험도: 중간**

- CSP와 RLS로 어느 정도 보호됨
- 하지만 XSS 공격이 성공하면 토큰 탈취 가능
- 프로덕션 환경에서는 개선 권장

