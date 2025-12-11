// src/lib/network/deviceDetector.ts

import type { DeviceInfo, DeviceConfig } from "./types";

export class DeviceDetector {
  private config: DeviceConfig;

  constructor(config: DeviceConfig) {
    this.config = config;
  }

  private getBrowserInfo(): { name: string; version: string } {
    // Server-side safe browser detection
    if (typeof navigator === "undefined") {
      return { name: "Server", version: "1.0" };
    }

    const userAgent = navigator.userAgent;
    let browserName = "Unknown Browser";
    let version = "0.0";

    // Chrome
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browserName = "Chrome Browser";
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : "0";
    }
    // Firefox
    else if (userAgent.includes("Firefox")) {
      browserName = "Firefox Browser";
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : "0";
    }
    // Safari
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browserName = "Safari Browser";
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : "0";
    }
    // Edge
    else if (userAgent.includes("Edg")) {
      browserName = "Edge Browser";
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : "0";
    }

    return { name: browserName, version };
  }

  private getOSInfo(): { name: string; version: string } {
    if (typeof navigator === "undefined") {
      return { name: "Server OS", version: "1.0" };
    }

    const userAgent = navigator.userAgent;
    let osName = "Unknown OS";
    let osVersion = "0.0";

    // Windows
    if (userAgent.includes("Windows")) {
      osName = "Windows";
      if (userAgent.includes("Windows NT 10.0")) osVersion = "10";
      else if (userAgent.includes("Windows NT 6.3")) osVersion = "8.1";
      else if (userAgent.includes("Windows NT 6.2")) osVersion = "8";
      else if (userAgent.includes("Windows NT 6.1")) osVersion = "7";
      else osVersion = "11"; // Default to latest
    }
    // macOS
    else if (userAgent.includes("Mac OS X")) {
      osName = "macOS";
      const match = userAgent.match(/Mac OS X (\d+_\d+)/);
      osVersion = match ? match[1].replace("_", ".") : "13.0";
    }
    // Linux
    else if (userAgent.includes("Linux")) {
      osName = "Linux";
      osVersion = "1.0";
    }
    // Mobile
    else if (userAgent.includes("iPhone")) {
      osName = "iOS";
      const match = userAgent.match(/OS (\d+_\d+)/);
      osVersion = match ? match[1].replace("_", ".") : "16.0";
    } else if (userAgent.includes("Android")) {
      osName = "Android";
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      osVersion = match ? match[1] : "13.0";
    }

    return { name: osName, version: osVersion };
  }

  public getDeviceInfo(): DeviceInfo {
    const browser = this.getBrowserInfo();
    const os = this.getOSInfo();

    return {
      name: browser.name,
      type: "web",
      os: os.name,
      osVersion: os.version,
      udid: this.config.deviceId,
      pushToken: this.config.pushToken,
    };
  }

  public getDeviceHeaders(): Record<string, string> {
    const deviceInfo = this.getDeviceInfo();

    return {
      "Device-Name": deviceInfo.name,
      "Device-OS-Version": `${deviceInfo.os} ${deviceInfo.osVersion}`,
      "Device-UDID": deviceInfo.udid,
      "Device-Push-Token": deviceInfo.pushToken,
      "Device-Type": deviceInfo.type,
    };
  }
}
