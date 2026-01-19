export interface LandContract {
  자치구: string
  주소: string
  허가일자: number
  처리결과: string
  이용목적: string
  건물명?: string
  수집일자?: string
}

export interface AddressGroup {
  count: number
  residential: number
  latestDate: string
  items: LandContract[]
  buildingName: string
}
