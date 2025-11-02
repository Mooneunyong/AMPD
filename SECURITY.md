# 보안 가이드

## 현재 인증 토큰 저장 방식

AMPD는 **HttpOnly 쿠키**를 사용하여 인증 토큰을 저장합니다. 이는 XSS 공격으로부터 토큰을 보호하는 안전한 방법입니다.

### 보안 분석

#### ✅ 현재 보안 조치

1. **HttpOnly 쿠키 사용**
   - JavaScript에서 쿠키에 접근 불가능 → XSS 공격으로부터 토큰 보호
   - Secure 플래그: HTTPS에서만 쿠키 전송
   - SameSite 플래그: CSRF 공격 방지

2. **서버 사이드 세션 관리**
   - 토큰이 서버에서 관리됨
   - 클라이언트에는 민감한 정보 저장하지 않음

#### 🟢 완화 요소

1. **Supabase의 PKCE Flow 사용**
   - Supabase는 기본적으로 PKCE(Proof Key for Code Exchange) flow를 사용
   - 이는 토큰 탈취 위험을 상당히 줄입니다

2. **짧은 토큰 수명**
   - Access token은 짧은 수명을 가지며, Refresh token만 장기간 유지
   - 토큰이 탈취되더라도 피해를 제한할 수 있습니다

3. **Supabase RLS (Row Level Security)**
   - 데이터베이스 레벨에서 권한 제어
   - 토큰이 탈취되더라도 사용자별 데이터 접근은 제한됨

### 적용된 보안 조치

#### ✅ 보안 헤더 (middleware.ts)

다음 보안 헤더들이 모든 요청에 적용됩니다:

- **Strict-Transport-Security**: HTTPS 강제 사용
- **X-Frame-Options**: 클릭재킹 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지
- **X-XSS-Protection**: 브라우저 XSS 필터 활성화
- **Content-Security-Policy**: XSS 및 데이터 주입 공격 방지
- **Referrer-Policy**: 리퍼러 정보 제한

#### ✅ Content Security Policy (CSP)

CSP는 다음과 같이 설정되었습니다:

- 허용된 스크립트 소스: 같은 도메인, Supabase 도메인
- 허용된 연결: Supabase API, Google OAuth
- 인라인 스크립트: Supabase 클라이언트 라이브러리 호환성을 위해 제한적으로 허용

### 추가 보안 권장사항

#### 1. 즉시 적용 가능한 조치

- ✅ **보안 헤더 추가** (완료)
- ✅ **CSP 설정** (완료)
- ⚠️ **사용자 입력 검증 강화**: 모든 사용자 입력에 대한 sanitization 적용
- ⚠️ **HTTPS 강제**: 프로덕션 환경에서 HTTPS만 허용

#### 2. 중기 개선 방안

1. ✅ **서버 사이드 세션 관리** (완료)
   - Next.js API Routes를 통해 토큰을 서버에서 관리
   - HttpOnly 쿠키 사용
   - 클라이언트에는 민감한 정보 저장하지 않기

2. **토큰 갱신 전략 개선**
   - Access token 수명 단축
   - Refresh token 로테이션 구현
   - 토큰 탈취 감지 메커니즘 추가

3. **로그인 이력 추적**
   - 비정상적인 로그인 패턴 감지
   - 다중 기기 로그인 관리
   - 의심스러운 활동 알림

#### 3. 장기 개선 방안

1. **이중 인증 (2FA) 구현**
   - TOTP 또는 SMS 인증 추가
   - 보안 키 지원

2. **세션 관리 고도화**
   - 서버 사이드 세션 저장소 (Redis 등)
   - 세션 타임아웃 정책 강화
   - 동시 로그인 제한

### 현재 위험도 평가

**위험도: 낮음**

- HttpOnly 쿠키 사용으로 XSS 공격으로부터 토큰 보호
- Supabase의 PKCE flow와 RLS로 인해 추가 보안 강화
- 보안 헤더와 CSP로 추가적인 보호 계층 제공
- 서버 사이드 세션 관리로 토큰이 클라이언트에 노출되지 않음

### 실무 권장사항

1. **정기적인 보안 감사**
   - 의존성 취약점 스캔 (npm audit, snyk 등)
   - 코드 리뷰 시 보안 이슈 체크

2. **사용자 교육**
   - 강력한 비밀번호 정책 (현재는 Google OAuth 사용)
   - 피싱 사이트 주의

3. **모니터링 및 알림**
   - 비정상적인 로그인 시도 감지
   - 실패한 인증 시도 추적

### 참고 자료

- [Supabase 보안 가이드](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy 가이드](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

