#!/usr/bin/env python3
"""Local JSON data source for the iStat nano compatibility shim."""

from __future__ import annotations

import argparse
import ctypes
import json
import os
import re
import subprocess
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = 39123
HISTORY_LIMIT = 90

PREVIOUS_NET: dict[str, tuple[float, int, int]] = {}
NET_HISTORY: dict[str, list[list[int]]] = {}
PREVIOUS_CPU_TICKS: list[list[int]] = []
EXTERNAL_IP = ""
EXTERNAL_IP_VALID = False
EXTERNAL_IP_CHECKED_AT = 0.0
EXTERNAL_IP_TTL = 300
CENSOR_EXTERNAL_IP = False
LAST_SNAPSHOT_AT = 0.0
SNAPSHOT_TIMEOUT = 5.0


def run(command: list[str]) -> str:
    try:
        return subprocess.check_output(command, stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return ""


def format_bytes(byte_count: float) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(max(byte_count, 0))
    unit = 0
    while value >= 1024 and unit < len(units) - 1:
        value /= 1024.0
        unit += 1
    if unit == 0:
        return f"{int(value)} {units[unit]}"
    if value >= 10:
        return f"{value:.0f} {units[unit]}"
    return f"{value:.1f} {units[unit]}"


def format_legacy_mb(byte_count: float) -> str:
    units = ["mb", "gb", "tb"]
    value = max(float(byte_count), 0.0) / (1024.0 * 1024.0)
    unit = 0
    while value > 1000 and unit < len(units) - 1:
        value /= 1024.0
        unit += 1
    if unit == 0:
        return f"{value:.0f}{units[unit]}"
    return f"{value:.2f}{units[unit]}"


def format_legacy_count(value: int) -> str:
    if value > 999999:
        return f"{value / 1000000:.1f}mil"
    return f"{max(value, 0):,}"


def format_legacy_rate(byte_count: float) -> str:
    units = ["kb/s", "mb/s", "gb/s"]
    value = max(float(byte_count), 0.0) / 1024.0
    unit = 0
    while value > 1000 and unit < len(units) - 1:
        value /= 1024.0
        unit += 1
    if unit in {0, 1}:
        return f"{value:.0f}{units[unit]}"
    return f"{value:.2f}{units[unit]}"


def format_legacy_total(byte_count: float) -> str:
    units = ["mb", "gb", "tb"]
    value = max(float(byte_count), 0.0) / (1024.0 * 1024.0)
    unit = 0
    while value > 1000 and unit < len(units) - 1:
        value /= 1024.0
        unit += 1
    if unit == 0:
        return f"{value:.0f}{units[unit]}"
    return f"{value:.2f}{units[unit]}"


def parse_int(text: str) -> int:
    try:
        return int(text)
    except Exception:
        return 0


def snapshot_monitor(server: ThreadingHTTPServer) -> None:
    while True:
        if LAST_SNAPSHOT_AT and time.time() - LAST_SNAPSHOT_AT > SNAPSHOT_TIMEOUT:
            print("No /snapshot requests received recently; shutting down iStat nano data server")
            server.shutdown()
            return
        time.sleep(1.0)


def sysctl_int(name: str) -> int:
    return parse_int(run(["sysctl", "-n", name]))


def read_cpu_ticks() -> list[list[int]]:
    try:
        libsystem = ctypes.CDLL("/usr/lib/libSystem.B.dylib")
        host_processor_info = libsystem.host_processor_info
        host_processor_info.argtypes = [
            ctypes.c_uint,
            ctypes.c_int,
            ctypes.POINTER(ctypes.c_uint),
            ctypes.POINTER(ctypes.POINTER(ctypes.c_uint)),
            ctypes.POINTER(ctypes.c_uint),
        ]
        host_processor_info.restype = ctypes.c_int

        processor_count = ctypes.c_uint()
        info_count = ctypes.c_uint()
        info = ctypes.POINTER(ctypes.c_uint)()
        result = host_processor_info(
            libsystem.mach_host_self(),
            2,
            ctypes.byref(processor_count),
            ctypes.byref(info),
            ctypes.byref(info_count),
        )
        if result != 0:
            return []

        ticks = []
        for index in range(processor_count.value):
            offset = index * 4
            ticks.append([int(info[offset + state]) for state in range(4)])


        return ticks
    except Exception:
        return []


def build_cpu() -> list:
    global PREVIOUS_CPU_TICKS

    current = read_cpu_ticks()
    if current and not PREVIOUS_CPU_TICKS:
        PREVIOUS_CPU_TICKS = current
        time.sleep(0.2)
        current = read_cpu_ticks()

    if current and len(current) == len(PREVIOUS_CPU_TICKS):
        per_core = []
        total_system = 0
        total_user = 0
        total_nice = 0

        for now, previous in zip(current, PREVIOUS_CPU_TICKS):
            deltas = [max(0, now[state] - previous[state]) for state in range(4)]
            total_ticks = sum(deltas)
            if total_ticks <= 0:
                core_user = core_system = core_nice = 0
            else:
                core_user = int(round((deltas[0] / total_ticks) * 100))
                core_system = int(round((deltas[1] / total_ticks) * 100))
                core_nice = int(round((deltas[3] / total_ticks) * 100))
            core_busy = min(100, core_user + core_system + core_nice)
            total_system += core_system
            total_user += core_user
            total_nice += core_nice
            per_core.append([core_busy, core_system, core_user, core_nice])

        PREVIOUS_CPU_TICKS = current
        active_cores = max(len(per_core), 1)
        system = int(round(total_system / active_cores))
        user = int(round(total_user / active_cores))
        nice = int(round(total_nice / active_cores))
        idle = max(0, 100 - system - user - nice)
        return [[system, user, nice, idle, 100 - idle], per_core[:8]]

    PREVIOUS_CPU_TICKS = current
    output = run(["top", "-l", "1", "-n", "0"])
    match = re.search(
        r"CPU usage:\s*([\d.]+)% user,\s*([\d.]+)% sys,\s*([\d.]+)% idle",
        output,
    )
    user = int(round(float(match.group(1)))) if match else 0
    system = int(round(float(match.group(2)))) if match else 0
    idle = int(round(float(match.group(3)))) if match else max(0, 100 - user - system)
    nice = max(0, 100 - user - system - idle)
    total_busy = min(100, user + system + nice)
    cores = max(1, sysctl_int("hw.logicalcpu") or os.cpu_count() or 1)
    per_core = [[total_busy, system, user, nice] for _ in range(min(cores, 8))]
    return [[system, user, nice, idle, total_busy], per_core]


def build_memory() -> list:
    page_size = 4096
    output = run(["vm_stat"])
    page_match = re.search(r"page size of (\d+) bytes", output)
    if page_match:
        page_size = parse_int(page_match.group(1)) or page_size

    values: dict[str, int] = {}
    for line in output.splitlines():
        match = re.match(r"([^:]+):\s+([\d.]+)", line.strip())
        if match:
            values[match.group(1)] = parse_int(match.group(2).replace(".", ""))

    free = values.get("Pages free", 0) * page_size
    active = values.get("Pages active", 0) * page_size
    inactive = values.get("Pages inactive", 0) * page_size
    wired = values.get("Pages wired down", 0) * page_size
    compressed = values.get("Pages occupied by compressor", 0) * page_size
    total = sysctl_int("hw.memsize")
    used = active + wired
    if not total:
        total = used + free
    percent = int(round((used / total) * 100)) if total else 0
    pageins = values.get("Pageins", 0)
    pageouts = values.get("Pageouts", 0)
    swap = run(["sysctl", "-n", "vm.swapusage"])
    swap_match = re.search(r"used = ([\d.]+)([MGT])", swap)
    swap_used = f"{swap_match.group(1)}{swap_match.group(2).lower()}b" if swap_match else "0mb"
    return [
        format_legacy_mb(free),
        format_legacy_mb(used),
        format_legacy_mb(active),
        format_legacy_mb(inactive),
        format_legacy_mb(wired),
        percent,
        format_legacy_count(pageins),
        format_legacy_count(pageouts),
        format_legacy_mb(inactive + free),
        swap_used,
        int(round((wired / total) * 100)) if total else 0,
        int(round((active / total) * 100)) if total else 0,
    ]


def build_disks() -> list:
    output = run(["df", "-kP", "-l"])
    rows = []
    for line in output.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 6:
            continue
        total_kb = parse_int(parts[1])
        used_kb = parse_int(parts[2])
        free_kb = parse_int(parts[3])
        mount = parts[5]
        if total_kb <= 0 or parts[0] in {"devfs", "map"}:
            continue
        if mount.startswith("/private/var/vm"):
            continue
        if mount.startswith("/System/Volumes/") and mount != "/System/Volumes/Data":
            continue
        rows.append((mount, total_kb, used_kb, free_kb))

    has_data_volume = any(row[0] == "/System/Volumes/Data" for row in rows)
    disks = []
    for mount, total_kb, used_kb, free_kb in rows:
        if has_data_volume and mount == "/":
            continue
        display_mount = "/" if mount == "/System/Volumes/Data" else mount
        name = "Macintosh HD" if display_mount == "/" else os.path.basename(display_mount) or display_mount
        percent = int(round((used_kb / total_kb) * 100)) if total_kb else 0
        disks.append([
            name,
            percent,
            format_legacy_mb(used_kb * 1024),
            format_legacy_mb(free_kb * 1024),
            display_mount,
            "./images/disk.tiff",
        ])
    return disks[:8]


def interface_ips() -> dict[str, str]:
    ips: dict[str, str] = {}
    current = ""
    for line in run(["ifconfig"]).splitlines():
        if line and not line.startswith("\t") and not line.startswith(" "):
            current = line.split(":", 1)[0]
        match = re.search(r"\binet\s+(\d+\.\d+\.\d+\.\d+)", line)
        if current and match and not match.group(1).startswith("127."):
            ips[current] = match.group(1)
    return ips


def net_counters() -> dict[str, tuple[int, int]]:
    counters: dict[str, tuple[int, int]] = {}
    for line in run(["netstat", "-ibn"]).splitlines()[1:]:
        parts = line.split()
        if len(parts) < 10 or parts[0] == "lo0":
            continue
        name = parts[0].split("*", 1)[0]
        ibytes = parse_int(parts[6])
        obytes = parse_int(parts[9])
        if ibytes or obytes:
            old_in, old_out = counters.get(name, (0, 0))
            counters[name] = (max(old_in, ibytes), max(old_out, obytes))
    return counters


def network_kind(name: str) -> str:
    if name == "en0":
        return "airport"
    if name.startswith("en"):
        return "ethernet"
    if name.startswith("awdl") or name.startswith("llw"):
        return "airport"
    if name.startswith("utun") or name.startswith("ppp"):
        return "vpn"
    return "ethernet"


def build_network() -> list:
    now = time.time()
    ips = interface_ips()
    counters = net_counters()
    rows = []
    for name, ip in sorted(ips.items()):
        rx_total, tx_total = counters.get(name, (0, 0))
        last = PREVIOUS_NET.get(name)
        elapsed = max(now - last[0], 0.001) if last else 1.0
        rx_rate = max(0, int((rx_total - last[1]) / elapsed)) if last else 0
        tx_rate = max(0, int((tx_total - last[2]) / elapsed)) if last else 0
        PREVIOUS_NET[name] = (now, rx_total, tx_total)
        history = NET_HISTORY.setdefault(name, [])
        history.append([int(rx_rate / 1024), int(tx_rate / 1024)])
        while len(history) < HISTORY_LIMIT:
            history.insert(0, [0, 0])
        del history[:-HISTORY_LIMIT]
        display = "Wi-Fi" if name == "en0" else name
        rows.append([
            display,
            network_kind(name),
            ip,
            format_legacy_rate(rx_rate),
            format_legacy_rate(tx_rate),
            format_legacy_total(rx_total),
            format_legacy_total(tx_total),
            [int(rx_rate / 1024), int(tx_rate / 1024)],
            name,
        ])
    return rows[:6]


def build_external_ip() -> tuple[str, bool]:
    global EXTERNAL_IP, EXTERNAL_IP_VALID, EXTERNAL_IP_CHECKED_AT
    now = time.time()
    if now - EXTERNAL_IP_CHECKED_AT < EXTERNAL_IP_TTL:
        return EXTERNAL_IP, EXTERNAL_IP_VALID

    EXTERNAL_IP_CHECKED_AT = now
    try:
        request = Request(
            "https://api.ipify.org",
            headers={"User-Agent": "iStat-Pro-widget-port/1.0"},
        )
        with urlopen(request, timeout=3) as response:
            value = response.read(64).decode("utf-8").strip()
    except Exception:
        value = ""

    if re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", value):
        EXTERNAL_IP = value
        EXTERNAL_IP_VALID = True
    else:
        EXTERNAL_IP = ""
        EXTERNAL_IP_VALID = False
    return EXTERNAL_IP, EXTERNAL_IP_VALID


def censor_external_ip(value: str) -> str:
    return "Censored"


def build_temps() -> list:
    # macOS does not expose SMC sensors through stdlib APIs.
    return []


def build_fans() -> list:
    return []


def build_battery() -> list:
    output = run(["pmset", "-g", "batt"])
    percent_match = re.search(r"(\d+)%", output)
    time_match = re.search(r"(\d+:\d+)", output)
    percent = f"{percent_match.group(1)}%" if percent_match else "0%"
    remaining = time_match.group(1) if time_match else "--:--"
    source = "Battery" if "Battery Power" in output else "AC Power"
    state = "Charging" if "charging" in output.lower() else "Charged"
    cycles = run(["sh", "-c", "system_profiler SPPowerDataType | grep 'Cycle Count' | awk '{print $3}'"])
    health = run(["zsh", "-lc", "/usr/libexec/PlistBuddy -c 'Print \"Maximum Capacity Percent\"' /dev/stdin <<< $(pmset -g ps -xml) 2>/dev/null"])
    if health:
        health = f"{health}%"
    return [remaining, percent, source, state, cycles, health]


def build_uptime() -> str:
    boot = sysctl_int("kern.boottime")
    if not boot:
        match = re.search(r"sec = (\d+)", run(["sysctl", "-n", "kern.boottime"]))
        boot = parse_int(match.group(1)) if match else 0
    seconds = max(0, int(time.time()) - boot) if boot else 0
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    return f"{days}d {hours}h {minutes}m"


def build_load() -> str:
    try:
        return ", ".join(f"{value:.2f}" for value in os.getloadavg())
    except Exception:
        return "0.00 0.00 0.00"


def is_laptop() -> bool:
    model = run(["sysctl", "-n", "hw.model"])
    if "Book" in model:
        return True
    return "InternalBattery" in run(["pmset", "-g", "batt"])


def snapshot() -> dict:
    network = build_network()
    external_ip, external_ip_valid = build_external_ip()
    if CENSOR_EXTERNAL_IP and external_ip_valid:
        external_ip = censor_external_ip(external_ip)
    process_count = max(len(run(["ps", "-axo", "pid"]).splitlines()) - 1, 0)
    return {
        "cpu": build_cpu(),
        "memory": build_memory(),
        "disks": build_disks(),
        "network": network,
        "history": NET_HISTORY,
        "externalIP": external_ip,
        "externalIPValid": external_ip_valid,
        "tempsC": build_temps(),
        "fans": build_fans(),
        "battery": build_battery(),
        "mouseLevel": "0%",
        "keyboardLevel": "0%",
        "isLaptop": is_laptop(),
        "hasBTMouse": False,
        "hasBTKeyboard": False,
        "uptime": build_uptime(),
        "load": build_load(),
        "processinfo": f"{process_count} tasks",
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        global LAST_SNAPSHOT_AT
        if self.path != "/snapshot":
            self.send_response(404)
            self.end_headers()
            return
        LAST_SNAPSHOT_AT = time.time()
        body = json.dumps(snapshot(), separators=(",", ":")).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    global CENSOR_EXTERNAL_IP, LAST_SNAPSHOT_AT
    parser = argparse.ArgumentParser(description="Serve local iStat nano widget data.")
    parser.add_argument("--censor-ext-ip", action="store_true", help="Return a censored external IP value in snapshots.")
    args = parser.parse_args()
    CENSOR_EXTERNAL_IP = args.censor_ext_ip
    LAST_SNAPSHOT_AT = time.time()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    import threading
    monitor = threading.Thread(target=snapshot_monitor, args=(server,), daemon=True)
    monitor.start()
    print(f"iStat nano data server listening on http://{HOST}:{PORT}/snapshot")
    server.serve_forever()


if __name__ == "__main__":
    main()
