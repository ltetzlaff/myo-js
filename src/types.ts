import { Vector3, IIMUData, Quaternion } from "./util"
import { Myo } from "./Myo"

// This stands for in which direction the thalmic logo on the device is pointing.
export type Direction = "toward_elbow" | "toward_wrist" | undefined

export type Arm = "left" | "right"

export type LockingPolicy = "standard" | "none"

export interface IMyoDto {
  type: string

  timestamp: number
  mac_address: string
  name: string
  myo: string // connectIndex
}

export interface IBatteryDto extends IMyoDto {
  type: "battery_level"
  battery_level: number
  timestamp: number
}

export interface IRssiDto extends IMyoDto {
  type: "rssi"
  rssi: number
  bluetooth_strength: number
  timestamp: number
}

export interface IVersionDto extends IMyoDto {
  type: "connected"
  version: string[] | number[]
}

export interface IArmDto extends IMyoDto {
  type: "arm_synced"
  arm: Arm
  x_direction: Direction
  warmup_state: string
}

export type EMGPodsTuple = [ number, number, number, number, number, number, number, number ]

export interface IEmgDto extends IMyoDto {
  type: "emg"
  timestamp: number
  emg: EMGPodsTuple
}

export interface IOrientationDto extends IMyoDto {
  type: "orientation"
  timestamp: number
  orientation: Quaternion
  accelerometer: [number, number, number]
  gyroscope: [number, number, number]
}

export type Pose = "rest" | "fingers_spread" | "wave_in" | "wave_out" | "fist" | "double_tap"

export interface IPoseDto extends IMyoDto {
  type: "pose"
  pose: Pose
}

export interface ICommand {
  command: string
  myo?: string
  type?: string
}

export const enum MMEvent {
  // Manager Events
  Ready = "ready",
  SocketClosed = "socket_closed",

  // Device Events
  PoseRest = "rest",
  PoseFingersSpreadOff = "fingers_spread_off",
  PoseWaveInOff = "wave_in_off",
  PoseWaveOutOff = "wave_out_off",
  PoseFistOff = "fist_off",
  PoseDoubleTapOff = "double_tap_off",

  PoseEnter = "pose",
  PoseLeave = "pose_off",

  Orientation = "orientation",
  Accelerometer = "accelerometer",
  Gyroscope = "gyroscope",
  IMU = "imu",

  ZeroOrientation = "zero_orientation",
  EMG = "emg",
  BluetoothStrength = "bluetooth_strength",
  RSSI = "rssi",
  BatteryLevel = "battery_level",

  Status = "status",
  WarmupCompleted = "warmup_completed",
  Paired = "paired",
  Disconnected = "disconnected",
  Connected = "connected",
  Locked = "locked",
  ArmSynced = "arm_synced",
  ArmUnsynced = "arm_unsynced"
}

const statusEvents = new Set<string>([
  MMEvent.Status,
  MMEvent.WarmupCompleted,
  MMEvent.Paired,
  MMEvent.Disconnected,
  MMEvent.Connected,
  MMEvent.Locked,
  MMEvent.ArmSynced,
  MMEvent.ArmUnsynced
])

export function isMMStatusEvent(event: string) {
  return statusEvents.has(event)
}

export type MMStatusEvent =
    MMEvent.Status
  | MMEvent.WarmupCompleted
  | MMEvent.Paired
  | MMEvent.Disconnected
  | MMEvent.Connected
  | MMEvent.Locked
  | MMEvent.ArmSynced
  | MMEvent.ArmUnsynced

export type MMPoseOffEvent =
    MMEvent.PoseDoubleTapOff
  | MMEvent.PoseFingersSpreadOff
  | MMEvent.PoseWaveInOff
  | MMEvent.PoseWaveOutOff
  | MMEvent.PoseFistOff

export type MCBEmpty = (myo: Myo | undefined) => void
export type MCBPose = (myo: Myo | undefined, pose: Pose) => void
export type MCBEvent = (myo: Myo | undefined, ev: Event) => void
export type MCBCloseEvent = (myo: Myo | undefined, ev: CloseEvent) => void
export type MCBOrientation = (myo: Myo | undefined, orientation: Quaternion, t: number) => void
export type MCBAcceleration = (myo: Myo | undefined, acceleration: Vector3, t: number) => void
export type MCBGyroscope = (myo: Myo | undefined, gyroscope: Vector3, t: number) => void
export type MCBIMU = (myo: Myo | undefined, imuData: IIMUData, t: number) => void
export type MCBEMG = (myo: Myo | undefined, emg: EMGPodsTuple, t: number) => void
export type MCBBluetoothStrength = (myo: Myo | undefined, strength: number, t: number) => void
export type MCBRSSI = (myo: Myo | undefined, rssi: number, t: number) => void
export type MCBBatteryLevel = (myo: Myo | undefined, level: number, t: number) => void
export type MCBStatus = (myo: Myo | undefined, data: IMyoDto, t: number) => void

export type MyoCallback = (myo: Myo | undefined, ...args: any[]) => void // tslint:disable-line:no-any
