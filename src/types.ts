import { Quaternion } from "./util";

export type IDK = any

export interface BatteryDto {
  battery_level: number
  timestamp: number
}

export interface RssiDto {
  rssi: number
  bluetooth_strength: number
  timestamp: number
}

export interface VersionDto {
  version: string[] | number[]
}

export interface ArmDto {
  arm: IDK
  x_direction: any
  warmup_state: string
}

export interface EmgDto {
  type: string
  timestamp: number
  emg: IDK
}

export interface OrientationDto {
  timestamp: number
  orientation: Quaternion
  accelerometer: [number, number, number]
  gyroscope: [number, number, number]
}

export interface PoseDto {
  pose: "rest" | IDK
}

export interface MyoDto extends OrientationDto, PoseDto, EmgDto, ArmDto, VersionDto, RssiDto, BatteryDto {
  type: string

  mac_address: string
  name: string
  myo: string // connectIndex
}

export interface Command {
  command: string
  myo?: string
  type?: string
}