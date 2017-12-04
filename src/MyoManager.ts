import { Myo } from "./Myo"
import { IMyoDto, ICommand, LockingPolicy, MMEvent, Pose, MMPoseOffEvent, EMGPodsTuple, MMStatusEvent, MCBCloseEvent, MCBOrientation, MCBAcceleration, MCBGyroscope, MCBIMU, MCBStatus, MCBBatteryLevel, MCBRSSI, MCBBluetoothStrength, MCBEMG, MyoCallback, MCBEmpty, IPoseDto, IOrientationDto, IArmDto, IVersionDto, IRssiDto, IBatteryDto, IEmgDto, isMMStatusEvent, MCBPose, MCBEvent, MyoDataType } from "./types"
import { Quaternion, Vector3, IIMUData } from "./util"

interface IEventHandler {
  id: string
  name: string
  fn: MyoCallback
}

export class MyoManager {
  private defaults = {
    apiVersion : 3,
    socketUrl  : "ws://127.0.0.1:10138/myo/",
    appID      : "com.myojs.default"
  }

  private eventHandlers = new Map<string, IEventHandler>()
  private eventHandlersAll = new Array<IEventHandler>()
  private eventCounter: number = 0

  public lockingPolicy: LockingPolicy = "standard"
  public myos: Myo[] = []
  private socket: WebSocket

  private onError() {
    throw "MYO: Error with the socket connection. Myo Connect might not be running. If it is, double check the API version."
  }

  public setLockingPolicy(policy: LockingPolicy) {
    this.sendCommand({
      command: "set_locking_policy",
      type: policy
    })
    this.lockingPolicy = policy
    return this
  }

  public emit(name: MMEvent.Ready, myo: undefined, ev: Event): void
  public emit(name: MMEvent.SocketClosed, myo: undefined, ev: CloseEvent): void
  public emit(name: Pose | MMPoseOffEvent, myo: Myo | undefined): void
  public emit(name: MMEvent.PoseEnter | MMEvent.PoseLeave, myo: Myo | undefined, pose: Pose): void

  public emit(name: MMEvent.Orientation, myo: Myo | undefined, orientation: Quaternion, t: number): void
  public emit(name: MMEvent.Accelerometer, myo: Myo | undefined, acceleration: Vector3, t: number): void
  public emit(name: MMEvent.Gyroscope, myo: Myo | undefined, gyroscope: Vector3, t: number): void
  public emit(name: MMEvent.IMU, myo: Myo | undefined, imuData: IIMUData, t: number): void

  public emit(name: MMEvent.ZeroOrientation, myo: Myo | undefined): void
  public emit(name: MMEvent.EMG, myo: Myo | undefined, emg: EMGPodsTuple, t: number): void
  public emit(name: MMEvent.BluetoothStrength, myo: Myo | undefined, strength: number, t: number): void
  public emit(name: MMEvent.RSSI, myo: Myo | undefined, rssi: number, t: number): void
  public emit(name: MMEvent.BatteryLevel, myo: Myo | undefined, level: number, t: number): void
  public emit(name: MMStatusEvent, myo: Myo | undefined, data: IMyoDto, t: number): void
  public emit(name: string, myo: Myo | undefined, ...args: {}[]): void {
    const handler = this.eventHandlers.get(name)
    if (handler !== undefined) {
      handler.fn(myo, ...args)
    }

    this.eventHandlersAll.forEach(h => h.fn(undefined, ...args))
  }

  public on(name: MMEvent.Ready, fn: MCBEvent): string
  public on(name: MMEvent.SocketClosed, fn: MCBCloseEvent): string
  public on(name: Pose | MMPoseOffEvent, fn: MCBEmpty): string
  public on(name: MMEvent.PoseEnter | MMEvent.PoseLeave, fn: MCBPose): string

  public on(name: MMEvent.Orientation, fn: MCBOrientation): string
  public on(name: MMEvent.Accelerometer, fn: MCBAcceleration): string
  public on(name: MMEvent.Gyroscope, fn: MCBGyroscope): string
  public on(name: MMEvent.IMU, fn: MCBIMU): string

  public on(name: MMEvent.ZeroOrientation, fn: MCBEmpty): string
  public on(name: MMEvent.EMG, fn: MCBEMG): string
  public on(name: MMEvent.BluetoothStrength, fn: MCBBluetoothStrength): string
  public on(name: MMEvent.RSSI, fn: MCBRSSI): string
  public on(name: MMEvent.BatteryLevel, fn: MCBBatteryLevel): string
  public on(name: MMStatusEvent, fn: MCBStatus): string
  public on(name: string, fn: MyoCallback): string {
    const id = `${ Date.now() }${ this.eventCounter++ }`
    const handler = { id, name, fn }
    if (name === "*") {
      this.eventHandlersAll.push(handler)
    } else {
      this.eventHandlers.set(name, handler)
    }
    return id
  }

  public off(name: string) {
    if (name === "*") {
      this.eventHandlersAll = [] // this is not really optimal
    } else {
      this.eventHandlers.delete(name)
    }
  }

  public connect(newAppID: string) {
    if (newAppID) {
      this.defaults.appID = newAppID
    }

    const { socketUrl, apiVersion, appID } = this.defaults
    const s = new WebSocket(`${ socketUrl }${ apiVersion }?appid=${ appID }`)
    s.onmessage = msg => this.handleMessage(msg)
    s.onopen = ev => this.emit(MMEvent.Ready, undefined, ev)
    s.onclose = ev => this.emit(MMEvent.SocketClosed, undefined, ev)
    s.onerror = this.onError
    this.socket = s
  }

  public disconnect() {
    this.socket.close()
  }

  public sendCommand(data: ICommand) {
    this.socket.send(JSON.stringify([ "command", data ]))
  }

  private handleMessage(msg: MessageEvent) {
    const data = JSON.parse(msg.data)[1] as IMyoDto

    if (!data.type || data.myo === undefined) return
    if (data.type === "paired") {
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
          myo.warmupState = "warm"
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
