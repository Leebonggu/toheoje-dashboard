#!/usr/bin/env python3
"""
카카오 API를 사용하여 주소에서 건물명 추출
신규 주소에 대해서만 API 호출하여 건물명 추가
"""

import requests
import pandas as pd
import json
import time
import os
from datetime import datetime

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "public", "data")

# 카카오 API 키 (환경변수에서 읽기)
KAKAO_API_KEY = os.environ.get('KAKAO_API_KEY', '')

def get_building_name(address, district):
    """주소로 건물명 조회"""
    if not KAKAO_API_KEY:
        return None

    full_addr = f'서울특별시 {district} {address.split()[0]} {" ".join(address.split()[1:])}'

    url = 'https://dapi.kakao.com/v2/local/search/address.json'
    headers = {'Authorization': f'KakaoAK {KAKAO_API_KEY}'}
    params = {'query': full_addr}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        result = response.json()

        if result.get('documents'):
            doc = result['documents'][0]
            if doc.get('road_address') and doc['road_address'].get('building_name'):
                return doc['road_address']['building_name']
    except Exception as e:
        pass

    return None

def load_building_map():
    """기존 건물명 매핑 로드"""
    map_path = os.path.join(DATA_DIR, "building_name_map.json")
    if os.path.exists(map_path):
        with open(map_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def load_manual_overrides():
    """수동 건물명 매핑 로드"""
    override_path = os.path.join(DATA_DIR, "manual_building_names.json")
    if os.path.exists(override_path):
        with open(override_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_building_map(building_map):
    """건물명 매핑 저장"""
    map_path = os.path.join(DATA_DIR, "building_name_map.json")
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(building_map, f, ensure_ascii=False, indent=2)

def main():
    print("=" * 60)
    print("건물명 추가 작업")
    print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    if not KAKAO_API_KEY:
        print("KAKAO_API_KEY 환경변수가 설정되지 않았습니다.")
        print("건물명 매핑만 적용합니다.")

    # 데이터 로드
    csv_path = os.path.join(DATA_DIR, "land_contract_data.csv")
    if not os.path.exists(csv_path):
        print(f"데이터 파일이 없습니다: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    print(f"총 데이터: {len(df):,}건")

    # 기존 건물명 매핑 로드
    building_map = load_building_map()
    print(f"기존 건물명 매핑: {len(building_map):,}개")

    # 수동 오버라이드 로드
    manual_overrides = load_manual_overrides()
    print(f"수동 건물명 매핑: {len(manual_overrides):,}개")

    # 고유 주소 추출
    df['주소키'] = df['자치구'] + '|' + df['주소']
    unique_keys = df['주소키'].unique()
    print(f"고유 주소: {len(unique_keys):,}개")

    # 새로 조회할 주소 필터링
    new_keys = [k for k in unique_keys if k not in building_map]
    print(f"신규 주소 (API 조회 필요): {len(new_keys):,}개")

    # 새 주소에 대해 API 호출
    if new_keys and KAKAO_API_KEY:
        found = 0
        for i, key in enumerate(new_keys):
            district, address = key.split('|', 1)

            if (i + 1) % 100 == 0:
                print(f"[{i+1:,}/{len(new_keys):,}] 처리중... (발견: {found}건)")

            building_name = get_building_name(address, district)
            building_map[key] = building_name

            if building_name:
                found += 1

            time.sleep(0.1)  # API 제한 방지

        print(f"\n신규 건물명 발견: {found:,}개")

        # 매핑 저장
        save_building_map(building_map)
        print("건물명 매핑 저장 완료")

    # 수동 오버라이드 적용 (우선순위 높음)
    for addr_key, building_name in manual_overrides.items():
        # 수동 매핑은 주소만으로 매칭 (자치구|주소 형식이 아님)
        for key in building_map:
            if addr_key in key:
                building_map[key] = building_name

    # 데이터에 건물명 적용
    def get_building_for_row(row):
        key = f"{row['자치구']}|{row['주소']}"
        building = building_map.get(key)

        # 수동 오버라이드 확인
        for addr_key, override_name in manual_overrides.items():
            if addr_key in row['주소']:
                return override_name

        return building

    df['건물명'] = df.apply(get_building_for_row, axis=1)
    df = df.drop(columns=['주소키'])

    # 저장
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"CSV 저장 완료")

    json_path = os.path.join(DATA_DIR, "land_contract_data.json")
    df.to_json(json_path, orient='records', force_ascii=False, indent=2)
    print(f"JSON 저장 완료")

    # 통계
    with_building = df['건물명'].notna().sum()
    total = len(df)
    print(f"\n건물명 있는 데이터: {with_building:,}건 / {total:,}건 ({with_building/total*100:.1f}%)")

if __name__ == "__main__":
    main()
