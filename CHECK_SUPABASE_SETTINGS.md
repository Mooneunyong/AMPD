# Supabase 설정 확인 필수!

## ⚠️ 중요: Supabase Dashboard 설정이 잘못되어 있으면 로그인이 작동하지 않습니다.

### 1. Supabase Dashboard 접속
https://supabase.com/dashboard

### 2. Authentication > URL Configuration 확인

#### Site URL
- 값: `http://localhost:3000`

#### Redirect URLs
다음 URL들이 **반드시** 포함되어 있어야 합니다:

```
http://localhost:3000/api/auth/callback
http://localhost:3000/auth/callback
```

⚠️ **중요**: 
- `/api/auth/callback`이 **반드시** 있어야 합니다 (현재 코드는 이 URL 사용)
- `/auth/callback`은 백업용 (에러 표시용)

### 3. Authentication > Providers > Google 확인

- ✅ Enable Google Provider가 **활성화**되어 있어야 합니다
- Client ID와 Client Secret이 **올바르게 입력**되어 있어야 합니다

### 4. 설정 완료 후

1. Supabase 설정 저장
2. 브라우저 캐시 삭제 (`Cmd+Shift+R` 또는 `Ctrl+Shift+R`)
3. 로그인 다시 시도

### 5. 문제가 계속되면

터미널 로그를 확인하세요:
- 로그인 버튼 클릭 시 `[signInWithGoogle] OAuth 시작` 로그가 나오는지
- Google 로그인 후 `/api/auth/callback?code=...`로 리다이렉트되는지
- 터미널에 `[Auth Callback API] 시작` 로그가 나오는지

**가장 흔한 문제**: Redirect URLs에 `/api/auth/callback`이 없어서 Supabase가 리다이렉트를 거부합니다.

