'use client'
import React, { useState, memo, useEffect, useCallback, useMemo } from 'react'
import { getDistance } from 'geolib'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { demoHolePositions } from '../constants/demo-data'
import { Position } from '../types/position'
import { useElevationApi } from '../apis/useElevationApi'
import { useWeatherApi } from '../apis/useWeatherApi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const containerStyle = {
  width: '100vw',
  height: '100vh'
}
const KIKKA_TOGE_POSITION: Position = {
  lat: 34.88102403391901,
  lng: 134.03095463150288
  // elevation: 219.27,
}
const EARTH_RADIUS = 6371e3 // 地球の半径 (m)
const YARD_CONVERSION = 0.9144 // ヤードへの変換係数

const getWindDirection = (deg: number | null | undefined): string => {
  if (deg === null || deg === undefined) return ''
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
  const index = Math.round(deg / 45) % 8
  return directions[index]
}

// クラブ提案の例
const suggestClub = (distance: number | null): string => {
  if (distance === null) return ''
  if (distance < 10) return 'パター'
  if (distance < 90) return 'ウェッジ56度'
  if (distance < 100) return 'ウェッジ52度'
  if (distance < 110) return 'ウェッジ48度'
  if (distance < 120) return 'ピッチングウェッジ'
  if (distance < 130) return '9番アイアン'
  if (distance < 140) return '8番アイアン'
  if (distance < 150) return '7番アイアン'
  if (distance < 160) return '6番アイアン'
  if (distance < 170) return '4番ユーティリティ'
  if (distance < 180) return '5番ウッド'
  return 'ドライバー'
}

interface DisplayInfo {
  distance: number | null
  elevationDiff: number | null
  elevationEffect: number | null
  windEffect: number | null
  crossWindEffect: string | null
  club: string | null
}

export const MapPage = memo(() => {
  const [mode, setMode] = useState<null | 'pin' | 'distance'>(null)
  const [currentPosition, setCurrentPosition] = useState<Position | null>(KIKKA_TOGE_POSITION)
  const [pinPositions, setPinPositions] = useState<Position[]>(demoHolePositions)
  const [holeNumber, setHoleNumber] = useState<number>(1)

  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>({
    distance: null,
    elevationDiff: null,
    elevationEffect: null,
    windEffect: null,
    crossWindEffect: null,
    club: null
  })

  const { getElevation } = useElevationApi()
  const { getWeather } = useWeatherApi()

  const onClickHoleMarker = async (index: number, position: Position) => {
    const elevationResult = await getElevation(position)
    const elevation = elevationResult?.results[0]?.elevation

    const weatherResult = await getWeather(position)
    const weather = {
      windDirection: weatherResult?.wind?.deg,
      windSpeed: weatherResult?.wind?.speed
    }

    setPinPositions(pinPositions.map((p, i) => (i === index ? { ...p, elevation, ...weather } : p)))

    const distanceWithWind = calculateDistanceWithWind({
      currentPosition: currentPosition || { lat: 0, lng: 0 },
      targetPosition: position,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection
    })

    const currentElevationResult = await getElevation(currentPosition || { lat: 0, lng: 0 })
    const currentElevation = currentElevationResult?.results[0]?.elevation
    const elevationEffect = calculateElevationEffect({
      currentElevation: currentElevation || 0,
      targetElevation: elevation || 0
    })

    setDisplayInfo({
      distance: distanceWithWind.adjustedDistance,
      elevationDiff: elevationEffect.elevationDiff,
      elevationEffect: elevationEffect.elevationEffect,
      windEffect: distanceWithWind.windEffect,
      crossWindEffect: calculateCrossWindEffect({
        currentPosition: currentPosition || { lat: 0, lng: 0 },
        targetPosition: position,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection
      }),
      club: suggestClub(distanceWithWind.adjustedDistance)
    })
  }

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
              距離:{' '}
              <span className='font-bold text-4xl'>
                {displayInfo.distance !== null && displayInfo.distance !== undefined ? displayInfo.distance : ''}
              </span>{' '}
              ヤード
            </p>
            <p>
              高低差:{' '}
              <span className='font-bold'>
                {/* {elevationEffect?.elevationDiff > 0
                  ? `+${elevationEffect.elevationDiff} m`
                  : `${elevationEffect.elevationDiff} m`} */}

                {displayInfo.elevationDiff !== null && displayInfo.elevationDiff !== undefined
                  ? displayInfo.elevationDiff
                  : ''}
              </span>
            </p>
            <p>
              高低差補正距離:{' '}
              <span className='font-bold'>
                {/* {calculateElevationEffect().elevationEffect > 0
                  ? `+${calculateElevationEffect().elevationEffect} ヤード`
                  : `${calculateElevationEffect().elevationEffect} ヤード`} */}

                {displayInfo.elevationEffect !== null && displayInfo.elevationEffect !== undefined
                  ? displayInfo.elevationEffect > 0
                    ? `+${displayInfo.elevationEffect} ヤード`
                    : `${displayInfo.elevationEffect} ヤード`
                  : ''}
              </span>
            </p>
            <p>
              風による補正:{' '}
              <span className='font-bold'>
                {displayInfo.windEffect !== null && displayInfo.windEffect !== undefined
                  ? displayInfo.windEffect > 0
                    ? `+${displayInfo.windEffect} ヤード`
                    : `${displayInfo.windEffect} ヤード`
                  : ''}
              </span>
            </p>
            <p>
              横風偏り:{' '}
              <span className='font-bold'>
                {displayInfo.crossWindEffect !== null && displayInfo.crossWindEffect !== undefined
                  ? displayInfo.crossWindEffect
                  : ''}
              </span>
            </p>
            <p>
              クラブ提案:{' '}
              <span className='font-bold'>
                {displayInfo.club !== null && displayInfo.club !== undefined ? displayInfo.club : ''}
              </span>
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
                    <TableCell>
                      {position.windDirection
                        ? `${getWindDirection(position.windDirection)} (${position.windDirection})`
                        : ''}
                    </TableCell>
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
          center={currentPosition || { lat: 0, lng: 0 }}
          zoom={17}
          onClick={event => {
            const lat = event.latLng?.lat()
            const lng = event.latLng?.lng()
            if (lat && lng) {
              setPinPositions([...pinPositions, { lat, lng }])
            }
          }}
          mapTypeId='satellite'
          tilt={45}
        >
          {currentPosition && (
            <Marker
              position={currentPosition}
              label='現在地'
              draggable
              onDragEnd={event => {
                const lat = event.latLng?.lat()
                const lng = event.latLng?.lng()
                if (lat && lng) setCurrentPosition({ lat, lng, elevation: null, windDirection: null, windSpeed: null })
              }}
            />
          )}
          {pinPositions?.map((position, index) => (
            <Marker
              key={index}
              position={position}
              label={`${index + 1}`}
              onClick={() => onClickHoleMarker(index, position)}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  )
})

const calculateCrossWindEffect = ({
  currentPosition,
  targetPosition,
  windSpeed = 0,
  windDirection = 0
}: {
  currentPosition: Position
  targetPosition: Position
  windSpeed?: number
  windDirection?: number
}): string | null => {
  // 現在地からピンに向かう角度（打球方向）を計算
  const deltaY = targetPosition.lat - currentPosition.lat
  const deltaX = targetPosition.lng - currentPosition.lng
  const shotDirection = Math.atan2(deltaY, deltaX) * (180 / Math.PI) // 打球方向（度）

  // 風の向きと打球方向の差を計算
  const relativeWindAngle = windDirection - shotDirection

  // 相対角度をラジアンに変換
  const angleRad = (relativeWindAngle * Math.PI) / 180

  // 横風成分を計算
  const crossWind = windSpeed * Math.sin(angleRad) // 横風成分

  // 横風の影響（経験則で倍率を適用）
  const crossWindEffect = Math.round(crossWind * 1.5)

  // 左右の方向を判定
  if (crossWindEffect > 0) return `右 ${crossWindEffect} ヤード`
  if (crossWindEffect < 0) return `左 ${Math.abs(crossWindEffect)} ヤード`
  return 'なし'
}

/**
 * 風の影響を考慮した距離計算
 * @param param0
 * @returns
 */
const calculateDistanceWithWind = ({
  currentPosition,
  targetPosition,
  windSpeed = 0,
  windDirection = 0,
  effect = 0.15
}: {
  currentPosition: Position
  targetPosition: Position
  windSpeed?: number
  windDirection?: number
  effect?: number
}): { adjustedDistance: number | null; windEffect: number } => {
  const distanceInMeters = getDistance(currentPosition, targetPosition)
  const yardDistance = distanceInMeters / YARD_CONVERSION

  // 風の影響を計算
  const deltaY = targetPosition.lat - currentPosition.lat
  const deltaX = targetPosition.lng - currentPosition.lng
  const shotDirection = Math.atan2(deltaY, deltaX) * (180 / Math.PI) // 打球方向（度）
  const relativeWindAngle = windDirection - shotDirection
  const angleRad = (relativeWindAngle * Math.PI) / 180
  const windEffect = windSpeed * Math.cos(angleRad) * effect // 経験則

  const adjustedDistance = yardDistance + windEffect

  return { adjustedDistance: Math.round(adjustedDistance), windEffect: Math.round(windEffect) }
}

/**
 * 高低差による距離補正計算
 * @param currentElevation 現在地の標高
 * @param targetElevation 目標地点の標高
 * @param effect 高低差による距離補正係数（経験則: 1mの高低差で1ヤードの補正）
 * @returns 高低差と高低差による距離補正
 */
const calculateElevationEffect = ({
  currentElevation,
  targetElevation,
  effect = 1 // yard
}: {
  currentElevation: number
  targetElevation: number
  effect?: number
}): { elevationDiff: number | null; elevationEffect: number | null } => {
  if (
    currentElevation === null ||
    currentElevation === undefined ||
    targetElevation === null ||
    targetElevation === undefined
  ) {
    return { elevationDiff: null, elevationEffect: null }
  }

  const elevationDiff = targetElevation - currentElevation

  // 高低差による距離補正計算（経験則: 1mの高低差で1ヤードの補正）
  const elevationEffect = elevationDiff * effect // 1m = 1ヤードの補正

  return { elevationDiff: Math.round(elevationDiff), elevationEffect: Math.round(elevationEffect) }
}
