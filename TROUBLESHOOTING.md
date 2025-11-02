# 로그인 문제 해결 가이드

## 현재 로그인 플로우

1. 사용자가 "Login with Google" 클릭
2. `signInWithGoogle()` 호출 → Supabase OAuth로 리다이렉트
3. Google 로그인 완료
4. `/auth/callback#access_token=...&refresh_token=...`로 리다이렉트
5. `/auth/callback` 페이지에서 hash fragment에서 토큰 추출
6. `/api/auth/callback-hash`로 POST 요청하여 HttpOnly 쿠키 저장
7. 홈(`/`)으로 리다이렉트

## 확인해야 할 로그

### 브라우저 콘솔 (F12 > Console)

**로그인 버튼 클릭 시:**
- `[signInWithGoogle] OAuth 시작, redirectTo: http://localhost:3000/auth/callback`
- `[signInWithGoogle] OAuth 리다이렉트 성공`

**Google 로그인 후 `/auth/callback` 페이지 로드 시:**
- `[Auth Callback] 페이지 로드` - hash와 search 확인
- `[Auth Callback] Hash fragment 파싱:` - hasAccessToken, hasRefreshToken 확인
- `[Auth Callback] 토큰을 서버로 전송...`
- `[Auth Callback] 토큰 저장 성공!`
- `[Auth Callback] 로그인 성공! 홈으로 이동`

### 터미널 (개발 서버 실행 중인 터미널)

**토큰 저장 시:**
- `[Auth Callback Hash] 쿠키 저장 시도...`
- `[Auth Callback Hash] 쿠키 저장 성공!`

**세션 확인 시:**
- `[Auth Session API] 쿠키 확인`
- `[Auth Session API] 세션 확인 성공`

## 문제 진단

### 1. 브라우저 콘솔에 `[Auth Callback] 페이지 로드` 로그가 없음
→ `/auth/callback` 페이지가 로드되지 않음
→ Supabase Redirect URLs 설정 확인 필요

### 2. `[Auth Callback] Hash fragment 파싱:`에서 `hasAccessToken: false`
→ Hash fragment에 토큰이 없음
→ Supabase OAuth 설정 확인 필요

### 3. `[Auth Callback] 토큰 저장 성공!` 후에도 로그인되지 않음
→ 쿠키가 설정되지 않았거나 읽히지 않음
→ 브라우저 개발자 도구 > Application > Cookies 확인

### 4. 터미널에 `[Auth Callback Hash] 쿠키 저장 시도...` 로그가 없음
→ `/api/auth/callback-hash` API가 호출되지 않음
→ 네트워크 탭에서 요청 확인

## Supabase 설정 확인

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. **Authentication > URL Configuration**
   - Redirect URLs에 `http://localhost:3000/auth/callback` 추가 확인
3. **Authentication > Providers > Google**
   - Google OAuth 활성화 확인
   - Client ID와 Secret 입력 확인

## 디버깅 단계

1. 브라우저 콘솔 열기 (F12 > Console)
2. 로그인 버튼 클릭
3. 모든 콘솔 로그 복사
4. 터미널 로그 확인
5. 브라우저 개발자 도구 > Network 탭에서 `/api/auth/callback-hash` 요청 확인
6. Application > Cookies에서 `sb-access-token`, `sb-refresh-token` 확인

## 다음 정보를 제공해주세요

1. **브라우저 콘솔 로그 전체**
2. **터미널 로그** (특히 `[Auth Callback Hash]` 관련)
3. **Network 탭**에서 `/api/auth/callback-hash` 요청 상태 코드
4. **Application > Cookies**에서 쿠키 존재 여부

이 정보를 제공해주시면 정확한 문제를 진단할 수 있습니다.

