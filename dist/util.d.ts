export declare function getStrengthFromRssi(rssi: number): number;
export declare class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number, y: number, z: number, w: number);
    invert(): Quaternion;
    rotate(r: Quaternion): Quaternion;
    static Identity(): Quaternion;
}
export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number);
    static fromArray(a: number[]): Vector3;
}
export declare type IMUData = {
    orientation: Quaternion;
    accelerometer: Vector3;
    gyroscope: Vector3;
};
