# 로그인 디버깅 가이드

## 현재 상태 확인

1. **브라우저 콘솔 로그 확인**:
   - F12 또는 Cmd+Option+I (Mac)로 개발자 도구 열기
   - Console 탭에서 다음 로그 확인:
     - `[signInWithGoogle] OAuth 시작`
     - `[Auth Callback] 시작`
     - `[useAuth] 세션 확인 시작...`
     - `[useAuth] 세션 확인 결과:`

2. **터미널 로그 확인**:
   - 개발 서버 실행 중인 터미널에서 다음 로그 확인:
     - `[signInWithGoogle] OAuth 시작`
     - `[Auth Callback API] 시작:`
     - `[Auth Callback] 쿠키 저장 시도...`
     - `[Auth Callback] 성공!`

3. **Network 탭 확인**:
   - 개발자 도구 > Network 탭
   - 로그인 클릭 후 다음 요청 확인:
     - `/api/auth/callback` - 상태 코드 확인
     - `/api/auth/session` - 상태 코드 및 응답 확인

4. **쿠키 확인**:
   - 개발자 도구 > Application > Cookies > `http://localhost:3000`
   - 다음 쿠키 존재 여부 확인:
     - `sb-access-token`
     - `sb-refresh-token`

## Supabase 설정 확인

Supabase Dashboard에서 다음을 확인하세요:

1. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs에 다음 추가:
     - `http://localhost:3000/api/auth/callback`
     - `http://localhost:3000/auth/callback` (백업)

2. **Authentication > Providers > Google**:
   - Google OAuth 활성화 확인
   - Client ID와 Secret 입력 확인

## 로그인 플로우

1. 사용자가 "Login with Google" 클릭
2. `signInWithGoogle()` 호출 → Supabase로 리다이렉트
3. Google 로그인 완료 후 `/api/auth/callback?code=...`로 리다이렉트
4. 서버에서 code를 세션으로 교환
5. HttpOnly 쿠키에 토큰 저장
6. 홈(`/`)으로 리다이렉트
7. 클라이언트에서 `/api/auth/session` 호출하여 세션 확인
8. 로그인 상태로 UI 업데이트

## 문제 진단

위 단계 중 어디서 실패하는지 확인하세요.

