"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myo_1 = require("./myo");
class MyoManager {
    constructor() {
        this.defaults = {
            apiVersion: 3,
            socketUrl: "ws://127.0.0.1:10138/myo/",
            appID: "com.myojs.default"
        };
        this.eventHandlers = new Map();
        this.eventHandlersAll = new Array();
        this.eventCounter = 0;
        this.lockingPolicy = "standard";
        this.myos = [];
    }
    onError() {
        throw "MYO: Error with the socket connection. Myo Connect might not be running. If it is, double check the API version.";
    }
    setLockingPolicy(policy) {
        this.sendCommand({
            command: "set_locking_policy",
            type: policy
        });
        this.lockingPolicy = policy;
        return this;
    }
    trigger(eventName, ...args) {
        const handler = this.eventHandlers.get(eventName);
        if (handler !== undefined)
            handler.fn(...args);
        this.eventHandlersAll.forEach(h => h.fn(...args));
        return this;
    }
    on(name, fn) {
        const id = Date.now() + "" + this.eventCounter++;
        const handler = { id, name, fn };
        if (name === "*") {
            this.eventHandlersAll.push(handler);
        }
        else {
            this.eventHandlers.set(name, handler);
        }
        return id;
    }
    off(name) {
        if (name === "*") {
            this.eventHandlersAll = []; // this is not really optimal
        }
        else {
            this.eventHandlers.delete(name);
        }
        return this;
    }
    connect(newAppID) {
        if (newAppID) {
            this.defaults.appID = newAppID;
        }
        const { socketUrl, apiVersion, appID } = this.defaults;
        const s = new WebSocket(socketUrl + apiVersion + "?appid=" + appID);
        s.onmessage = this.handleMessage;
        s.onopen = ev => this.trigger("ready", ev);
        s.onclose = ev => this.trigger("socket_closed", ev);
        s.onerror = this.onError;
        this.socket = s;
    }
    disconnect() {
        this.socket.close();
    }
    sendCommand(data) {
        this.socket.send(JSON.stringify(["command", data]));
    }
    handleMessage(msg) {
        const data = JSON.parse(msg.data)[1];
        if (!data.type || typeof (data.myo) === "undefined")
            return;
        if (data.type === "paired") {
            const exists = this.myos.some(myo => myo.macAddress === data.mac_address);
            if (!exists) {
                const { mac_address, name, myo } = data;
                this.myos.push(new myo_1.Myo(mac_address, name, myo));
            }
        }
        const myo = this.myos.find(myo => myo.connectIndex === data.myo);
        if (myo !== undefined) {
            const method = myo[data.type];
            let isStatusEvent = true;
            if (method) {
                isStatusEvent = method(data);
            }
            if (!method || isStatusEvent) {
                this.trigger(data.type, data, data.timestamp);
                this.trigger("status", data, data.timestamp);
            }
        }
    }
}
exports.MyoManager = MyoManager;
