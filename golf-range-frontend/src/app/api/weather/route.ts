import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams
  const lat = params.get('lat')
  const lng = params.get('lng')

  // 必要なパラメータが提供されているか確認
  if (!lat || !lng) {
    return new NextResponse('Latitude and longitude are required.', { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY

  // OpenWeatherMap API URLを構築
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return new NextResponse('Failed to fetch elevation data', { status: response.status })
    }

    const data = await response.json() // 型を指定
    return NextResponse.json(data) // 型に基づいたJSONレスポンス
  } catch (error) {
    console.error('Elevation API error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
