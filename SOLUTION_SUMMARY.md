# 로그인 문제 해결 방법 요약

## 🔍 가장 흔한 원인

**Supabase Dashboard의 Redirect URLs 설정이 잘못되었을 가능성이 높습니다.**

## ✅ 확인해야 할 사항

### 1. Supabase Dashboard 설정 (필수!)

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **Authentication > URL Configuration** 이동
4. **Redirect URLs**에 다음 URL들이 있는지 확인:

```
http://localhost:3000/api/auth/callback
```

⚠️ **이 URL이 없으면 로그인이 작동하지 않습니다!**

### 2. 로그인 플로우 확인

로그인 버튼 클릭 시:

1. Google 로그인 페이지로 이동하는지 확인
2. Google 로그인 후 어느 URL로 리다이렉트되는지 확인
3. 터미널에서 `[Auth Callback API] 시작` 로그가 나오는지 확인

### 3. 터미널 로그 확인

개발 서버 실행 중인 터미널에서 다음을 확인:

- `[signInWithGoogle] OAuth 시작`
- `========================================`
- `[Auth Callback API] 시작`
- `Has Code: true` 또는 `false`

`Has Code: false`이면 Supabase가 코드를 제공하지 않은 것입니다 → Redirect URL 설정 문제

### 4. 브라우저 개발자 도구 확인

**Application > Cookies > `http://localhost:3000`**

- `sb-access-token` 쿠키 존재 여부
- `sb-refresh-token` 쿠키 존재 여부

## 🔧 해결 방법

1. **Supabase Redirect URLs 설정 확인 및 추가**
2. **브라우저 캐시 삭제** (`Cmd+Shift+R` 또는 `Ctrl+Shift+R`)
3. **로그인 다시 시도**
4. **터미널 로그 확인**

## 📝 추가 디버깅

터미널에 `[Auth Callback API] 시작` 로그가 나오면:

- `Has Code:` 값 확인
- `Code Length:` 값 확인
- 그 아래 나오는 모든 로그 확인

로그가 전혀 안 나오면:

- Supabase OAuth 설정 확인
- Google OAuth Provider 활성화 확인
