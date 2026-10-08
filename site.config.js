/* 이 파일에서 사업장 정보와 서버(Supabase) 연결 값을 설정합니다. */
window.SITE_CONFIG = (function(){
const CONFIG = {
  /* ===== 서버(Supabase) 연결 — README의 3~4단계에서 복사해 온 값을 넣으세요 ===== */
  SUPABASE_URL: 'https://lwiyhvixcjghiucxcont.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_JvjudDsxn0aY_maoR5n_qw_-YZkm6yP',        /* anon(eyJ…로 시작) 또는 publishable(sb_publishable_…) 공개 키. 노출되어도 되는 키입니다 */
  ADMIN_LOGIN_MODE: 'pin',                    /* 'pin' = 숫자 암호만 입력 / 'password' = 이메일+비밀번호 입력 */
  ADMIN_EMAIL: 'hrdkoreagemini@gmail.com',           /* 관리자 계정 이메일 (pin 모드에서 자동 사용) */
  ADMIN_PIN_SUFFIX: '-safety',                /* pin 모드: 서버 비밀번호 = 숫자 암호 + 이 문자 (길이 요건 충족용) */

  /* ===== 사업장 정보 ===== */
  orgName: '한국산업인력공단 홍보미디어실',
  tagline: '모두가 안전한 일터는 작은 신고와 작은 실천에서 시작됩니다.',
  assemblyPoint: '축구장',
  extinguisherLoc: '사무실 내부 및 사무실 외부 복도',
  aedLoc: '1층 화물용 엘리베이터 인근',
  contacts: [
    { label:'화재 · 구급', number:'119', tel:'119' },
    { label:'범죄 · 폭력 · 위협', number:'112', tel:'112' },
    { label:'안전관리 담당자', number:'내선 195', tel:'' },
    { label:'안전담당부서', number:'내선 795', tel:'' }
  ],
  places: ['사무공간(업무 자리)','회의실','복도 · 계단','탕비실 · 휴게실','화장실','로비 · 엘리베이터','주차장 · 출입구','촬영 현장 · 스튜디오','기타'],
  privacyNotice: '수집 항목: 이름, 연락처(선택) · 이용 목적: 제보 처리 결과 회신 · 보유 기간: 처리 완료 후 90일(이후 자동 삭제). 동의하지 않으셔도 익명으로 제보할 수 있습니다.'
};
return CONFIG;
})();
