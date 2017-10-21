"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getStrengthFromRssi(rssi) {
    const min = -95;
    const max = -40;
    rssi = (rssi < min) ? min : rssi;
    rssi = (rssi > max) ? max : rssi;
    return Math.round(((rssi - min) * 100) / (max - min) * 100) / 100;
}
exports.getStrengthFromRssi = getStrengthFromRssi;
class Quaternion {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    invert() {
        const { x, y, z, w } = this;
        var len = Math.sqrt(x * x + y * y + z * z + w * w);
        return {
            w: w / len,
            x: -x / len,
            y: -y / len,
            z: -z / len
        };
    }
    rotate(r) {
        const { x, y, z, w } = this;
        return {
            w: w * r.w - x * r.x - y * r.y - z * r.z,
            x: w * r.x + x * r.w + y * r.z - z * r.y,
            y: w * r.y - x * r.z + y * r.w + z * r.x,
            z: w * r.z + x * r.y - y * r.x + z * r.w
        };
    }
    static Identity() {
        return new Quaternion(0, 0, 0, 1);
    }
}
exports.Quaternion = Quaternion;
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromArray(a) {
        return new Vector3(a[0], a[1], a[2]);
    }
}
exports.Vector3 = Vector3;
