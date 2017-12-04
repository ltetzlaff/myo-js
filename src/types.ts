import { Vector3, IIMUData, Quaternion } from "./util"
import { Myo } from "./Myo"

// This stands for in which direction the thalmic logo on the device is pointing.
export type Direction = "toward_elbow" | "toward_wrist" | undefined

export const enum Arm {
  Left = "left",
  Right = "right"
}

export const enum VibrationDuration {
  Short= "short",
  Medium = "medium",
  Long = "long"
}

export const enum WarmupState {
  Warm = "warm"
}

export const enum LockingPolicy {
  Standard = "standard",
  None = "none"
}

export const enum MyoDataType {
  Paired = "paired",
  Pose = "pose",
  Orientation = "orientation",
  EMG = "emg",
  Unlocked = "unlocked",
  Locked = "locked",
  RSSI = "rssi",
  BatteryLevel = "battery_level",
  ArmSynced = "arm_synced",
  ArmUnsynced = "arm_unsynced",
  Connected = "connected",
  Disconnected = "disconnected",
  WarmupCompleted = "warmup_completed"
}

export interface IMyoDto {
  type: MyoDataType

  timestamp: number
  mac_address: string
  name: string
  myo: string // connectIndex
}

export interface IBatteryDto extends IMyoDto {
  type: MyoDataType.BatteryLevel
  battery_level: number
  timestamp: number
}

export interface IRssiDto extends IMyoDto {
  type: MyoDataType.RSSI
  rssi: number
  timestamp: number
}

export interface IVersionDto extends IMyoDto {
  type: MyoDataType.Connected
  version: string[] | number[]
}

export interface IArmDto extends IMyoDto {
  type: MyoDataType.ArmSynced
  arm: Arm
  x_direction: Direction
  warmup_state: string
}

export type EMGPodsTuple = [ number, number, number, number, number, number, number, number ]

export interface IEmgDto extends IMyoDto {
  type: MyoDataType.EMG
  timestamp: number
  emg: EMGPodsTuple
}

export interface IOrientationDto extends IMyoDto {
  type: MyoDataType.Orientation
  timestamp: number
  orientation: Quaternion
  accelerometer: [number, number, number]
  gyroscope: [number, number, number]
}

export const enum Pose {
  Rest = "rest",
  FingersSpread = "fingers_spread",
  WaveIn = "wave_in",
  WaveOut = "wave_out",
  Fist = "fist",
  DoubleTap = "double_tap"
}

export interface IPoseDto extends IMyoDto {
  type: MyoDataType.Pose
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
