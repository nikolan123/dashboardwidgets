# iStat Pro

![screenshot](https://web.archive.org/web/20141210151627if_/https://www.apple.com/downloads/dashboard/status/images/istatpro_20080724110109.jpg)

## About iStat pro

A highly configurable widget that lets you monitor every aspect of your system. It features 9 sections that monitor everything from cpu, memory and disk usage to which processes are using the most cpu. You have complete control over which sections you want to monitor and even the detail level in some cases.

- Sections: CPU, Memory, Disks, Network, Battery, Load & Uptime, Temperatures, Fans, Processes… iStat pro can do it all. Don’t want to monitor them all? Simply disable the sections you don’t want from the back of the widget.

- Drag and drop section reordering: Simply move the mouse over a section and a drag handle will appear. Click on it and drag the section to wherever you like then release the mouse.

- Control what you see: From the display tab on the back of the widget you can choose which disks, network interfaces, temperature sensors and fans are displayed.

## How to run (tested on Tahoe)

You need Python installed for this.

Install the widget in [Widget Porting Toolkit](https://github.com/nikolan123/WidgetPortingToolkit), in runtime tweaks tick "Don't ask when running system commands".

## Native plugin replacement status

The original `iStatPro.bundle` plugin has been replaced by `scripts/iStatProShim.js`, which waits for a local data server before running the widget setup. Start the server from this widget directory:

```bash
python3 -B istat_server.py
```

The widget reads `http://127.0.0.1:39124/snapshot` once per second. If the server is not running, the widget shows a startup warning instead of loading with empty data.
The waiting screen also has a `Start Python Server` button that launches `istat_server.py` from the widget bundle with `widget.system()` and keeps that process alive until the widget is closed.

- [x] Widget boots without the legacy native `iStatPro.bundle`.
- [x] Widget startup waits for the first successful server snapshot before building the layout.
- [x] CPU summary and CPU graph data are populated from `top` / `sysctl`.
- [x] Memory data is populated from `vm_stat`, `sysctl`, and `vm.swapusage`.
- [x] Disk usage is populated from `df`.
- [x] Network interfaces, IP addresses, totals, rates, and graph history are populated from `ifconfig` and `netstat`.
- [x] External IP is fetched by `istat_server.py` and passed through the local snapshot API.
- [x] Battery percentage, time, power source, charging state, cycle count, and health are populated from `pmset`, `PlistBuddy`, and `system_profiler`.
- [x] Uptime, load average, and process count are populated from macOS command output.
- [x] `openDisk` works.
- [ ] Temperature sensors are not implemented; the Python stdlib does not expose SMC sensor data.
- [ ] Fan sensors are not implemented; this probably needs an SMC/IOKit collector or helper tool.
- [ ] Bluetooth mouse and keyboard battery status are not implemented.
- [ ] Per-process app icon lookup is not implemented; process rows fall back to the widget's default icon.
- [ ] PPP/VPN connect/disconnect actions are stubbed.
- [ ] SMART temperature monitoring controls are stubbed.
- [ ] Clipboard copying is currently a shim stub and does not write to the macOS pasteboard yet.
