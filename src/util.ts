export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(min, val), max)
}

export function getStrengthFromRssi(rssi: number) {
  // tslint:disable:no-magic-numbers
  const min = -95
  const max = -40
  const percent = 100
  // tslint:enable:no-magic-numbers

  rssi = clamp(rssi, min, max)
  return Math.round((rssi - min) * percent / (max - min) * percent) / percent
}

export class Quaternion {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public w: number
  ) {}

  public invert(): Quaternion {
    const { x, y, z, w } = this
    const len = Math.sqrt(x * x + y * y + z * z + w * w)
    return {
      w: w / len,
      x: -x / len,
      y: -y / len,
      z: -z / len
    } as Quaternion
  }

  public rotate(r: Quaternion): Quaternion {
    const { x, y, z, w } = this
    return {
      w: w * r.w - x * r.x - y * r.y - z * r.z,
      x: w * r.x + x * r.w + y * r.z - z * r.y,
      y: w * r.y - x * r.z + y * r.w + z * r.x,
      z: w * r.z + x * r.y - y * r.x + z * r.w
    } as Quaternion
  }

  public static Identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1)
  }
}

export class Vector3 {
  constructor(public x: number, public y: number, public z: number) {}

  public static fromArray(a: number[]): Vector3 {
    return new Vector3(a[0], a[1], a[2]) // tslint:disable-line:no-magic-numbers
  }
}

export interface IIMUData {
  orientation: Quaternion
  accelerometer: Vector3
  gyroscope: Vector3
}
