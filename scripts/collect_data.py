#!/usr/bin/env python3
"""
서울시 토지거래허가 데이터 수집 스크립트
GitHub Actions에서 매일 자동 실행
- 재시도 로직 (3회)
- 실패 로그 파일 기록
"""

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time
import os

# API 엔드포인트
BASE_URL = "https://land.seoul.go.kr"
SGG_LIST_URL = f"{BASE_URL}/land/common/getSggList.do"
CONTRACT_LIST_URL = f"{BASE_URL}/land/wsklis/getContractList.do"

# 헤더 설정
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "public", "data")
LOG_PATH = os.path.join(DATA_DIR, "failed_requests.json")

# 재시도 설정
MAX_RETRIES = 3
RETRY_DELAY = 5  # 초

def load_failed_log():
    """실패 로그 로드"""
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"failed": [], "last_updated": None}

def save_failed_log(log):
    """실패 로그 저장"""
    log["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def add_failed_request(log, sgg_cd, sgg_nm, begin_date, end_date, error):
    """실패한 요청 기록"""
    log["failed"].append({
        "sgg_cd": sgg_cd,
        "sgg_nm": sgg_nm,
        "begin_date": begin_date,
        "end_date": end_date,
        "error": str(error),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

def get_sgg_list():
    """서울시 자치구 목록 조회 (재시도 포함)"""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(SGG_LIST_URL, headers=HEADERS, timeout=30)
            data = response.json()
            return [sgg for sgg in data['result'] if sgg['sggCd'] != '11000']
        except Exception as e:
            print(f"  자치구 목록 조회 실패 (시도 {attempt + 1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
    return None

def get_contract_list(sgg_cd, begin_date, end_date):
    """특정 자치구, 기간의 토지거래허가 목록 조회 (재시도 포함)"""
    data = {
        "sggCd": sgg_cd,
        "beginDate": begin_date,
        "endDate": end_date
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(CONTRACT_LIST_URL, headers=HEADERS, data=data, timeout=30)
            result = response.json()
            return result.get('result', []), None
        except Exception as e:
            print(f"  재시도 {attempt + 1}/{MAX_RETRIES}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)

    return [], f"Failed after {MAX_RETRIES} attempts"

def generate_date_ranges(start_date, end_date, max_days=60):
    """62일 제한에 맞게 날짜 범위를 분할"""
    ranges = []
    current = start_date
    while current < end_date:
        range_end = min(current + timedelta(days=max_days), end_date)
        ranges.append((
            current.strftime("%Y%m%d"),
            range_end.strftime("%Y%m%d")
        ))
        current = range_end + timedelta(days=1)
    return ranges

def load_existing_data():
    """기존 데이터 로드"""
    json_path = os.path.join(DATA_DIR, "land_contract_data.json")
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def get_last_date(data):
    """기존 데이터에서 가장 최근 날짜 반환"""
    if not data:
        return None
    dates = [d.get('허가일자') or d.get('HNDL_YMD') for d in data if d.get('허가일자') or d.get('HNDL_YMD')]
    if dates:
        return max(dates)
    return None

def collect_data(start_date, end_date, failed_log):
    """데이터 수집"""
    print(f"수집 기간: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}")

    sgg_list = get_sgg_list()
    if sgg_list is None:
        print("자치구 목록 조회 실패!")
        return []

    print(f"자치구 수: {len(sgg_list)}개")

    date_ranges = generate_date_ranges(start_date, end_date)
    print(f"날짜 범위 수: {len(date_ranges)}개")

    all_data = []
    total_requests = len(sgg_list) * len(date_ranges)
    current_request = 0
    failed_count = 0

    for sgg in sgg_list:
        sgg_cd = sgg['sggCd']
        sgg_nm = sgg['sggNm']

        for begin_date, end_date_str in date_ranges:
            current_request += 1
            print(f"[{current_request}/{total_requests}] {sgg_nm} ({begin_date} ~ {end_date_str})")

            contracts, error = get_contract_list(sgg_cd, begin_date, end_date_str)

            if error:
                failed_count += 1
                add_failed_request(failed_log, sgg_cd, sgg_nm, begin_date, end_date_str, error)
                print(f"  ❌ 실패: {error}")
            else:
                for contract in contracts:
                    contract['SGG_NM'] = sgg_nm
                all_data.extend(contracts)
                if contracts:
                    print(f"  -> {len(contracts)}건")

            time.sleep(0.3)

    if failed_count > 0:
        print(f"\n⚠️  실패한 요청: {failed_count}건 (failed_requests.json 확인)")

    return all_data

def normalize_data(raw_data):
    """원시 데이터를 정규화된 형식으로 변환"""
    column_mapping = {
        'ADDRESS': '주소',
        'SGG_NM': '자치구',
        'SGG_CD': '자치구코드',
        'HNDL_YMD': '허가일자',
        'JOB_GBN_NM': '처리결과',
        'USE_PURP': '이용목적',
        'JIMOK': '지목',
        'BOBN': '본번',
        'BUBN': '부번',
        'DEAL_END_YMD': '이용의무종료일',
        'EXEC_YMD': '집행일자',
        'ACC_YEAR': '접수년도',
        'ACC_NO': '접수번호',
        'LAND_GBN': '토지구분',
        'LAWD_CD': '법정동코드',
        'LAWD_JIMOK': '지목코드',
        'DCSN_GBN': '결정구분',
        'USE_PURP_CD': '이용목적코드',
        'JOB_GBN': '처리구분',
        'OBJ_SEQNO': '물건순번'
    }

    normalized = []
    for item in raw_data:
        new_item = {}
        for old_key, new_key in column_mapping.items():
            if old_key in item:
                new_item[new_key] = item[old_key]
        for key in item:
            if key in column_mapping.values():
                new_item[key] = item[key]
        normalized.append(new_item)

    return normalized

def create_unique_key(item):
    """중복 체크를 위한 고유 키 생성"""
    return f"{item.get('자치구', '')}|{item.get('주소', '')}|{item.get('허가일자', '')}|{item.get('접수번호', '')}"

def merge_data(existing, new_data):
    """기존 데이터와 새 데이터 병합 (중복 제거)"""
    existing_keys = set(create_unique_key(item) for item in existing)

    added = 0
    for item in new_data:
        key = create_unique_key(item)
        if key not in existing_keys:
            existing.append(item)
            existing_keys.add(key)
            added += 1

    print(f"새로 추가된 데이터: {added}건")
    return existing

def save_data(data):
    """데이터 저장"""
    os.makedirs(DATA_DIR, exist_ok=True)

    # CSV 저장
    df = pd.DataFrame(data)
    csv_path = os.path.join(DATA_DIR, "land_contract_data.csv")
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"CSV 저장: {csv_path}")

    # JSON 저장
    json_path = os.path.join(DATA_DIR, "land_contract_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"JSON 저장: {json_path}")

    return df

def main():
    print("=" * 60)
    print("서울시 토지거래허가 데이터 수집")
    print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 실패 로그 초기화 (새 실행마다 리셋)
    failed_log = {"failed": [], "last_updated": None}

    # 기존 데이터 로드
    existing_data = load_existing_data()
    print(f"기존 데이터: {len(existing_data)}건")

    # 수집 시작 날짜 결정
    last_date = get_last_date(existing_data)
    if last_date:
        start_date = datetime.strptime(str(last_date), "%Y%m%d") + timedelta(days=1)
        print(f"증분 수집 모드: {last_date} 이후 데이터")
    else:
        start_date = datetime(2024, 10, 15)
        print("전체 수집 모드: 2024.10.15부터")

    end_date = datetime.now()

    if start_date >= end_date:
        print("수집할 새 데이터가 없습니다.")
        return

    # 데이터 수집
    new_raw_data = collect_data(start_date, end_date, failed_log)

    # 실패 로그 저장 (실패가 있을 경우에만)
    if failed_log["failed"]:
        save_failed_log(failed_log)

    if new_raw_data:
        new_data = normalize_data(new_raw_data)
        merged_data = merge_data(existing_data, new_data)
        df = save_data(merged_data)
        print(f"\n총 데이터: {len(merged_data)}건")
    else:
        print("새로 수집된 데이터가 없습니다.")

if __name__ == "__main__":
    main()
