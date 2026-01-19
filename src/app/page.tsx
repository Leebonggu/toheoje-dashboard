'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { LandContract, AddressGroup } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function formatDate(d: number | string | undefined): string {
  if (!d) return '-'
  const s = String(d)
  return s.slice(2, 4) + '.' + s.slice(4, 6) + '.' + s.slice(6, 8)
}

function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function isNewData(item: LandContract, latestCollectedDate: string): boolean {
  return item['수집일자'] === latestCollectedDate
}

export default function Home() {
  const [allData, setAllData] = useState<LandContract[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')
  const [modalData, setModalData] = useState<{ address: string; items: LandContract[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/land_contract_data.json')
      .then((res) => res.json())
      .then((data) => {
        setAllData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('데이터 로드 실패:', err)
        setLoading(false)
      })
  }, [])

  // 가장 최근 수집일자 찾기
  const latestCollectedDate = useMemo(() => {
    const dates = allData
      .map((d) => d['수집일자'])
      .filter((d): d is string => !!d)
    if (dates.length === 0) return ''
    return dates.reduce((max, d) => (d > max ? d : max), dates[0])
  }, [allData])

  // 신규 데이터 (가장 최근 수집일자 기준)
  const newData = useMemo(() => {
    if (!latestCollectedDate) return []
    return allData.filter((d) => d['수집일자'] === latestCollectedDate)
  }, [allData, latestCollectedDate])

  const summary = useMemo(() => {
    const total = allData.length
    const approved = allData.filter((d) => d['처리결과'] === '허가').length
    const residential = allData.filter((d) => d['이용목적'] === '주거용').length
    const districtCounts: Record<string, number> = {}
    allData.forEach((d) => {
      districtCounts[d['자치구']] = (districtCounts[d['자치구']] || 0) + 1
    })
    const sorted = Object.entries(districtCounts).sort((a, b) => b[1] - a[1])
    const topDistrict = sorted[0]?.[0] || '-'
    return { total, approved, residential, topDistrict, districtCounts, sortedDistricts: sorted }
  }, [allData])

  const currentDistrictData = useMemo(() => {
    if (!selectedDistrict) return []
    return allData.filter((d) => d['자치구'] === selectedDistrict)
  }, [allData, selectedDistrict])

  const districtSummary = useMemo(() => {
    const data = currentDistrictData
    const total = data.length
    const approved = data.filter((d) => d['처리결과'] === '허가').length
    const residential = data.filter((d) => d['이용목적'] === '주거용').length
    const uniqueAddresses = new Set(data.map((d) => d['주소']?.trim())).size
    return { total, approved, residential, uniqueAddresses }
  }, [currentDistrictData])

  const addressGroups = useMemo(() => {
    const groups: Record<string, AddressGroup & { hasNew: boolean }> = {}
    currentDistrictData.forEach((d) => {
      const addr = d['주소']?.trim() || '-'
      if (!groups[addr]) {
        groups[addr] = {
          count: 0,
          residential: 0,
          latestDate: '',
          items: [],
          buildingName: d['건물명'] || '',
          hasNew: false,
        }
      }
      groups[addr].count++
      groups[addr].items.push(d)
      if (d['이용목적'] === '주거용') groups[addr].residential++
      const date = String(d['허가일자'])
      if (date > groups[addr].latestDate) groups[addr].latestDate = date
      if (d['건물명'] && !groups[addr].buildingName) groups[addr].buildingName = d['건물명']
      if (isNewData(d, latestCollectedDate)) groups[addr].hasNew = true
    })
    return Object.entries(groups).sort((a, b) => b[1].count - a[1].count)
  }, [currentDistrictData, latestCollectedDate])

  const monthlyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allData.forEach((d) => {
      const month = String(d['허가일자']).slice(0, 6)
      counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))
  }, [allData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">데이터 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">서울시 토지거래허가 현황</h1>
        <p className="text-gray-600 mt-2">
          2024.10.15 ~ 현재 | 총 <span className="font-bold text-blue-600">{summary.total.toLocaleString()}</span>건
          {newData.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded text-sm">
              오늘 +{newData.length}건
            </span>
          )}
        </p>
      </header>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">총 거래</p>
          <p className="text-xl font-bold">{summary.total.toLocaleString()}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">허가율</p>
          <p className="text-xl font-bold text-green-600">
            {summary.total > 0 ? ((summary.approved / summary.total) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">주거용</p>
          <p className="text-xl font-bold text-blue-600">{summary.residential.toLocaleString()}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">1위 자치구</p>
          <p className="text-xl font-bold text-purple-600">{summary.topDistrict}</p>
        </div>
      </div>

      {/* 신규 데이터 섹션 */}
      {newData.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 border-l-4 border-red-500">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              신규 데이터
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded text-sm font-normal">
                {newData.length}건
              </span>
            </h2>
            <span className="text-sm text-gray-500">
              수집일: {formatDate(latestCollectedDate)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left whitespace-nowrap">No</th>
                  <th className="px-3 py-2 text-left">자치구</th>
                  <th className="px-3 py-2 text-left">주소</th>
                  <th className="px-3 py-2 text-left">건물명</th>
                  <th className="px-3 py-2 text-left">허가일</th>
                  <th className="px-3 py-2 text-left">결과</th>
                  <th className="px-3 py-2 text-left">목적</th>
                </tr>
              </thead>
              <tbody>
                {newData
                  .sort((a, b) => String(b['허가일자']).localeCompare(String(a['허가일자'])))
                  .slice(0, 50)
                  .map((d, i) => (
                    <tr key={i} className={`border-b hover:bg-gray-50 ${d['건물명'] ? 'bg-yellow-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">{d['자치구']}</td>
                      <td className="px-3 py-2">{d['주소'] || '-'}</td>
                      <td className={`px-3 py-2 ${d['건물명'] ? 'text-blue-600 font-medium' : 'text-gray-300'}`}>
                        {d['건물명'] || '-'}
                      </td>
                      <td className="px-3 py-2">{formatDate(d['허가일자'])}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            d['처리결과'] === '허가' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {d['처리결과'] || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{d['이용목적'] || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {newData.length > 50 && (
              <div className="p-3 text-center text-gray-500 text-sm">
                외 {newData.length - 50}건 더...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">자치구별 거래 현황</h2>
          <Bar
            data={{
              labels: summary.sortedDistricts.map((d) => d[0]),
              datasets: [
                {
                  data: summary.sortedDistricts.map((d) => d[1]),
                  backgroundColor: 'rgba(59, 130, 246, 0.7)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">월별 추이</h2>
          <Line
            data={{
              labels: monthlyCounts.map((m) => m[0].slice(2, 4) + '.' + m[0].slice(4)),
              datasets: [
                {
                  data: monthlyCounts.map((m) => m[1]),
                  borderColor: 'rgba(34, 197, 94, 1)',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>

      {/* 자치구 선택 탭 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">자치구별 상세 데이터</h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {summary.sortedDistricts.map(([name, count]) => (
            <button
              key={name}
              onClick={() => {
                setSelectedDistrict(name)
                setViewMode('grouped')
              }}
              className={`px-3 py-2 rounded border text-sm transition ${
                selectedDistrict === name
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {name} <span className="text-gray-400">({count.toLocaleString()})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 자치구 데이터 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {selectedDistrict || '자치구를 선택하세요'}
            </h2>
            {selectedDistrict && (
              <span className="text-sm text-gray-500">총 {districtSummary.total.toLocaleString()}건</span>
            )}
          </div>
          {selectedDistrict && (
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'grouped' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                주소별 집계
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                전체 목록
              </button>
            </div>
          )}
        </div>

        {/* 자치구 요약 */}
        {selectedDistrict && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">거래건수</p>
              <p className="font-bold">{districtSummary.total.toLocaleString()}건</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">허가</p>
              <p className="font-bold text-green-600">
                {districtSummary.approved.toLocaleString()}건 (
                {districtSummary.total > 0
                  ? ((districtSummary.approved / districtSummary.total) * 100).toFixed(1)
                  : 0}
                %)
              </p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">주거용</p>
              <p className="font-bold text-blue-600">{districtSummary.residential.toLocaleString()}건</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">거래 주소 수</p>
              <p className="font-bold text-purple-600">{districtSummary.uniqueAddresses.toLocaleString()}개</p>
            </div>
          </div>
        )}

        {/* 데이터 테이블 */}
        <div className="overflow-x-auto">
          {viewMode === 'grouped' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left whitespace-nowrap w-14">순위</th>
                  <th className="px-3 py-2 text-left">주소</th>
                  <th className="px-3 py-2 text-left">건물명</th>
                  <th className="px-3 py-2 text-right w-20">거래건수</th>
                  <th className="px-3 py-2 text-left w-28">최근거래</th>
                  <th className="px-3 py-2 text-left w-20">주거용</th>
                </tr>
              </thead>
              <tbody>
                {!selectedDistrict ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                      자치구를 선택하면 데이터가 표시됩니다
                    </td>
                  </tr>
                ) : (
                  addressGroups.map(([addr, data], i) => (
                    <tr
                      key={addr}
                      className={`border-b hover:bg-gray-50 ${data.buildingName ? 'bg-yellow-50' : ''} ${
                        data.count > 1 ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (data.count > 1) {
                          setModalData({ address: addr, items: data.items })
                        }
                      }}
                    >
                      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                        {i + 1}
                        {data.hasNew && (
                          <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded">신규</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {addr}
                        {data.count > 1 && (
                          <span className="ml-2 text-blue-500 text-xs">클릭하여 상세보기</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 ${data.buildingName ? 'text-blue-600 font-medium' : 'text-gray-300'}`}>
                        {data.buildingName || '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`font-bold ${
                            data.count >= 10 ? 'text-red-500' : data.count >= 5 ? 'text-orange-500' : ''
                          }`}
                        >
                          {data.count}
                        </span>
                        건
                      </td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(data.latestDate)}</td>
                      <td className="px-3 py-2">
                        {data.residential > 0 ? (
                          <span className="text-blue-600">{data.residential}건</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left whitespace-nowrap">No</th>
                  <th className="px-3 py-2 text-left">주소</th>
                  <th className="px-3 py-2 text-left">건물명</th>
                  <th className="px-3 py-2 text-left">허가일</th>
                  <th className="px-3 py-2 text-left">결과</th>
                  <th className="px-3 py-2 text-left">목적</th>
                </tr>
              </thead>
              <tbody>
                {!selectedDistrict ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                      자치구를 선택하면 데이터가 표시됩니다
                    </td>
                  </tr>
                ) : (
                  [...currentDistrictData]
                    .sort((a, b) => String(b['허가일자']).localeCompare(String(a['허가일자'])))
                    .map((d, i) => (
                      <tr key={i} className={`border-b hover:bg-gray-50 ${d['건물명'] ? 'bg-yellow-50' : ''}`}>
                        <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                          {i + 1}
                          {isNewData(d, latestCollectedDate) && (
                            <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded">신규</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{d['주소'] || '-'}</td>
                        <td className={`px-3 py-2 ${d['건물명'] ? 'text-blue-600 font-medium' : 'text-gray-300'}`}>
                          {d['건물명'] || '-'}
                        </td>
                        <td className="px-3 py-2">{formatDate(d['허가일자'])}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              d['처리결과'] === '허가' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {d['처리결과'] || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{d['이용목적'] || '-'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 모달 */}
      {modalData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalData(null)
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg">
                  {modalData.address}
                  {modalData.items[0]?.['건물명'] && ` (${modalData.items[0]['건물명']})`}
                </h3>
                <p className="text-sm text-gray-500">총 {modalData.items.length}건의 거래</p>
              </div>
              <button onClick={() => setModalData(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                &times;
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">No</th>
                    <th className="px-3 py-2 text-left">허가일</th>
                    <th className="px-3 py-2 text-left">결과</th>
                    <th className="px-3 py-2 text-left">목적</th>
                  </tr>
                </thead>
                <tbody>
                  {[...modalData.items]
                    .sort((a, b) => String(b['허가일자']).localeCompare(String(a['허가일자'])))
                    .map((d, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-3 py-2 text-gray-400">
                          {i + 1}
                          {isNewData(d, latestCollectedDate) && (
                            <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded">신규</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{formatDate(d['허가일자'])}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              d['처리결과'] === '허가' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {d['처리결과'] || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{d['이용목적'] || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
