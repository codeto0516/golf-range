export interface ResponseElevationApi {
  results: {
    elevation: number
    location: {
      lat: number
      lng: number
    }
    resolution: number
  }[]
  status: string
}
