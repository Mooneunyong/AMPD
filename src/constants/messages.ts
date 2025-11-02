/**
 * 메시지 및 텍스트 상수
 */

export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  AUTH_ERROR: '인증에 실패했습니다.',
  PERMISSION_DENIED: '접근 권한이 없습니다.',
  GENERIC_ERROR: '오류가 발생했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  UPDATE_SUCCESS: '업데이트되었습니다.',
  CREATE_SUCCESS: '생성되었습니다.',
  UPLOAD_SUCCESS: '업로드되었습니다.',
  EXPORT_SUCCESS: '내보내기가 완료되었습니다.',
} as const;

export const LOADING_MESSAGES = {
  INITIALIZING: '초기화 중...',
  LOADING: '로딩 중...',
  SAVING: '저장 중...',
  DELETING: '삭제 중...',
  UPLOADING: '업로드 중...',
  EXPORTING: '내보내기 중...',
  AUTHENTICATING: '인증 중...',
  FETCHING_DATA: '데이터를 가져오는 중...',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다.',
  EMAIL_INVALID: '올바른 이메일 형식이 아닙니다.',
  PASSWORD_TOO_SHORT: '비밀번호는 최소 8자 이상이어야 합니다.',
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
  URL_INVALID: '올바른 URL 형식이 아닙니다.',
  NUMBER_INVALID: '올바른 숫자 형식이 아닙니다.',
  DATE_INVALID: '올바른 날짜 형식이 아닙니다.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  FILE_TYPE_INVALID: '지원하지 않는 파일 형식입니다.',
} as const;

export const PLACEHOLDER_TEXT = {
  SEARCH: '검색어를 입력하세요...',
  EMAIL: '이메일을 입력하세요',
  PASSWORD: '비밀번호를 입력하세요',
  NAME: '이름을 입력하세요',
  DESCRIPTION: '설명을 입력하세요...',
  COMMENT: '댓글을 입력하세요...',
  SELECT_OPTION: '옵션을 선택하세요',
  SELECT_DATE: '날짜를 선택하세요',
  SELECT_FILE: '파일을 선택하세요',
} as const;
