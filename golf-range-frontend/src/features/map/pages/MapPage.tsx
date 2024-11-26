"use client";
import React, { useState, memo, useEffect, useMemo, useCallback } from 'react'
import { getDistance } from 'geolib'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { demoHolePositions } from '../constants/demo-data'
import { Position } from '../types/position'
import { useElevationApi } from '../apis/useElevationApi'
import { useWeatherApi } from '../apis/useWeatherApi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const KIKKA_TOGE_POSITION: Position = {
  lat: 34.88102403391901,
  lng: 134.03095463150288,
  elevation: null,
  windDirection: null,
  windSpeed: null
}

const containerStyle = {
  width: '100vw',
  height: '100vh'
  // cursor: 'crosshair !important'
}
export const MapPage = memo(() => {
  const [mode, setMode] = useState<null | 'pin' | 'distance'>(null)
  const [currentPosition, setCurrentPosition] = useState<Position | null>(KIKKA_TOGE_POSITION)
  const [pinPositions, setPinPositions] = useState<Position[]>(demoHolePositions)
  const [holeNumber, setHoleNumber] = useState<number>(1) // 現在のホール番号

  const { getElevation } = useElevationApi()
  const { getWeather } = useWeatherApi()

  const handleUpdatePinPosition = async (pinNumber: number, position: Position) => {
    const elevationResult = await getElevation(position)
    const elevation = elevationResult.results?.[0].elevation

    const weatherResult = await getWeather(position)
    const windDirection = weatherResult.wind.deg
    const windSpeed = weatherResult.wind.speed

    setPinPositions(
      pinPositions.map((p, i) => {
        if (i === pinNumber - 1) {
          return { ...position, elevation, windDirection, windSpeed }
        }
        return p
      })
    )
  }

  // useEffect(() => {
  //     if (!navigator.geolocation) {
  //         alert("位置情報サービスが利用できません");
  //         return;
  //     }

  //     navigator.geolocation.getCurrentPosition(
  //         (position) => {
  //             setCurrentPosition({
  //                 lat: position.coords.latitude,
  //                 lng: position.coords.longitude,
  //             });
  //         },
  //         (error) => {
  //             console.error("現在地の取得に失敗しました:", error);
  //         }
  //     );
  // }, []);

  const calculateDistance = useCallback((): number | null => {
    if (currentPosition && pinPositions.length > 0) {
      const distanceInMeters = getDistance(currentPosition, pinPositions[holeNumber - 1])
      const yard = distanceInMeters / 0.9144 // ヤード単位に変換
      return Math.round(yard)
    }
    return null
  }, [currentPosition, pinPositions, holeNumber])

  const onMapClick = (position: Position) => {
    setPinPositions([...pinPositions, position])
  }

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (mode === 'pin' && event.latLng && onMapClick) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      const elevationResult = await getElevation({ lat, lng })
      const elevation = elevationResult.results?.[0].elevation

      const weatherResult = await getWeather({ lat, lng })
      console.log(weatherResult)
      const windDirection = weatherResult.wind?.deg
      const windSpeed = weatherResult.wind?.speed

      onMapClick({ lat, lng, elevation, windDirection, windSpeed })
    }
  }

  useEffect(() => {
    const mapElements = document.getElementsByClassName('gm-style')
    if (mapElements.length > 0) {
      mapElements[0].getElementsByTagName('div')[0].style.cursor = mode === 'pin' ? 'crosshair' : 'grab'
    }
  }, [mode])

  return (
    <div className='relative'>
      <div className='absolute top-16 left-4 bottom-4 z-50'>
        <div className='bg-white rounded-md w-[450px] h-[100%] p-2 overflow-y-scroll'>
          {mode === null ? (
            <button onClick={() => setMode(() => 'pin')}>ピン差しモードオン</button>
          ) : (
            <button onClick={() => setMode(() => null)}>ピン差しモードオフ</button>
          )}
          <div className='p-4'>
            <h2 className='text-lg font-bold'>距離計算</h2>
            <p>
              距離: <span className='font-bold text-4xl'>{calculateDistance()?.toLocaleString()}</span> ヤード
            </p>
          </div>

          <div className=''>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[50px]'>No</TableHead>
                  <TableHead className='w-[100px]'>緯度</TableHead>
                  <TableHead className='w-[100px]'>経度</TableHead>
                  <TableHead className='w-[150px]'>標高</TableHead>
                  <TableHead className='w-[150px]'>風向き</TableHead>
                  <TableHead className='w-[150px]'>風速</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinPositions.map((position, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{position.lat.toFixed(5)}</TableCell>
                    <TableCell>{position.lng.toFixed(5)}</TableCell>
                    <TableCell>{position.elevation?.toFixed(2)}</TableCell>
                    <TableCell>{getWindDirection(position.windDirection)}</TableCell>
                    <TableCell>{position.windSpeed ? `${position.windSpeed} m/s` : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={KIKKA_TOGE_POSITION}
          zoom={17}
          onClick={handleMapClick}
          mapTypeId='satellite'
        >
          {/* 現在地マーカー */}
          {currentPosition && (
            <Marker
              position={currentPosition}
              label='現在地'
              // icon={{
              //     path: google.maps.SymbolPath.CIRCLE, // マーカーの形状
              //     scale: 8, // マーカーの大きさ
              //     fillColor: "blue", // 塗りつぶしの色
              //     fillOpacity: 0.5, // 塗りつぶしの透明度
              //     strokeWeight: 2, // 枠線の太さ
              //     strokeColor: "white", // 枠線の色
              // }}
              draggable
              onDragEnd={e => {
                const lat = e.latLng?.lat()
                const lng = e.latLng?.lng()

                if (lat && lng) {
                  setCurrentPosition({ lat, lng })
                }
              }}
            />
          )}
          {/* ピン位置マーカー */}
          {pinPositions?.map((position, index) => (
            <Marker
              key={index}
              position={position}
              label={`${index + 1}`}
              onClick={() => {
                handleUpdatePinPosition(index + 1, position)
              }}
              draggable
              onDragEnd={e => {
                const lat = e.latLng?.lat()
                const lng = e.latLng?.lng()

                if (lat && lng) {
                  const newPinPositions = pinPositions.map((p, i) => {
                    if (i === index) {
                      return { lat, lng }
                    }
                    return p
                  })
                  handleUpdatePinPosition(index + 1, { lat, lng })
                }
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  )
})

// 風向きの解釈関数
const getWindDirection = (deg: number | null | undefined): string => {
  if (deg === null || deg === undefined) return ''
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
  const index = Math.round(deg / 45) % 8
  return directions[index]
}