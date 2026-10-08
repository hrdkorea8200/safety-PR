# Supabase 무료 프로젝트가 장시간 사용이 없어 자동 일시정지되는 것을 막기 위해 3일마다 가벼운 요청을 보냅니다.
# 사용하려면: 저장소 Settings > Secrets and variables > Actions 에 SUPABASE_URL, SUPABASE_ANON_KEY 를 등록하세요.
name: Supabase keep-alive
on:
  schedule:
    - cron: '17 3 */3 * *'      # 3일마다 (UTC 기준)
  workflow_dispatch:             # 수동 실행(Actions 탭 > Run workflow)도 가능
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
            echo "SUPABASE_URL / SUPABASE_ANON_KEY 시크릿이 없어 건너뜁니다."; exit 0
          fi
          code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SUPABASE_URL/rest/v1/rpc/ping" \
            -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" -d '{}')
          echo "응답 코드: $code"
          test "$code" = "200"
