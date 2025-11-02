# HttpOnly 쿠키 마이그레이션 가이드

## 개요

AMPD는 보안 강화를 위해 localStorage 기반 토큰 저장에서 **HttpOnly 쿠키 기반 인증**으로 전환했습니다.

## 주요 변경사항

### 1. 토큰 저장 방식 변경

**이전**: localStorage에 토큰 저장 (XSS 취약)
**현재**: HttpOnly 쿠키에 토큰 저장 (XSS 보호)

### 2. 서버 사이드 인증 API

다음 API Routes가 추가되었습니다:

- `POST /api/auth/callback` - OAuth 콜백 처리 및 쿠키 저장
- `GET /api/auth/session` - 현재 세션 확인
- `POST /api/auth/logout` - 로그아웃 및 쿠키 제거
- `GET /api/auth/token` - 클라이언트용 토큰 제공

### 3. 클라이언트 사이드 변경

- `use-auth.tsx`: `onAuthStateChange` 대신 polling 사용 (30초)
- `user-context.tsx`: 서버 API 호출로 세션 확인
- `supabase.ts`: `persistSession: false`로 변경

## 환경 변수 설정

### 필수 환경 변수

`.env.local` 파일에 다음 환경 변수가 필요합니다:

```env
# 기존 변수 (그대로 유지)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 새로 추가 (서버 사이드용)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 선택사항 (권장)
```

### Supabase 서비스 롤 키

서버 사이드에서 관리자 권한이 필요한 작업을 위해 서비스 롤 키를 사용합니다.

**설정 방법:**
1. Supabase 대시보드 > Settings > API
2. `service_role` key 복사
3. `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`로 추가

⚠️ **중요**: 서비스 롤 키는 절대 클라이언트에 노출하면 안 됩니다!

## Supabase 설정 업데이트

### Redirect URLs 변경

Supabase 대시보드 > Authentication > URL Configuration에서 다음 URL을 추가하세요:

**개발 환경:**
```
http://localhost:3000/api/auth/callback
```

**프로덕션 환경:**
```
https://yourdomain.com/api/auth/callback
```

## 마이그레이션 체크리스트

- [x] 서버 사이드 Supabase 클라이언트 생성
- [x] 인증 API Routes 생성
- [x] HttpOnly 쿠키 저장 로직 구현
- [x] 클라이언트 사이드 인증 로직 업데이트
- [ ] Supabase Redirect URLs 업데이트
- [ ] 환경 변수 설정
- [ ] 테스트 (로그인, 로그아웃, 세션 확인)

## 보안 개선 효과

1. **XSS 공격 방지**: HttpOnly 쿠키는 JavaScript에서 접근 불가
2. **Secure 플래그**: HTTPS에서만 쿠키 전송
3. **SameSite 설정**: CSRF 공격 방지
4. **서버 사이드 세션 관리**: 토큰이 클라이언트에 노출되지 않음

## 참고사항

### 클라이언트 사이드 데이터베이스 쿼리

클라이언트에서 Supabase 클라이언트를 사용하여 데이터베이스 쿼리를 할 때는, 서버에서 토큰을 가져와 세션을 설정해야 합니다. 이는 `user-context.tsx`에서 자동으로 처리됩니다.

### 세션 갱신

토큰 갱신은 서버에서 처리됩니다. 클라이언트는 polling을 통해 세션 상태를 확인합니다 (30초 간격).

### 하위 호환성

기존 localStorage 기반 코드는 하위 호환성을 위해 일부 유지되지만, 실제 인증은 HttpOnly 쿠키를 사용합니다.

