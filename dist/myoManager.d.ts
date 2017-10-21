import { Myo } from "./myo";
export declare class MyoManager {
    private defaults;
    private eventHandlers;
    private eventHandlersAll;
    private eventCounter;
    lockingPolicy: string;
    myos: Myo[];
    private socket;
    onError(): void;
    setLockingPolicy(policy: string): this;
    trigger(eventName: string, ...args: any[]): this;
    on(name: string, fn: Function): string;
    off(name: string): this;
    connect(newAppID: string): void;
    disconnect(): void;
    sendCommand(data: any): void;
    handleMessage(msg: MessageEvent): void;
}
