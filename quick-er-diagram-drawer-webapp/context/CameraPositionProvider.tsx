'use client';
import React, { useState, createContext, useContext } from "react";
// import { create } from 'zustand';

export const CameraPositionContext = createContext({});

export const useCameraPositionContext = (): any => useContext(CameraPositionContext);

export default function CameraPositionProvider(props: any) {
    // cameraPos = [x, y]
    const [cameraPos, setCameraPos] = useState<any>([0, 0]);

    return (
        <CameraPositionContext.Provider value={{cameraPos, setCameraPos}}>
            {props.children}
        </CameraPositionContext.Provider>
    )
}
