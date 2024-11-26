"use client";
import React, { useState, memo } from "react";
import { getDistance } from "geolib";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

type Position = { lat: number; lng: number };
const KIKKA_TOGE_POSITION: Position = {
    lat: 34.88102403391901,
    lng: 134.03095463150288,
};

const HOLES: Position[] = [
    { lat: 34.88100118013464, lng: 134.03192399857866 },
    { lat: 34.88034951478132, lng: 134.03124696459145 },
    { lat: 34.88078852701115, lng: 134.03095751859354 },
    { lat: 34.87978516895087, lng: 134.0304712066222 },
    { lat: 34.87946097198282, lng: 134.03014785546623 },
    { lat: 34.87736965125368, lng: 134.0290123759259 },
    { lat: 34.878349755199736, lng: 134.0298512800275 },
    { lat: 34.87777896265992, lng: 134.0283502378486 },
    { lat: 34.879147608623974, lng: 134.02974230432733 },
    { lat: 34.878485292442036, lng: 134.02837974214776 },
    { lat: 34.87937644752607, lng: 134.02866137409433 },
    { lat: 34.879884731654414, lng: 134.02886790418847 },
];

const containerStyle = {
    width: "100vw",
    height: "100vh",
    cursor: "crosshair !important",
};
export const MapPage = memo(() => {
    const [currentPosition, setCurrentPosition] = useState<Position | null>(KIKKA_TOGE_POSITION);
    const [pinPositions, setPinPositions] = useState<Position[]>(HOLES);
    const [clickPosition, setClickPosition] = useState<Position | null>(null);

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

    const calculateDistance = (): number | null => {
        if (currentPosition && pinPositions.length > 0) {
            const distanceInMeters = getDistance(currentPosition, pinPositions[0]);
            const yard = distanceInMeters / 0.9144; // ヤード単位に変換
            return Math.round(yard);
        }
        return null;
    };

    const onMapClick = (position: Position) => {
        setClickPosition(position);
        setPinPositions([...pinPositions, position]);
    };

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.latLng && onMapClick) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onMapClick({ lat, lng });
        }
    };

    return (
        <div className="relative !cursor-crosshair">
            <div className="absolute top-16 left-4 bottom-4 z-50">
                <div className="bg-white rounded-md w-[300px] h-[100%]">
                    <div className="p-4">
                        <h2 className="text-lg font-bold">距離計算</h2>
                        <p>
                            距離: <span className="font-bold text-4xl">{calculateDistance()}</span> ヤード
                        </p>
                    </div>

                    {/* クリックしたピンの座標リスト */}
                    <ul className="text-sm">
                        {pinPositions.map((position, index) => (
                            <li key={index}>
                                {position.lat}, {position.lng}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={KIKKA_TOGE_POSITION}
                    zoom={17}
                    onClick={handleMapClick}
                    mapTypeId="satellite"
                >
                    {/* 現在地マーカー */}
                    {currentPosition && (
                        <Marker
                            position={currentPosition}
                            label="現在地"
                            // icon={{
                            //     path: google.maps.SymbolPath.CIRCLE, // マーカーの形状
                            //     scale: 8, // マーカーの大きさ
                            //     fillColor: "blue", // 塗りつぶしの色
                            //     fillOpacity: 0.5, // 塗りつぶしの透明度
                            //     strokeWeight: 2, // 枠線の太さ
                            //     strokeColor: "white", // 枠線の色
                            // }}
                        />
                    )}
                    {/* ピン位置マーカー */}
                    {pinPositions?.map((position, index) => (
                        <Marker
                            key={index}
                            position={position}
                            label={`${index + 1}`}
                            onClick={() => {
                                setPinPositions(pinPositions.filter((_, i) => i !== index));
                            }}
                            draggable
                            // icon={{
                            //     path: google.maps.SymbolPath.CIRCLE, // マーカーの形状
                            //     scale: 8, // マーカーの大きさ
                            //     fillColor: "yellow", // 塗りつぶしの色
                            //     fillOpacity: 1, // 塗りつぶしの透明度
                            //     strokeWeight: 2, // 枠線の太さ
                            //     strokeColor: "white", // 枠線の色
                            // }}
                        />
                    ))}
                </GoogleMap>
            </LoadScript>
        </div>
    );
});
