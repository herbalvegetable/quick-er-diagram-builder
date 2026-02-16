import React, { useRef } from "react";

export class Position {
    ref: React.RefObject<any>;

    constructor(pos: number[], cameraPos: number[]) {
        this.ref = useRef({
            pos,
            screenPos: [0, 0],
        });
        this.setScreenPos(cameraPos);
    }

    setPos(pos: number[]) {
        this.ref.current.pos = pos;
        
    }

    setScreenPos(cameraPos: number[]){
        this.ref.current.screenPos = this.getScreenPos(this.ref.current.pos, cameraPos);
    }

    getScreenPos(pos: number[], cameraPos: number[]) {
        let middleX = window.innerWidth / 2;
        let middleY = window.innerHeight / 2;

        let screenX = middleX + (cameraPos[0] - pos[0]);
        let screenY = middleY + (cameraPos[1] - pos[1]);

        return [screenX, screenY];
    }
}