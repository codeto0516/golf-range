export type Position = {
  lat: number
  lng: number
  elevation?: number | null
  /**
   * 風向き
   */
  windDirection?: number | null
  /**
   * 風速
   */
  windSpeed?: number | null
}
