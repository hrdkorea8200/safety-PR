# 한국산업인력공단 홍보미디어실 · 사무실 안전 길잡이 / 안전신문고 (GitHub Pages 버전)

QR코드로 누구나 접속해 안전수칙을 보고, 사진과 함께 안전신문고에 제보할 수 있습니다.
접수된 제보와 사진은 **관리자만** 숫자 암호로 확인·처리하고, 접수증을 출력할 수 있습니다.

## 어떻게 동작하나요

| 역할 | 담당 | 비용 |
|---|---|---|
| 화면(HTML) 공개 | **GitHub Pages** | 무료 |
| 제보·사진 저장, 관리자 로그인 | **Supabase** | 무료 플랜 |

GitHub Pages는 화면만 보여 주는 곳이라 제보를 저장할 수 없습니다. 그래서 저장은 Supabase가 맡습니다.
**누구나 제보를 "넣을 수만" 있고 "읽을 수는 없으며", 읽기·처리·삭제는 관리자 계정만 가능**하도록 Supabase 쪽에 규칙이 걸려 있습니다(`supabase/schema.sql`).

```
index.html        공개 사이트 (홈 / 안전수칙 / 비상대응 / 안전신문고)
admin.html        관리자 페이지 (하단 메뉴 "관리자" 탭)
site.config.js    ★ 사업장 정보 + Supabase 연결 값 (여기를 수정)
content.js        안전수칙·비상대응·오늘의 안전 한마디(50개) 본문
sb.js / app.js / admin.js / common.js / app.css   동작·모양
supabase/         데이터베이스 설정 SQL 3개
.github/workflows/keepalive.yml   무료 DB 자동 일시정지 방지(선택)
```

---

## 설치 순서 (처음 한 번, 약 30분)

### 1단계. Supabase 가입 · 프로젝트 만들기
1. https://supabase.com 에서 가입(GitHub 계정으로 로그인 가능)
2. **New project** → 이름 `safety-site`, 데이터베이스 비밀번호(따로 보관), **Region: Northeast Asia (Seoul)** 선택 → Create
3. 프로젝트가 준비될 때까지 1~2분 기다립니다.

### 2단계. 데이터베이스 설정 (SQL 실행)
1. 왼쪽 메뉴 **SQL Editor → New query**
2. `supabase/schema.sql` 파일 내용을 **전부 복사해 붙여넣고 Run**
3. `Success. No rows returned` 가 나오면 완료입니다. (여러 번 실행해도 안전합니다)

### 3단계. 관리자 계정 만들기
1. 왼쪽 메뉴 **Authentication → Users → Add user → Create new user**
   - Email: 관리자 이메일 (예: `safety-admin@회사도메인`) — 실제 메일이 아니어도 됩니다
   - Password: **숫자 암호 + `-safety`**  (예: 암호를 `8195`로 쓰려면 `8195-safety`)
   - **Auto Confirm User** 체크 → Create user
2. **SQL Editor → New query** 에 `supabase/add_admin.sql` 내용을 붙여넣고, 맨 위 `admin@example.com` 을 **방금 만든 이메일**로 바꾼 뒤 Run
   → 결과에 이메일이 한 줄 나오면 관리자 등록 성공입니다.
3. 권장: **Authentication → Sign In / Providers**(또는 Settings)에서 **Allow new users to sign up(회원가입 허용)을 끕니다.** 관리자 외 계정이 생기지 않게 하기 위함입니다.

> ⚠ **숫자 암호 길이에 대해**: 이 구조는 별도 서버가 없어 "N회 틀리면 잠금" 기능이 없습니다(Supabase의 시도 횟수 제한만 적용).
> 숫자 4자리(예: 8195)는 경우의 수가 1만 개뿐이라 시간을 들이면 맞힐 수 있습니다. **8자리 이상을 권장**합니다.
> 더 안전하게 쓰려면 `site.config.js`의 `ADMIN_LOGIN_MODE`를 `'password'`로 바꿔 이메일 + 긴 비밀번호로 로그인하세요.

### 4단계. 연결 값 복사해서 설정 파일에 넣기
1. Supabase 왼쪽 아래 **Project Settings → API**(또는 Data API)에서 두 값을 복사
   - **Project URL** (`https://xxxx.supabase.co`)
   - **공개 키**: `sb_publishable_…`(새 방식) 또는 `anon public`(eyJ…로 시작, 예전 방식) 중 보이는 것. `secret`/`service_role` 키는 절대 아님
2. `site.config.js` 맨 위에서 아래 4개를 바꿉니다.
   ```js
   SUPABASE_URL: 'https://xxxx.supabase.co',
   SUPABASE_ANON_KEY: '복사한 anon public 키',
   ADMIN_EMAIL: '3단계에서 만든 이메일',
   ADMIN_PIN_SUFFIX: '-safety',    // 3단계 비밀번호 뒤에 붙인 글자와 같아야 합니다
   ```
3. ⚠ **`service_role` 키는 절대 넣지 마세요.** anon 키만 공개해도 되도록 설계돼 있습니다.

### 5단계. GitHub에 올려서 공개하기
1. https://github.com 가입 → **New repository** → 이름 예: `safety-site`, **Public** 선택 → Create
   (무료 GitHub Pages는 Public 저장소에서만 쓸 수 있습니다. 코드에는 비밀 값이 없습니다.)
2. 저장소 화면에서 **uploading an existing file** (또는 Add file → Upload files)
3. 이 폴더 안의 **모든 파일과 폴더**(`.nojekyll`, `.github` 포함)를 끌어다 놓고 **Commit changes**
   - `.github` 폴더가 올라가지 않으면 6단계(선택)는 나중에 직접 만들면 됩니다.
4. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**
5. 1~3분 뒤 같은 화면 위쪽에 주소가 나타납니다.
   `https://내계정.github.io/safety-site/`  ← 이것이 사이트 주소입니다.

### 6단계. (권장) DB 자동 일시정지 방지
Supabase 무료 프로젝트는 일정 기간 사용이 없으면 자동 일시정지될 수 있어, 제보가 뜸한 사이트는 어느 날 접수가 안 될 수 있습니다.
1. GitHub 저장소 **Settings → Secrets and variables → Actions → New repository secret**
   - `SUPABASE_URL` = Project URL, `SUPABASE_ANON_KEY` = anon 키
2. **Actions** 탭에서 `Supabase keep-alive` → **Run workflow** 로 한 번 실행해 초록색 체크가 뜨는지 확인합니다. 이후 3일마다 자동 실행됩니다.
   (GitHub는 장기간 활동이 없는 저장소의 예약 실행을 멈출 수 있으니, 가끔 Actions 탭을 확인하세요.)

---

## 동작 확인 체크리스트 (꼭 해 보세요)
1. 사이트 주소 접속 → **안전신문고** 탭 → 사진 한 장 포함해 **시험 제보** 접수 (휴대폰에서 사진 촬영 포함)
2. 접수번호(`SF-…`)가 나오는지 확인
3. 하단 **관리자** 탭 → 숫자 암호 입력 → 방금 제보와 **사진이 보이는지** 확인
4. 제보 상세 → **🖨 접수증 출력** → 인쇄 미리보기 확인
5. 시험 제보 **삭제**
6. 다른 브라우저(로그인 안 한 상태)에서 `admin.html` 을 열어 **암호 없이 목록이 안 보이는지** 확인

## QR코드 만들기
- 안전신문고로 바로 열기: `https://내계정.github.io/safety-site/#report`  ← 포스터용 권장
- 홈으로 열기: `https://내계정.github.io/safety-site/`
- 위 주소를 무료 QR 생성기에 넣어 PNG/SVG로 만들어 인쇄하세요. **관리자 주소(admin.html)는 QR에 넣지 마세요.**
- 도메인(예: `safety.기관도메인`)을 연결하면 주소를 바꿔도 QR을 다시 만들 필요가 없습니다. (Settings → Pages → Custom domain)

## 내용 수정
- 사업장명·비상연락처·집결지·소화기·AED·장소 목록·개인정보 안내문: `site.config.js`
- 안전수칙·비상대응·오늘의 안전 한마디: `content.js`
- GitHub에서 파일을 열고 연필 아이콘(Edit) → 수정 → Commit changes → 1~2분 뒤 반영됩니다.

## 선택: 연락처 자동 삭제
`supabase/optional_retention.sql` — 조치완료 후 90일이 지난 제보의 이름·연락처를 매일 자동 삭제합니다. (Database → Extensions에서 `pg_cron`을 먼저 켜야 합니다. 화면의 개인정보 안내문(90일)과 맞춰져 있습니다.)

---

## 보안·운영 시 알아둘 점
- **읽기 차단은 서버(Supabase)에서 합니다.** 화면 코드에 암호나 비밀 키가 들어 있지 않습니다. 관리자 암호는 Supabase 계정 비밀번호로만 존재합니다.
- 제보 입력값은 형식·길이 검사가 서버에서 다시 이루어지고, 상태·메모·접수시각 위조는 거부/보정됩니다. 도배 방지로 **전체 시간당 200건**을 넘으면 접수가 잠시 제한됩니다.
- 사진은 **비공개 저장소**에 보관되고 관리자 로그인 후에만 볼 수 있습니다. 올리는 사진은 JPEG만, 장당 약 1.5MB 이하, 접수번호별 최대 3장입니다. 촬영 위치정보(GPS)는 화면에서 압축할 때 제거됩니다.
- **한계**: 로그인 없이 누구나 접수할 수 있는 구조라, 악의적으로 사진 파일만 대량 업로드하면 저장 공간(무료 플랜 약 1GB)을 소모시킬 수 있습니다. 문제가 생기면 Supabase 대시보드에서 정리하거나, 서버를 직접 운영하는 방식(별도 제공 Node 버전)을 검토하세요.
- 무료 플랜 한도(저장 용량·전송량·일시정지 정책)는 바뀔 수 있으니 Supabase 공식 요금 페이지에서 확인하세요.
- **개인정보**: 연락처는 선택 입력이며 동의가 있어야 저장됩니다. 서버 위치(서울 리전), 처리방침, 외부 클라우드 사용 가능 여부는 **기관 정보보안·개인정보 담당 부서 승인**을 받으세요.

## 문제 해결
| 증상 | 확인할 것 |
|---|---|
| 신문고에 "서버 연결 설정이 아직 되지 않았습니다" | 4단계 `site.config.js`의 URL/anon 키 입력 |
| 접수 시 "입력 내용을 다시 확인해 주세요" | 2단계 `schema.sql`을 실행했는지, 필수 항목 누락 여부 |
| 관리자 로그인이 계속 "암호가 올바르지 않습니다" | 3단계 비밀번호 = 숫자 암호 + `ADMIN_PIN_SUFFIX` 인지, 이메일 일치 여부 |
| "관리자 권한이 없는 계정입니다" | 3단계의 `add_admin.sql`을 실행했는지 |
| 관리자 화면에서 사진이 안 보임 | `schema.sql` 5)번 사진 저장소 설정이 적용됐는지 (재실행해도 안전) |
| 어느 날부터 접수가 안 됨 | Supabase 프로젝트 일시정지 여부 → 대시보드에서 Restore, 6단계 설정 |

## 검증 범위 (이 패키지를 만들면서 확인한 것 / 못한 것)
- 확인함: 데이터베이스 규칙(익명은 넣기만 가능·관리자만 조회/처리/삭제·위조 거부·도배 방지), 사진 저장소 규칙, 화면 전체 흐름(접수·관리자 로그인·처리·접수증·CSV·삭제)을 **Supabase를 흉내 낸 시험 환경**에서 검증했습니다.
- **확인하지 못함**: 실제 Supabase 프로젝트와의 연결, GitHub Pages 실제 배포, GitHub Actions 실행, 휴대폰 카메라 촬영·사진 압축, 실제 프린터 출력. 위 "동작 확인 체크리스트"로 꼭 직접 확인해 주세요.
