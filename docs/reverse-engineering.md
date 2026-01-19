# 서울시 토지거래허가 데이터 수집 역설계서

## 개요

서울시 부동산정보광장(land.seoul.go.kr)은 토지거래허가 현황을 공식 API로 제공하지 않음. 웹사이트 내부 통신을 분석하여 데이터 수집 엔드포인트를 역설계함.

## 1. 엔드포인트 발견 과정

### 1.1 분석 대상
- URL: https://land.seoul.go.kr
- 메뉴: 토지거래허가 > 허가현황 조회

### 1.2 분석 방법
1. Chrome DevTools > Network 탭 열기
2. 조회 버튼 클릭
3. XHR/Fetch 요청 필터링
4. `getContractList.do` 요청 발견

### 1.3 발견된 엔드포인트
```
POST https://land.seoul.go.kr/land/wsklis/getContractList.do
```

## 2. 요청 분석

### 2.1 Request Headers
```http
POST /land/wsklis/getContractList.do HTTP/1.1
Host: land.seoul.go.kr
Content-Type: application/x-www-form-urlencoded
```

### 2.2 Request Body (Form Data)
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `sggCd` | 자치구 코드 | 11680 (강남구) |
| `beginDate` | 조회 시작일 | 20251015 |
| `endDate` | 조회 종료일 | 20251115 |

### 2.3 자치구 코드 매핑
```python
DISTRICT_CODES = {
    "11110": "종로구",
    "11140": "중구",
    "11170": "용산구",
    "11200": "성동구",
    "11215": "광진구",
    "11230": "동대문구",
    "11260": "중랑구",
    "11290": "성북구",
    "11305": "강북구",
    "11320": "도봉구",
    "11350": "노원구",
    "11380": "은평구",
    "11410": "서대문구",
    "11440": "마포구",
    "11470": "양천구",
    "11500": "강서구",
    "11530": "구로구",
    "11545": "금천구",
    "11560": "영등포구",
    "11590": "동작구",
    "11620": "관악구",
    "11650": "서초구",
    "11680": "강남구",
    "11710": "송파구",
    "11740": "강동구",
}
```

## 3. 응답 분석

### 3.1 Response Format
```json
{
  "result": [
    {
      "SGG_NM": "강남구",
      "BJDONG_NM": "대치동",
      "BOBN": "316",
      "BUBN": "",
      "POSESN_SE_NM": "단독",
      "PRCUSE_NM": "주거용",
      "RCEPT_DE": "20251101",
      "PROCESS_DE": "20251105",
      "PROCESS_RSLT_NM": "허가"
    }
  ]
}
```

### 3.2 필드 매핑
| API 필드 | 의미 | 변환 후 |
|----------|------|---------|
| SGG_NM | 자치구명 | 자치구 |
| BJDONG_NM | 법정동명 | (주소에 포함) |
| BOBN | 본번 | (주소에 포함) |
| BUBN | 부번 | (주소에 포함) |
| POSESN_SE_NM | 소유형태 | - |
| PRCUSE_NM | 이용목적 | 이용목적 |
| RCEPT_DE | 접수일자 | - |
| PROCESS_DE | 처리일자 | 허가일자 |
| PROCESS_RSLT_NM | 처리결과 | 처리결과 |

## 4. 제한사항 발견

### 4.1 조회 기간 제한
- **최대 62일**까지만 한 번에 조회 가능
- 초과 시 빈 배열 반환 (에러 없음)

### 4.2 우회 방법
```python
# 62일 단위로 청크 분할
def get_date_chunks(start_date, end_date, chunk_days=60):
    chunks = []
    current = start_date
    while current < end_date:
        chunk_end = min(current + timedelta(days=chunk_days), end_date)
        chunks.append((current, chunk_end))
        current = chunk_end + timedelta(days=1)
    return chunks
```

### 4.3 Rate Limiting
- 명시적 제한 없음
- 안전을 위해 요청 간 0.5초 딜레이 적용

## 5. 데이터 정규화

### 5.1 주소 생성
```python
def build_address(row):
    address = f"{row['SGG_NM']} {row['BJDONG_NM']} {row['BOBN']}"
    if row.get('BUBN'):
        address += f"-{row['BUBN']}"
    return address
```

### 5.2 중복 제거
- 키: `자치구 + 주소 + 허가일자 + 처리결과`
- 동일 키 존재 시 신규 데이터로 덮어쓰기

## 6. 건물명 Enrichment

### 6.1 문제
- API 응답에 건물명(아파트명) 없음
- 지번 주소만으로는 어떤 아파트인지 알 수 없음

### 6.2 해결: 카카오 주소 검색 API
```
GET https://dapi.kakao.com/v2/local/search/address.json
?query=서울특별시+강남구+대치동+316
```

### 6.3 응답에서 건물명 추출
```python
def get_building_name(address):
    response = requests.get(
        "https://dapi.kakao.com/v2/local/search/address.json",
        params={"query": f"서울특별시 {address}"},
        headers={"Authorization": f"KakaoAK {API_KEY}"}
    )
    data = response.json()
    if data.get("documents"):
        road_address = data["documents"][0].get("road_address")
        if road_address:
            return road_address.get("building_name", "")
    return ""
```

### 6.4 캐싱
- 동일 주소 중복 호출 방지
- `building_name_map.json`에 매핑 결과 저장
- 카카오 API 실패 시 `manual_building_names.json`에서 수동 오버라이드

## 7. 수집 아키텍처

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Actions │────▶│  collect_data.py │────▶│  서울시 API     │
│  (매일 09:00)   │     │                  │     │  (25개 자치구)  │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ add_building_    │────▶│  카카오 API     │
                        │ names.py         │     │  (주소 검색)    │
                        └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  land_contract_  │
                        │  data.json       │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Git Commit &    │
                        │  Push            │
                        └──────────────────┘
```

## 8. 에러 처리

### 8.1 재시도 로직
```python
def fetch_with_retry(url, data, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(url, data=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

### 8.2 실패 로깅
- 실패한 요청은 `failed_requests.json`에 기록
- `backfill.py`로 재수집 가능

## 9. 한계점

1. **비공식 API**: 서울시에서 엔드포인트 변경 시 수집 불가
2. **과거 데이터 누락**: API가 일부 과거 데이터만 반환
3. **건물명 정확도**: 카카오 API가 정확한 건물명 반환하지 않는 경우 있음
4. **실시간성 없음**: 하루 1회 배치 수집

## 10. 참고

- 분석일: 2025년 10월
- 서울시 부동산정보광장: https://land.seoul.go.kr
- 카카오 주소 검색 API: https://developers.kakao.com/docs/latest/ko/local/dev-guide
