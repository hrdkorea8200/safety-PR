# 안전신문고 사진을 접수 후 30일이 지나면 자동으로 삭제합니다. (저장 공간이 가득 차는 것을 막습니다)
# 사용하려면: 저장소 Settings > Secrets and variables > Actions 에 아래 4개를 등록하세요.
#   SUPABASE_URL, SUPABASE_ANON_KEY  (keep-alive와 같은 값)
#   ADMIN_EMAIL, ADMIN_PASSWORD      (관리자 계정 이메일과 서버 비밀번호 = 숫자 암호 + -safety, 예: 12345678-safety)
# 제보 글·상태·조치 내용은 남기고 사진만 지우며, 보관 일수는 RETENTION_DAYS 로 바꿀 수 있습니다.
name: Photo cleanup (30 days)
on:
  schedule:
    - cron: '23 18 * * *'        # 매일 (UTC 18:23 = 한국 시간 03:23)
  workflow_dispatch:              # Actions 탭 > Run workflow 로 수동 실행 (dry_run 으로 시험 실행 가능)
    inputs:
      dry_run:
        description: '시험 실행(지우지 않고 대상만 확인)'
        type: boolean
        default: false
permissions:
  contents: read
jobs:
  purge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Purge old photos
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          RETENTION_DAYS: '30'
          DRY_RUN: ${{ github.event.inputs.dry_run == 'true' && '1' || '0' }}
        run: node scripts/purge-photos.mjs
