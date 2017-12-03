import { MyoManager } from "./MyoManager"
import { VersionDto, IDK, RssiDto, BatteryDto, ArmDto, EmgDto, OrientationDto, PoseDto } from "./types"
import { Quaternion, IMUData, Vector3, getStrengthFromRssi } from "./util"

export class Myo {
  constructor(
    public macAddress: string,
    public name: string,
    public connectIndex: string,
    public myoManager: MyoManager
  ) {}

  isLocked = true
  isConnected = false
  isSynced = false

  connectVersion: string
  warmupState : string | undefined
  batteryLevel = 0
  direction : IDK | undefined
  arm : IDK | undefined
  orientationOffset = Quaternion.Identity()

  lastQuant = Quaternion.Identity()
  lastIMU : IMUData
  lastPose : IDK = undefined

  lock() {
    this.myoManager.sendCommand( {
      command: "lock",
      myo: this.connectIndex
    })
    return this
  }

  unlock(hold: boolean = false) {
    this.myoManager.sendCommand( {
      command: "unlock",
      myo: this.connectIndex,
      type: (hold ? "hold" : "timed")
    })
    return this
  }

  trigger(eventName: string, ...args: any[]) {
    this.myoManager.trigger(eventName, this, ...args)
  }

  zeroOrientation() {
    this.orientationOffset = this.lastQuant.invert()
    this.trigger("zero_orientation")
    return this
  }

  vibrate(intensity: string= "medium") {
    this.myoManager.sendCommand({
      command: "vibrate",
      myo: this.connectIndex,
      type: intensity
    })
    return this
  }

  requestBluetoothStrength() {
    this.myoManager.sendCommand({
      command: "request_rssi",
      myo: this.connectIndex
    })
    return this
  }

  requestBatteryLevel() {
    this.myoManager.sendCommand({
      command: "request_battery_level",
      myo: this.connectIndex
    })
    return this
  }

  streamEMG(enabled: boolean) {
    this.myoManager.sendCommand({
      command: "set_stream_emg",
      myo: this.connectIndex,
      type: (enabled ? "enabled" : "disabled")
    })
    return this
  }

  pose(data: PoseDto) {
    if (this.lastPose){
      this.trigger(this.lastPose + "_off")
      this.trigger("pose_off", this.lastPose)
    }
    if (data.pose === "rest"){
      this.trigger("rest")
      this.lastPose = null
      if (this.myoManager.lockingPolicy === "standard") this.unlock()
    } else{
      this.trigger(data.pose)
      this.trigger("pose", data.pose)
      this.lastPose = data.pose
      if (this.myoManager.lockingPolicy === "standard") this.unlock(true)
    }
  }

  orientation(data: OrientationDto) {
    this.lastQuant = data.orientation
    const orientation = this.orientationOffset.rotate(data.orientation)
    const accelerometer = Vector3.fromArray(data.accelerometer)
    const gyroscope = Vector3.fromArray(data.gyroscope)
    const imuData = { orientation, accelerometer, gyroscope } as IMUData

    const { timestamp } = data
    this.trigger("orientation", orientation, timestamp)
    this.trigger("accelerometer", accelerometer, timestamp)
    this.trigger("gyroscope", gyroscope, timestamp)
    this.trigger("imu", imuData, timestamp)
    this.lastIMU = imuData
  }

  emg (data: EmgDto) {
    this.trigger(data.type, data.emg, data.timestamp)
  }

  //Status Events
  arm_synced(data: ArmDto) {
    this.arm = data.arm
    this.direction = data.x_direction
    this.warmupState = data.warmup_state
    this.isSynced = true
  }

  arm_unsynced() {
    this.arm = undefined
    this.direction = undefined
    this.warmupState = undefined
    this.isSynced = false
  }

  connected({ version }: VersionDto) {
    this.connectVersion = version.join(".")
    this.isConnected = true
  }

  disconnected() {
    this.isConnected = false
  }

  locked() {
    this.isLocked = true
  }

  unlocked() {
    this.isLocked = false
  }

  warmup_completed() {
    this.warmupState = "warm"
  }

  rssi(data: RssiDto) {
    data.bluetooth_strength = getStrengthFromRssi(data.rssi)
    const { timestamp } = data
    this.trigger("bluetooth_strength", data.bluetooth_strength, timestamp)
    this.trigger("rssi", data.rssi, timestamp)
    this.trigger("status", data, timestamp)
  }

  battery_level(data: BatteryDto) {
    this.batteryLevel = data.battery_level
    this.trigger("battery_level", data.battery_level, data.timestamp)
    this.trigger("status", data, data.timestamp)
  }
}
