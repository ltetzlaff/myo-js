import { Myo } from "./Myo"
import {
  IMyoDto,
  ICommand,
  LockingPolicy,
  MMEvent,
  Pose,
  MMPoseOffEvent,
  EMGPodsTuple,
  MMStatusEvent,
  MCBCloseEvent,
  MCBOrientation,
  MCBAcceleration,
  MCBGyroscope,
  MCBIMU,
  MCBStatus,
  MCBBatteryLevel,
  MCBRSSI,
  MCBBluetoothStrength,
  MCBEMG,
  MyoCallback,
  MCBEmpty,
  IPoseDto,
  IOrientationDto,
  IArmDto,
  IVersionDto,
  IRssiDto,
  IBatteryDto,
  IEmgDto,
  isMMStatusEvent,
  MCBPose,
  MCBEvent,
  MyoDataType,
  WarmupState
} from "./types"
import { Quaternion, Vector3, IIMUData } from "./util"

interface IEventHandler {
  id: string
  name: string
  fn: MyoCallback
}

export class MyoManager {
  private defaults = {
    apiVersion: 3,
    socketUrl: "ws://127.0.0.1:10138/myo/",
    appID: "com.myojs.default"
  }

  private eventHandlers = new Map<string, IEventHandler>()
  private eventHandlersAll = new Array<IEventHandler>()
  private eventCounter: number = 0

  public lockingPolicy = LockingPolicy.Standard
  public myos: Myo[] = []
  private socket: WebSocket | undefined

  private onError() {
    throw "MYO: Error with the socket connection. Myo Connect might not be running. If it is, double check the API version."
  }

  public setLockingPolicy(policy: LockingPolicy) {
    this.sendCommand({
      command: "set_locking_policy",
      type: policy
    })
    this.lockingPolicy = policy
  }

  public emit(name: MMEvent.Ready, myo: undefined, ev: Event): void
  public emit(name: MMEvent.SocketClosed, myo: undefined, ev: CloseEvent): void
  public emit(name: Pose | MMPoseOffEvent, myo: Myo): void
  public emit(
    name: MMEvent.PoseEnter | MMEvent.PoseLeave,
    myo: Myo,
    pose: Pose
  ): void
  public emit(
    name: MMEvent.Orientation,
    myo: Myo,
    orientation: Quaternion,
    t: number
  ): void
  public emit(
    name: MMEvent.Accelerometer,
    myo: Myo,
    acceleration: Vector3,
    t: number
  ): void
  public emit(
    name: MMEvent.Gyroscope,
    myo: Myo,
    gyroscope: Vector3,
    t: number
  ): void
  public emit(name: MMEvent.IMU, myo: Myo, imuData: IIMUData, t: number): void
  public emit(name: MMEvent.ZeroOrientation, myo: Myo): void
  public emit(name: MMEvent.EMG, myo: Myo, emg: EMGPodsTuple, t: number): void
  public emit(
    name: MMEvent.BluetoothStrength,
    myo: Myo,
    strength: number,
    t: number
  ): void
  public emit(name: MMEvent.RSSI, myo: Myo, rssi: number, t: number): void
  public emit(
    name: MMEvent.BatteryLevel,
    myo: Myo,
    level: number,
    t: number
  ): void
  public emit(name: MMStatusEvent, myo: Myo, data: IMyoDto, t: number): void
  public emit(name: string, myo: Myo | undefined, ...args: {}[]): void {
    const handler = this.eventHandlers.get(name)
    if (handler !== undefined) {
      handler.fn(myo, ...args)
    }

    this.eventHandlersAll.forEach(h => h.fn(undefined, ...args))
  }

  public on(name: "ready", fn: MCBEvent): void
  public on(name: "socket_closed", fn: MCBCloseEvent): void
  public on(
    name:
      | "rest"
      | "rest_off"
      | "fingers_spread"
      | "fingers_spread_off"
      | "wave_in"
      | "wave_in_off"
      | "wave_out"
      | "wave_out_off"
      | "fist"
      | "fist_off"
      | "double_tap"
      | "double_tap_off"
      | "zero_orientation",
    fn: MCBEmpty
  ): void
  public on(name: "pose" | "pose_off", fn: MCBPose): void
  public on(name: "orientation", fn: MCBOrientation): void
  public on(name: "accelerometer", fn: MCBAcceleration): void
  public on(name: "gyroscope", fn: MCBGyroscope): void
  public on(name: "imu", fn: MCBIMU): void
  public on(name: "emg", fn: MCBEMG): void
  public on(name: "bluetooth_strength", fn: MCBBluetoothStrength): void
  public on(name: "rssi", fn: MCBRSSI): void
  public on(name: "battery_level", fn: MCBBatteryLevel): void
  public on(
    name:
      | "status"
      | "warmup_complete"
      | "paired"
      | "disconnected"
      | "connected"
      | "locked"
      | "arm_synced"
      | "arm_unsynced",
    fn: MCBStatus
  ): void
  public on(name: string, fn: MyoCallback): void {
    const id = `${Date.now()}${this.eventCounter++}`
    const handler = { id, name, fn }
    if (name === "*") {
      this.eventHandlersAll.push(handler)
    } else {
      this.eventHandlers.set(name, handler)
    }
  }

  public off(name: string) {
    if (name === "*") {
      this.eventHandlersAll = [] // this is not really optimal
    } else {
      this.eventHandlers.delete(name)
    }
  }

  public connect(newAppID?: string, newSocketURL?: string) {
    if (newAppID) {
      this.defaults.appID = newAppID
    }
    if (newSocketURL) {
      this.defaults.socketUrl = newSocketURL
    }

    const { socketUrl, apiVersion, appID } = this.defaults

    const s = new WebSocket(`${socketUrl}${apiVersion}?appid=${appID}`)
    s.onmessage = msg => this.handleMessage(msg)
    s.onopen = ev => this.emit(MMEvent.Ready, undefined, ev)
    s.onclose = ev => this.emit(MMEvent.SocketClosed, undefined, ev)
    s.onerror = this.onError
    this.socket = s
  }

  public disconnect() {
    if (this.socket === undefined) throw new Error("socket was not connected")
    this.socket.close()
  }

  public sendCommand(data: ICommand) {
    if (this.socket === undefined) throw new Error("socket was not connected")
    this.socket.send(JSON.stringify(["command", data]))
  }

  private handleMessage(msg: MessageEvent) {
    const data = JSON.parse(msg.data)[1] as IMyoDto

    if (!data.type || data.myo === undefined) return

    if (data.type === MyoDataType.Paired) {
      const exists = this.myos.some(myo => myo.macAddress === data.mac_address)

      if (!exists) {
        const { mac_address, name, myo } = data
        this.myos.push(new Myo(mac_address, name, myo, this))
      }
    }

    const myo = this.myos.find(myo => myo.connectIndex === data.myo)
    if (myo !== undefined) {
      switch (data.type) {
        case MyoDataType.Pose:
          myo.pose(data as IPoseDto)
          break
        case MyoDataType.Orientation:
          myo.orientation(data as IOrientationDto)
          break
        case MyoDataType.EMG:
          const { emg, timestamp } = data as IEmgDto
          this.emit(MMEvent.EMG, myo, emg, timestamp)
          break
        case MyoDataType.Unlocked:
          myo.isLocked = false
          break
        case MyoDataType.RSSI:
          myo.updateBluetooth(data as IRssiDto)
          break
        case MyoDataType.BatteryLevel:
          myo.updateBatteryLevel(data as IBatteryDto)
          break
        case MyoDataType.ArmSynced:
          myo.syncArm(data as IArmDto)
          this.emit(MMEvent.ArmSynced, myo, data, data.timestamp)
          break
        case MyoDataType.ArmUnsynced:
          myo.unsyncArm()
          this.emit(MMEvent.ArmUnsynced, myo, data, data.timestamp)
          break
        case MyoDataType.Connected:
          const dto = data as IVersionDto
          myo.connectVersion = dto.version.join(".")
          myo.isConnected = true
          this.emit(MMEvent.Connected, myo, dto, dto.timestamp)
          break
        case MyoDataType.Disconnected:
          myo.isConnected = false
          this.emit(MMEvent.Disconnected, myo, data, data.timestamp)
          break
        case MyoDataType.Locked:
          myo.isLocked = true
          this.emit(MMEvent.Locked, myo, data, data.timestamp)
          break
        case MyoDataType.WarmupCompleted:
          myo.warmupState = WarmupState.Warm
          this.emit(MMEvent.WarmupCompleted, myo, data, data.timestamp)
          break
        case MyoDataType.Paired:
          this.emit(MMEvent.Paired, myo, data, data.timestamp)
          break
        default:
          console.log(data.type)
          break
      }

      if (isMMStatusEvent(data.type)) {
        this.emit(MMEvent.Status, myo, data, data.timestamp)
      }
    }
  }
}
