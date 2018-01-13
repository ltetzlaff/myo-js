import { MyoManager } from "./MyoManager"
import {
  IVersionDto,
  IRssiDto,
  IBatteryDto,
  IArmDto,
  IEmgDto,
  IOrientationDto,
  IPoseDto,
  Direction,
  Pose,
  Arm,
  LockingPolicy,
  MMEvent,
  MMStatusEvent,
  MMPoseOffEvent,
  EMGPodsTuple,
  IMyoDto,
  VibrationDuration
} from "./types"
import { Quaternion, IIMUData, Vector3, getStrengthFromRssi } from "./util"

export class Myo {
  constructor(
    public macAddress: string,
    public name: string,
    public connectIndex: string,
    public myoManager: MyoManager
  ) {}

  public isLocked = true
  public isConnected = false
  public isSynced = false

  public connectVersion: string | undefined
  public warmupState: string | undefined
  public batteryLevel = 0
  public direction: Direction | undefined
  public arm: Arm | undefined
  public orientationOffset = Quaternion.Identity()

  public lastQuant = Quaternion.Identity()
  public lastIMU: IIMUData | undefined
  public lastPose: Pose | undefined = undefined

  public lock() {
    this.myoManager.sendCommand({
      command: "lock",
      myo: this.connectIndex
    })
  }

  public unlock(hold: boolean = false) {
    this.myoManager.sendCommand({
      command: "unlock",
      myo: this.connectIndex,
      type: hold ? "hold" : "timed"
    })
  }

  public zeroOrientation() {
    this.orientationOffset = this.lastQuant.invert()
    this.myoManager.emit(MMEvent.ZeroOrientation, this)
  }

  public vibrate(duration = VibrationDuration.Medium) {
    this.myoManager.sendCommand({
      command: "vibrate",
      myo: this.connectIndex,
      type: duration
    })
  }

  public requestBluetoothStrength() {
    this.myoManager.sendCommand({
      command: "request_rssi",
      myo: this.connectIndex
    })
  }

  public requestBatteryLevel() {
    this.myoManager.sendCommand({
      command: "request_battery_level",
      myo: this.connectIndex
    })
  }

  public streamEMG(enabled: boolean) {
    this.myoManager.sendCommand({
      command: "set_stream_emg",
      myo: this.connectIndex,
      type: enabled ? "enabled" : "disabled"
    })
  }

  public pose(data: IPoseDto) {
    const { pose } = data
    if (this.lastPose) {
      // @ts-ignore: Runtime string type checking currently unsupported in TS
      this.myoManager.emit(`${this.lastPose}_off`)
      this.myoManager.emit(MMEvent.PoseLeave, this, this.lastPose)
    }
    if (pose === Pose.Rest) {
      this.myoManager.emit(Pose.Rest, this)
      this.lastPose = undefined
      if (this.myoManager.lockingPolicy === LockingPolicy.Standard)
        this.unlock()
    } else {
      this.myoManager.emit(pose, this)
      this.myoManager.emit(MMEvent.PoseEnter, this, pose)
      this.lastPose = pose
      if (this.myoManager.lockingPolicy === LockingPolicy.Standard)
        this.unlock(true)
    }
  }

  public orientation(data: IOrientationDto) {
    this.lastQuant = data.orientation
    const orientation = this.orientationOffset.rotate(data.orientation)
    const accelerometer = Vector3.fromArray(data.accelerometer)
    const gyroscope = Vector3.fromArray(data.gyroscope)
    const imuData = { orientation, accelerometer, gyroscope } as IIMUData

    const { timestamp } = data
    this.myoManager.emit(MMEvent.Orientation, this, orientation, timestamp)
    this.myoManager.emit(MMEvent.Accelerometer, this, accelerometer, timestamp)
    this.myoManager.emit(MMEvent.Gyroscope, this, gyroscope, timestamp)
    this.myoManager.emit(MMEvent.IMU, this, imuData, timestamp)
    this.lastIMU = imuData
  }

  //Status Events
  public syncArm(data: IArmDto) {
    this.arm = data.arm
    this.direction = data.x_direction
    this.warmupState = data.warmup_state
    this.isSynced = true
  }

  public unsyncArm() {
    this.arm = undefined
    this.direction = undefined
    this.warmupState = undefined
    this.isSynced = false
  }

  public updateBluetooth(data: IRssiDto) {
    const { timestamp } = data
    const strength = getStrengthFromRssi(data.rssi)
    this.myoManager.emit(MMEvent.BluetoothStrength, this, strength, timestamp)
    this.myoManager.emit(MMEvent.RSSI, this, data.rssi, timestamp)
    this.myoManager.emit(MMEvent.Status, this, data, timestamp)
  }

  public updateBatteryLevel(data: IBatteryDto) {
    this.batteryLevel = data.battery_level
    this.myoManager.emit(
      MMEvent.BatteryLevel,
      this,
      data.battery_level,
      data.timestamp
    )
    this.myoManager.emit(MMEvent.Status, this, data, data.timestamp)
  }
}
