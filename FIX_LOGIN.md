# 로그인 문제 해결 가이드

## 문제 진단

HttpOnly 쿠키로 전환 후 로그인이 안 되는 경우, 다음을 확인하세요:

## 1. Supabase Redirect URLs 업데이트 필수

Supabase 대시보드에서 Redirect URLs를 업데이트해야 합니다:

1. Supabase 대시보드 > Authentication > URL Configuration
2. Redirect URLs에 다음 URL 추가:
   - 개발 환경: `http://localhost:3000/api/auth/callback`
   - 프로덕션: `https://yourdomain.com/api/auth/callback`

⚠️ **중요**: 이전 URL (`/auth/callback`)은 제거하거나 유지해도 되지만, **반드시 `/api/auth/callback`을 추가**해야 합니다.

## 2. 환경 변수 확인

`.env.local` 파일에 다음 변수가 올바르게 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 개발 환경
# 또는 프로덕션: NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 3. 서버 로그 확인

터미널에서 서버 로그를 확인하여 다음 메시지들을 확인하세요:

- `[Auth Callback] 시작:` - 콜백 API가 호출되었는지 확인
- `[Auth Callback] 세션 교환 시도...` - 세션 교환이 시작되었는지 확인
- `[Auth Callback] 쿠키 저장 시도...` - 쿠키 저장이 시도되었는지 확인
- `[Auth Callback] 성공!` - 성공적으로 완료되었는지 확인

에러가 있으면:
- `[Auth Callback] OAuth 에러:` - OAuth 제공자에서 에러 발생
- `[Auth Callback] 인증 코드 없음` - 코드 파라미터가 없음
- `[Auth Callback] 세션 교환 실패:` - 세션 교환 실패
- `[Auth Callback] 토큰 없음:` - 토큰이 제공되지 않음

## 4. 브라우저 개발자 도구 확인

1. **Network 탭**: 
   - `/api/auth/callback` 요청이 있는지 확인
   - 응답 상태 코드 확인 (200, 302 등)
   - 에러 메시지 확인

2. **Application 탭 > Cookies**:
   - `sb-access-token` 쿠키가 있는지 확인
   - `sb-refresh-token` 쿠키가 있는지 확인
   - 쿠키의 HttpOnly 플래그가 설정되어 있는지 확인 (JavaScript에서 접근 불가)

3. **Console 탭**:
   - 클라이언트 사이드 에러 메시지 확인

## 5. 일반적인 문제 해결

### 문제: "인증 코드가 제공되지 않았습니다"

**원인**: Supabase Redirect URLs에 `/api/auth/callback`이 추가되지 않음

**해결**: Supabase 대시보드에서 Redirect URLs 업데이트

### 문제: "세션 교환에 실패했습니다"

**원인**: 
- 인증 코드가 만료됨
- Supabase 설정 문제

**해결**:
1. 다시 로그인 시도
2. Supabase 대시보드에서 OAuth 설정 확인

### 문제: "토큰을 받아오지 못했습니다"

**원인**: Supabase 세션에 토큰이 포함되지 않음

**해결**: 
1. Supabase 클라이언트 버전 확인
2. Supabase 프로젝트 상태 확인

### 문제: 로그인 후에도 인증되지 않음

**원인**: 쿠키가 제대로 설정되지 않음

**해결**:
1. 브라우저 개발자 도구에서 쿠키 확인
2. SameSite 설정 확인 (현재: `lax`)
3. Secure 플래그 확인 (프로덕션에서는 `true`)

## 6. 임시 해결 방법

만약 위의 방법으로 해결되지 않으면:

1. **브라우저 캐시 및 쿠키 삭제**
2. **시크릿/프라이빗 모드에서 테스트**
3. **개발 서버 재시작**: `bun dev` 또는 `npm run dev`

## 7. 디버깅 모드 활성화

서버 로그에서 더 자세한 정보를 확인할 수 있습니다. 이미 다음 로그가 추가되어 있습니다:

- 콜백 시작
- 세션 교환 시도
- 쿠키 저장 시도
- 성공 또는 에러

터미널에서 이러한 로그를 확인하여 문제 지점을 파악하세요.

