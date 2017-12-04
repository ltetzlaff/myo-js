import { Quaternion } from "./util"

// This stands for in which direction the thalmic logo on the device is pointing.
export type Direction = "toward_elbow" | "toward_wrist" | undefined

export type Arm = "left" | "right"

export type LockingPolicy = "standard" | "none"

export interface IBatteryDto {
  battery_level: number
  timestamp: number
}

export interface IRssiDto {
  rssi: number
  bluetooth_strength: number
  timestamp: number
}

export interface IVersionDto {
  version: string[] | number[]
}

export interface IArmDto {
  arm: Arm
  x_direction: Direction
  warmup_state: string
}

export type EmgPodsTuple = [ number, number, number, number, number, number, number, number ]

export interface IEmgDto {
  type: string
  timestamp: number
  emg: EmgPodsTuple
}

export interface IOrientationDto {
  timestamp: number
  orientation: Quaternion
  accelerometer: [number, number, number]
  gyroscope: [number, number, number]
}

export type Pose = "rest" | "fingers_spread" | "wave_in" | "wave_out" | "fist" | "double_tap"

export interface IPoseDto {
  pose: Pose
}

export interface IMyoDto extends IOrientationDto, IPoseDto, IEmgDto, IArmDto, IVersionDto, IRssiDto, IBatteryDto {
  type: string

  mac_address: string
  name: string
  myo: string // connectIndex
}

export interface ICommand {
  command: string
  myo?: string
  type?: string
}
