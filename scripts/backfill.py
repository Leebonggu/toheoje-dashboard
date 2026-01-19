#!/usr/bin/env python3
"""
실패한 요청을 다시 수집하는 백필 스크립트
failed_requests.json을 읽어서 실패한 요청만 재시도
"""

import json
import os
from datetime import datetime
from collect_data import (
    get_contract_list,
    normalize_data,
    merge_data,
    save_data,
    load_existing_data,
    DATA_DIR,
    LOG_PATH
)

def load_failed_log():
    """실패 로그 로드"""
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"failed": [], "last_updated": None}

def save_failed_log(log):
    """실패 로그 저장"""
    log["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def main():
    print("=" * 60)
    print("실패한 요청 백필")
    print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 실패 로그 로드
    failed_log = load_failed_log()

    if not failed_log["failed"]:
        print("실패한 요청이 없습니다.")
        return

    print(f"실패한 요청: {len(failed_log['failed'])}건")

    # 기존 데이터 로드
    existing_data = load_existing_data()
    print(f"기존 데이터: {len(existing_data)}건")

    # 실패한 요청 재시도
    all_new_data = []
    still_failed = []

    for i, req in enumerate(failed_log["failed"]):
        print(f"\n[{i+1}/{len(failed_log['failed'])}] {req['sgg_nm']} ({req['begin_date']} ~ {req['end_date']})")

        contracts, error = get_contract_list(req['sgg_cd'], req['begin_date'], req['end_date'])

        if error:
            print(f"  ❌ 다시 실패: {error}")
            still_failed.append(req)
        else:
            print(f"  ✅ 성공: {len(contracts)}건")
            for contract in contracts:
                contract['SGG_NM'] = req['sgg_nm']
            all_new_data.extend(contracts)

    # 결과 저장
    if all_new_data:
        new_data = normalize_data(all_new_data)
        merged_data = merge_data(existing_data, new_data)
        save_data(merged_data)
        print(f"\n총 데이터: {len(merged_data)}건")

    # 실패 로그 업데이트
    if still_failed:
        failed_log["failed"] = still_failed
        save_failed_log(failed_log)
        print(f"\n⚠️  여전히 실패: {len(still_failed)}건")
    else:
        # 모두 성공하면 실패 로그 삭제
        if os.path.exists(LOG_PATH):
            os.remove(LOG_PATH)
        print("\n✅ 모든 백필 완료!")

if __name__ == "__main__":
    main()
