import { MyoManager } from "./MyoManager"
import { IVersionDto, IRssiDto, IBatteryDto, IArmDto, IEmgDto, IOrientationDto, IPoseDto, Direction, Pose, Arm, MMEvent, MMStatusEvent, MMPoseOffEvent, EMGPodsTuple, IMyoDto } from "./types"
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

  public connectVersion: string
  public warmupState: string | undefined
  public batteryLevel = 0
  public direction: Direction | undefined
  public arm: Arm | undefined
  public orientationOffset = Quaternion.Identity()

  public lastQuant = Quaternion.Identity()
  public lastIMU: IIMUData
  public lastPose: Pose | undefined = undefined

  public lock() {
    this.myoManager.sendCommand( {
      command: "lock",
      myo: this.connectIndex
    })
    return this
  }

  public unlock(hold: boolean = false) {
    this.myoManager.sendCommand( {
      command: "unlock",
      myo: this.connectIndex,
      type: (hold ? "hold" : "timed")
    })
    return this
  }

  public zeroOrientation() {
    this.orientationOffset = this.lastQuant.invert()
    this.myoManager.emit(MMEvent.ZeroOrientation, this)
    return this
  }

  public vibrate(intensity: string= "medium") {
    this.myoManager.sendCommand({
      command: "vibrate",
      myo: this.connectIndex,
      type: intensity
    })
    return this
  }

  public requestBluetoothStrength() {
    this.myoManager.sendCommand({
      command: "request_rssi",
      myo: this.connectIndex
    })
    return this
  }

  public requestBatteryLevel() {
    this.myoManager.sendCommand({
      command: "request_battery_level",
      myo: this.connectIndex
    })
    return this
  }

  public streamEMG(enabled: boolean) {
    this.myoManager.sendCommand({
      command: "set_stream_emg",
      myo: this.connectIndex,
      type: (enabled ? "enabled" : "disabled")
    })
    return this
  }

  public pose(data: IPoseDto) {
    if (this.lastPose) {
      // @ts-ignore: Runtime string type checking currently unsupported in TS
      this.myoManager.emit(`${ this.lastPose }_off`)
      this.myoManager.emit(MMEvent.PoseLeave, this, this.lastPose)
    }
    if (data.pose === "rest") {
      this.myoManager.emit("rest", this)
      this.lastPose = undefined
      if (this.myoManager.lockingPolicy === "standard") this.unlock()
    } else {
      this.myoManager.emit(data.pose, this)
      this.myoManager.emit(MMEvent.PoseEnter, this, data.pose)
      this.lastPose = data.pose
      if (this.myoManager.lockingPolicy === "standard") this.unlock(true)
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
    this.myoManager.emit(MMEvent.BatteryLevel, this, data.battery_level, data.timestamp)
    this.myoManager.emit(MMEvent.Status, this, data, data.timestamp)
  }
}
