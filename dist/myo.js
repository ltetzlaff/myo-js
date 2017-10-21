"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
class Myo {
    constructor(macAddress, name, connectIndex) {
        this.isLocked = true;
        this.isConnected = false;
        this.isSynced = false;
        this.batteryLevel = 0;
        this.orientationOffset = util_1.Quaternion.Identity();
        this.lastQuant = util_1.Quaternion.Identity();
        this.lastPose = undefined;
        this.macAddress = macAddress;
        this.name = name;
        this.connectIndex = connectIndex;
    }
    lock() {
        this.myoManager.sendCommand({
            command: "lock",
            myo: this.connectIndex
        });
        return this;
    }
    unlock(hold = false) {
        this.myoManager.sendCommand({
            command: "unlock",
            myo: this.connectIndex,
            type: (hold ? "hold" : "timed")
        });
        return this;
    }
    trigger(eventName, ...args) {
        this.myoManager.trigger(eventName, args);
    }
    zeroOrientation() {
        this.orientationOffset = this.lastQuant.invert();
        this.trigger("zero_orientation");
        return this;
    }
    vibrate(intensity) {
        intensity = intensity || "medium";
        this.myoManager.sendCommand({
            command: "vibrate",
            myo: this.connectIndex,
            type: intensity
        });
        return this;
    }
    requestBluetoothStrength() {
        this.myoManager.sendCommand({
            command: "request_rssi",
            myo: this.connectIndex
        });
        return this;
    }
    requestBatteryLevel() {
        this.myoManager.sendCommand({
            command: "request_battery_level",
            myo: this.connectIndex
        });
        return this;
    }
    streamEMG(enabled) {
        this.myoManager.sendCommand({
            command: "set_stream_emg",
            myo: this.connectIndex,
            type: (enabled ? "enabled" : "disabled")
        });
        return this;
    }
    pose(data) {
        if (this.lastPose) {
            this.trigger(this.lastPose + "_off");
            this.trigger("pose_off", this.lastPose);
        }
        if (data.pose === "rest") {
            this.trigger("rest");
            this.lastPose = null;
            if (this.myoManager.lockingPolicy === "standard")
                this.unlock();
        }
        else {
            this.trigger(data.pose);
            this.trigger("pose", data.pose);
            this.lastPose = data.pose;
            if (this.myoManager.lockingPolicy === "standard")
                this.unlock(true);
        }
    }
    orientation(data) {
        this.lastQuant = data.orientation;
        const orientation = this.orientationOffset.rotate(data.orientation);
        const accelerometer = util_1.Vector3.fromArray(data.accelerometer);
        const gyroscope = util_1.Vector3.fromArray(data.gyroscope);
        const imuData = { orientation, accelerometer, gyroscope };
        const { timestamp } = data;
        this.trigger("orientation", orientation, timestamp);
        this.trigger("accelerometer", accelerometer, timestamp);
        this.trigger("gyroscope", gyroscope, timestamp);
        this.trigger("imu", imuData, timestamp);
        this.lastIMU = imuData;
    }
    emg(data) {
        this.trigger(data.type, data.emg, data.timestamp);
    }
    //Status Events
    arm_synced(data) {
        this.arm = data.arm;
        this.direction = data.x_direction;
        this.warmupState = data.warmup_state;
        this.isSynced = true;
        return true;
    }
    arm_unsynced(data) {
        this.arm = undefined;
        this.direction = undefined;
        this.warmupState = undefined;
        this.isSynced = false;
        return true;
    }
    connected(data) {
        this.connectVersion = data.version.join(".");
        this.isConnected = true;
        return true;
    }
    disconnected(data) {
        this.isConnected = false;
        return true;
    }
    locked(data) {
        this.isLocked = true;
        return true;
    }
    unlocked(data) {
        this.isLocked = false;
        return true;
    }
    warmup_completed(data) {
        this.warmupState = "warm";
        return true;
    }
    rssi(data) {
        data.bluetooth_strength = util_1.getStrengthFromRssi(data.rssi);
        const { timestamp } = data;
        this.trigger("bluetooth_strength", data.bluetooth_strength, timestamp);
        this.trigger("rssi", data.rssi, timestamp);
        this.trigger("status", data, timestamp);
    }
    battery_level(data) {
        this.batteryLevel = data.battery_level;
        this.trigger("battery_level", data.battery_level, data.timestamp);
        this.trigger("status", data, data.timestamp);
    }
}
exports.Myo = Myo;
