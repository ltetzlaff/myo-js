import { Myo } from "./Myo"
import { IMyoDto, ICommand, LockingPolicy } from "./types"

export type Callback = (myo: Myo | undefined, ...args: {}[]) => void

interface IEventHandler {
  id: string
  name: string
  fn: Callback
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

  public trigger(eventName: string, myo: Myo | undefined, ...args: {}[]) {
    const handler = this.eventHandlers.get(eventName)
    if (handler !== undefined) {
      handler.fn(myo, ...args)
    }

    this.eventHandlersAll.forEach(h => h.fn(undefined, ...args))
    return this
  }

  public on(name: string, fn: Callback) {
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
    return this
  }

  public connect(newAppID: string) {
    if (newAppID) {
      this.defaults.appID = newAppID
    }

    const { socketUrl, apiVersion, appID } = this.defaults
    const s = new WebSocket(`${ socketUrl }${ apiVersion }?appid=${ appID }`)
    s.onmessage = msg => this.handleMessage(msg)
    s.onopen = ev => this.trigger("ready", undefined, ev)
    s.onclose = ev => this.trigger("socket_closed", undefined, ev)
    s.onerror = this.onError
    this.socket = s
  }

  public disconnect() {
    this.socket.close()
  }

  public sendCommand(data: ICommand) {
    this.socket.send(JSON.stringify([ "command", data ]))
  }

  public handleMessage(msg: MessageEvent) {
    const data = JSON.parse(msg.data)[1] as IMyoDto

    if (!data.type || typeof(data.myo) === "undefined") return
    if (data.type === "paired") {
      const exists = this.myos.some(myo => myo.macAddress === data.mac_address)

      if (!exists) {
        const { mac_address, name, myo } = data
        this.myos.push(new Myo(mac_address, name, myo, this))
      }
    }

    const myo = this.myos.find(myo => myo.connectIndex === data.myo)
    if (myo !== undefined) {
      let isStatusEvent = false
      //console.log(data)
      switch (data.type) {
        case "pose":
          myo.pose(data)
          break
        case "orientation":
          myo.orientation(data)
          break
        case "emg":
          myo.emg(data)
          break
        case "arm_synced":
          myo.arm_synced(data)
          isStatusEvent = true
          break
        case "arm_unsynced":
          myo.arm_unsynced()
          isStatusEvent = true
          break
        case "connected":
          myo.connected(data)
          isStatusEvent = true
          break
        case "disconnected":
          myo.disconnected()
          isStatusEvent = true
          break
        case "locked":
          myo.locked()
          isStatusEvent = true
          break
        case "unlocked":
          myo.unlocked()
          break
        case "warmup_completed":
          myo.warmup_completed()
          isStatusEvent = true
          break
        case "rssi":
          myo.rssi(data)
          break
        case "battery_level":
          myo.battery_level(data)
          break
        case "paired":
          isStatusEvent = true
          break
        default:
          console.log(data.type)
          break
      }

      if (isStatusEvent) {
        myo.trigger(data.type, data, data.timestamp)
        myo.trigger("status", data, data.timestamp)
      }
    }
  }
}
