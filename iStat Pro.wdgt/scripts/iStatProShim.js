/*
 * Compatibility replacement for the original iStat Pro Dashboard plugin.
 *
 * The legacy widget expects a synchronous global named `iStatPro`. Keep that
 * contract here and back it with cached data from the local Python API without
 * rewriting Tall.js, Wide.js, DiskObject.js, or NetworkObject.js.
 */
(function(global) {
	if(global.iStatPro)
		return;

	var state = {
		cpu: [[0, 0, 0, 100], [[0]]],
		memory: ["", "", "", "", "", 0, ["", ""], ["", ""], "", ""],
		disks: [],
		network: [],
		history: {},
		tempsC: [],
		fans: [],
		battery: ["", "0%", "", "", "", ""],
		mouseLevel: "",
		keyboardLevel: "",
		externalIP: "",
		externalIPValid: false,
		isLaptop: true,
		hasBTMouse: false,
		hasBTKeyboard: false,
		uptime: "",
		load: "",
		processCount: ""
	};
	var apiURL = "http://127.0.0.1:39124/snapshot";
	var deviceSetupChanged = false;
	var hasSnapshot = false;
	var refreshPending = false;
	var readyCallbacks = [];
	var started = false;
	var serverCommand = null;
	var serverLaunchInProgress = false;
	var serverLaunchMessage = "";

	function getBundlePath() {
		var href = "";
		try {
			href = global.location && global.location.href ? global.location.href : "";
			if(!href && global.document && global.document.location)
				href = global.document.location.href || "";
			href = decodeURI(href.split("?")[0].split("#")[0]);
		}
		catch(ex) {
			href = "";
		}
		if(href.indexOf("file://") == 0)
			href = href.replace(/^file:\/+/, "/");
		return href.replace(/\/[^\/]*$/, "/");
	}

	function shellQuote(value) {
		return "'" + String(value).replace(/'/g, "'\"'\"'") + "'";
	}

	function updateWaitingOverlay(message) {
		serverLaunchMessage = message || "";
		var doc = global.document;
		if(!doc)
			return;
		function writeText(node, text) {
			if(!node)
				return;
			if(typeof node.textContent != "undefined")
				node.textContent = text;
			else
				node.innerText = text;
		}
		var waiting = doc.getElementById("server_waiting");
		if(waiting && hasSnapshot)
			waiting.style.display = "none";
		var messageNode = doc.getElementById("server_waiting_message");
		writeText(messageNode, serverLaunchMessage);
		var button = doc.getElementById("server_start_button");
		if(button)
			button.style.display = hasSnapshot ? "none" : "inline-block";
	}

	function stopLocalDataServer() {
		if(serverCommand && serverCommand.cancel) {
			try {
				serverCommand.cancel();
			}
			catch(ex) {}
		}
		serverCommand = null;
		serverLaunchInProgress = false;
	}

	function copyRows(rows) {
		var out = [];
		for(var i = 0; i < rows.length; i++) {
			var row = [];
			for(var j = 0; j < rows[i].length; j++) {
				if(rows[i][j] && rows[i][j].constructor == Array)
					row[j] = copyRows([rows[i][j]])[0];
				else
					row[j] = rows[i][j];
			}
			out.push(row);
		}
		return out;
	}

	function cpuUsage() {
		var cpu = state.cpu || [[0, 0, 0, 100], [[0]]];
		return [
			[cpu[0][0] || 0, cpu[0][1] || 0, cpu[0][2] || 0, cpu[0][3] || 0],
			copyRows(cpu[1] || [[0]])
		];
	}

	function tempsForScale(scale) {
		var useFahrenheit = String(scale) == "1";
		var temps = [];
		for(var i = 0; i < state.tempsC.length; i++) {
			var item = state.tempsC[i];
			var value = useFahrenheit ? Math.round((item[2] * 9 / 5) + 32) : item[2];
			temps.push([item[0], value + (useFahrenheit ? " F" : " C"), value, item[3]]);
		}
		return temps;
	}

	function applySnapshot(snapshot) {
		var previousLaptop = !!state.isLaptop;
		var previousMouse = !!state.hasBTMouse;
		var previousKeyboard = !!state.hasBTKeyboard;
		var firstSnapshot = !hasSnapshot;
		for(var key in snapshot) {
			if(snapshot.hasOwnProperty(key))
				state[key] = snapshot[key];
		}
		hasSnapshot = true;
		deviceSetupChanged = deviceSetupChanged || previousLaptop != !!state.isLaptop || previousMouse != !!state.hasBTMouse || previousKeyboard != !!state.hasBTKeyboard;
		runReadyCallbacks();
		if(firstSnapshot || deviceSetupChanged) {
			refreshPending = true;
			refreshWidgetFromSnapshot();
		}
	}

	function runReadyCallbacks() {
		var waiting = global.document ? global.document.getElementById("server_waiting") : null;
		if(waiting)
			waiting.style.display = "none";
		while(readyCallbacks.length > 0) {
			var callback = readyCallbacks.shift();
			try {
				callback();
			}
			catch(ex) {}
		}
	}

	function refreshWidgetFromSnapshot() {
		if(!global.setupComplete)
			return;
		if(!refreshPending)
			return;
		refreshPending = false;
		try {
			if(global.tsk && global.tsk.setupCPUBars)
				global.tsk.setupCPUBars();
			if(global.wsk && global.wsk.setupCPUBars)
				global.wsk.setupCPUBars();
			global.forceNetworkLayout = true;
			if(global.updateCPU)
				global.updateCPU();
			if(global.updateMemory)
				global.updateMemory();
			if(global.updateDisks)
				global.updateDisks();
			if(global.updateNetwork)
				global.updateNetwork();
			if(global.updateTemps)
				global.updateTemps();
			if(global.updateFans)
				global.updateFans();
			if(global.updateUptime)
				global.updateUptime();
			if(global.updateBattery)
				global.updateBattery();
			if(global.updateActiveLayout)
				global.updateActiveLayout();
		}
		catch(ex) {}
	}

	function pollSnapshot() {
		try {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", apiURL, true);
			xhr.onreadystatechange = function() {
				if(xhr.readyState != 4 || xhr.status != 200)
					return;
				var payload;
				if(typeof JSON != "undefined" && JSON.parse)
					payload = JSON.parse(xhr.responseText);
				else
					payload = eval("(" + xhr.responseText + ")");
				applySnapshot(payload);
			};
			xhr.send(null);
		}
		catch(ex) {}
	}

	function startLocalDataServer() {
		if(hasSnapshot) {
			updateWaitingOverlay("Local data server is already running.");
			return true;
		}
		if(serverLaunchInProgress)
			return true;
		if(!global.widget || !widget.system) {
			updateWaitingOverlay("System command access is disabled.");
			return false;
		}

		var bundlePath = getBundlePath();
		if(!bundlePath) {
			updateWaitingOverlay("Cannot locate widget bundle.");
			return false;
		}

		var scriptPath = bundlePath + "istat_server.py";
		var commandLine = "/usr/bin/env python3 -B " + shellQuote(scriptPath);
		updateWaitingOverlay("Starting the local data server...");
		serverLaunchInProgress = true;

		serverCommand = widget.system(commandLine, function() {
			serverLaunchInProgress = false;
			serverCommand = null;
			if(!hasSnapshot)
				updateWaitingOverlay("Server stopped without returning data.");
		});

		if(serverCommand) {
			serverCommand.onreadoutput = function(data) {
				if(!data)
					return;
				updateWaitingOverlay(String(data).replace(/\s+$/, ""));
			};
			serverCommand.onreaderror = function(data) {
				if(data)
					updateWaitingOverlay(data.replace(/\s+$/, ""));
			};
		}

		pollSnapshot();
		setTimeout(pollSnapshot, 250);
		setTimeout(pollSnapshot, 1000);
		return true;
	}

	pollSnapshot();
	setInterval(pollSnapshot, 1000);

	global.iStatPro = {
		isIntel: function() { return true; },
		isLaptop: function() { return !!state.isLaptop; },
		hasBTMouse: function() { return !!state.hasBTMouse; },
		hasBTKeyboard: function() { return !!state.hasBTKeyboard; },

		cpuUsage: function() { return cpuUsage(); },
		memoryUsage: function() {
			var data = state.memory || [];
			data[6] = data[6] || ["", ""];
			data[7] = data[7] || ["", ""];
			return [data[0], data[1], data[2], data[3], data[4], data[5], [data[6][0], data[6][1]], [data[7][0], data[7][1]], data[8], data[9]];
		},
		diskUsage: function() { return copyRows(state.disks || []); },
		network: function() { return copyRows(state.network || []); },
		historyForInterface: function(name) { return copyRows(state.history[name] || []); },
		temps: function(scale) { return tempsForScale(scale); },
		fans: function() { return copyRows(state.fans || []); },
		battery: function() {
			var data = state.battery || [];
			return [data[0], data[1], data[2], data[3], data[4], data[5]];
		},

		uptime: function() { return state.uptime; },
		load: function() { return state.load; },
		processCount: function() { return state.processCount; },
		externalIP: function() { return state.externalIP || ""; },
		externalIPValid: function() { return !!state.externalIPValid; },
		getMouseLevel: function() { return state.mouseLevel; },
		getKbLevel: function() { return state.keyboardLevel; },

		hasNetworkSetupChanged: function() { return false; },
		hasBtSetupChanged: function() {
			if(!deviceSetupChanged)
				return false;
			deviceSetupChanged = false;
			return true;
		},
		readyForNotifications: function() {},
		setShouldMonitorSMARTTemps: function() {},
		setNeedsSMARTUpdate: function() {},
		resetBandwidth: function() {},
		togglePPP: function() {},
		installIntelModule: function() {},

		openDisk: function(path) {
			if(global.widget && widget.openURL)
				widget.openURL("file://" + path);
		},
		copyTextToClipboard: function(text) {
			global.__iStatProClipboardText = text;
		},
		getselfpid: function() { return "-1"; },
		getPsName: function() { return ""; },
		getAppPath: function() { return ""; },
		startWhenReady: function(callback) {
			if(started)
				return;
			started = true;
			if(hasSnapshot) {
				callback();
			} else {
				readyCallbacks.push(callback);
			}
		},

		// Future API integration point.
		updateSnapshot: function(snapshot) {
			applySnapshot(snapshot);
		},

		startLocalDataServer: startLocalDataServer,
		stopLocalDataServer: stopLocalDataServer,
		getLocalDataServerStatus: function() {
			return hasSnapshot ? "ready" : (serverLaunchInProgress ? "starting" : "waiting");
		},
		getLocalDataServerMessage: function() {
			return serverLaunchMessage;
		}
	};

	if(global.addEventListener)
		global.addEventListener("unload", stopLocalDataServer, false);
	else
		global.onunload = stopLocalDataServer;
})(this);
