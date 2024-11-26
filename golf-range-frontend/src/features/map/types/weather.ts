export interface ResponseWeatherApi {
  coord: {
    lon: number // 経度
    lat: number // 緯度
  }
  weather: {
    id: number // 気象条件ID
    main: string // 主な気象条件 (例: Rain)
    description: string // 詳細な説明 (例: moderate rain)
    icon: string // アイコンコード
  }[]
  base: string // ステーションタイプ情報
  main: {
    temp: number // 現在の気温 (ケルビン)
    feels_like: number // 体感温度 (ケルビン)
    temp_min: number // 最低気温 (ケルビン)
    temp_max: number // 最高気温 (ケルビン)
    pressure: number // 気圧 (hPa)
    humidity: number // 湿度 (%)
    sea_level?: number // 海面気圧 (hPa) (オプショナル)
    grnd_level?: number // 地上気圧 (hPa) (オプショナル)
  }
  visibility: number // 視界 (メートル)
  wind: {
    speed: number // 風速 (m/s)
    deg: number // 風向き (度)
    gust?: number // 突風の速度 (m/s) (オプショナル)
  }
  rain?: {
    '1h'?: number // 過去1時間の降水量 (mm) (オプショナル)
    '3h'?: number // 過去3時間の降水量 (mm) (オプショナル)
  }
  clouds: {
    all: number // 雲量 (%)
  }
  dt: number // データ計測時刻 (Unix時間)
  sys: {
    type: number // システムタイプ
    id: number // システムID
    country: string // 国コード
    sunrise: number // 日の出時刻 (Unix時間)
    sunset: number // 日没時刻 (Unix時間)
  }
  timezone: number // タイムゾーン (秒)
  id: number // 都市ID
  name: string // 都市名
  cod: number // HTTPステータスコード
}
