export function getStrengthFromRssi(rssi: number) {
  const min = -95
  const max = -40
  rssi = (rssi < min) ? min : rssi
  rssi = (rssi > max) ? max : rssi
  return Math.round(((rssi-min)*100)/(max-min) * 100)/100
}

export class Quaternion {
  x: number
  y: number
  z: number
  w: number

  constructor(x: number, y: number, z: number, w: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  invert() {
    const { x, y, z, w } = this
    var len = Math.sqrt(x * x + y * y + z * z + w * w)
    return {
      w: w/len,
      x: -x/len,
      y: -y/len,
      z: -z/len
    } as Quaternion
  }

  rotate(r: Quaternion) {
    const { x, y, z, w} = this
    return {
      w: w * r.w - x * r.x - y * r.y - z * r.z,
      x: w * r.x + x * r.w + y * r.z - z * r.y,
      y: w * r.y - x * r.z + y * r.w + z * r.x,
      z: w * r.z + x * r.y - y * r.x + z * r.w
    } as Quaternion
  }

  static Identity() {
    return new Quaternion(0, 0, 0, 1)
  }
}

export class Vector3 {
  x: number
  y: number
  z: number

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  static fromArray(a: number[]) {
    return new Vector3(a[0], a[1], a[2])
  }
}

export type IMUData = { orientation: Quaternion, accelerometer: Vector3, gyroscope: Vector3 }