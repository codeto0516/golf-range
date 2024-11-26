import { ResponseWeatherApi } from '../types/weather'

interface Props {
  lat: number
  lng: number
}

export const useWeatherApi = () => {
  const getWeather = async ({ lat, lng }: Props): Promise<ResponseWeatherApi> => {
    const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`)
    const data: ResponseWeatherApi = await response.json()
    return data
  }

  return { getWeather }
}
