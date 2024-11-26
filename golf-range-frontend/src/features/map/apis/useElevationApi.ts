import { ResponseElevationApi } from '../types/elevation'

interface Props {
  lat: number
  lng: number
}

export const useElevationApi = () => {
  const getElevation = async ({ lat, lng }: Props): Promise<ResponseElevationApi> => {
    const response = await fetch(`/api/elevation?lat=${lat}&lng=${lng}`)
    const data: ResponseElevationApi = await response.json()
    return data
  }

  return { getElevation }
}
