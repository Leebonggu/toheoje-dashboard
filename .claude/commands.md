# 자주 사용하는 명령어

## 개발

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build

# 빌드 결과 로컬 실행
npm run start
```

## 데이터 수집

```bash
# venv 활성화 (필요시)
source venv/bin/activate

# 데이터 수집 (증분)
python scripts/collect_data.py

# 건물명 추가
KAKAO_API_KEY=3b5e7f83b4e02c522a15280e26432fdc python scripts/add_building_names.py

# 실패한 요청 재수집
python scripts/backfill.py
```

## Git

```bash
# 커밋
git add .
git commit -m "feat: 기능 설명"

# 푸시
git push origin main
```

## 디버깅

```bash
# 데이터 건수 확인
python3 -c "import json; d=json.load(open('public/data/land_contract_data.json')); print(f'총: {len(d)}건')"

# 처리결과별 분포
python3 -c "
import json
from collections import Counter
d = json.load(open('public/data/land_contract_data.json'))
print(Counter(x.get('처리결과') for x in d))
"

# 자치구별 건수
python3 -c "
import json
from collections import Counter
d = json.load(open('public/data/land_contract_data.json'))
for k, v in Counter(x.get('자치구') for x in d).most_common():
    print(f'{k}: {v}건')
"
```

## API 테스트

```bash
# 서울시 API 테스트 (강남구)
curl -s -X POST "https://land.seoul.go.kr/land/wsklis/getContractList.do" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sggCd=11680&beginDate=20251015&endDate=20251115" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',[])))"

# 카카오 API 테스트
curl -s "https://dapi.kakao.com/v2/local/search/address.json?query=서울특별시+강남구+대치동+316" \
  -H "Authorization: KakaoAK 3b5e7f83b4e02c522a15280e26432fdc" | python3 -m json.tool
```
