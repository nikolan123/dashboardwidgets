var totalFans = -1;
var totalTemps = -1;
var totalNetworkAdapters = -1;
var totalDisks = -1;
var disksToShow = 0;
var extIP = 'Unavilable';
var current_battery_source = null;
var current_net_icon = null;
var valid_ip = false;

var change_overview_bar_mode = true;
var change_cpu_bar_mode = true;
var change_memory_bar_mode = true;

var network_icons = Array();
network_icons['ethernet'] = './images/net_icon_ethernet.png';
network_icons['modem'] = './images/net_icon_modem.png';
network_icons['firewire'] = './images/net_icon_firewire.png';
network_icons['bluetooth'] = './images/net_icon_bluetooth.png';
network_icons['airport'] = './images/net_icon_airport4.png';

function updateDisks () {
	var disks;
	var diskData = iStatNano.diskUsage();
	
	if(diskData.length != totalDisks){
		totalDisks = diskData.length;
		if(diskData.length == 0){
			disk0.style.display = 'none'
			disk1.style.display = 'none'
			disk2.style.display = 'none'
			disksToShow = 0;
			disk_mask.style.background = "url(./images/bar_disks_mask1.png)";
		} else if(diskData.length == 1){
			disk0.style.display = 'block'
			disk1.style.display = 'none'
			disk2.style.display = 'none'
			disk_mask.style.background = "url(./images/bar_disks_mask1.png)";
			disksToShow = 1;
		} else if(diskData.length == 2 ){
			disk0.style.display = 'block'
			disk1.style.display = 'block'
			disk2.style.display = 'none'			
			disk_mask.style.background = "url(./images/bar_disks_mask2.png)";
			disksToShow = 2;
		} else if(diskData.length >= 2){
			disk0.style.display = 'block'
			disk1.style.display = 'block'
			disk2.style.display = 'block'
			disk_mask.style.background = "url(./images/bar_disks_mask3.png)";
			disksToShow = 3;
		}
	}

	if(!widget.preferenceForKey("disk0") && diskData.length > 0)
		widget.setPreferenceForKey(diskData[0][0],"disk0");

	var usedDisks = Array();;
	for(x=0;x<diskData.length;x++){
		usedDisks[x] = false;
	}
	
	for(y=0;y<disksToShow;y++){
		var found = false;
		for(x=0;x<diskData.length;x++){
			if(diskData[x][0] == widget.preferenceForKey("disk"+y) && usedDisks[x] == false){
				diskItems[y][0].innerHTML = diskData[x][0];
				diskItems[y][1].src = diskData[x][5];
				diskItems[y][2].innerHTML = diskData[x][3] + "&nbsp;free";
				diskItems[y][3].style.width = Math.floor(parseInt(diskData[x][1]) * 1.69);
				diskItems[y][4].style.left = Math.floor((parseInt(diskData[x][1]) * 1.69) + 21);
				found = true;
				usedDisks[x] = true;
				break;
			}
		}
		
		if(!found && diskData.length > 0){
			for(x=0;x<diskData.length;x++){
				if(usedDisks[x] == false){
					diskItems[y][0].innerHTML = diskData[x][0];
					diskItems[y][1].src = diskData[x][5];
					diskItems[y][2].innerHTML = diskData[x][3] + "&nbsp;free";
					diskItems[y][3].style.width = Math.floor(parseInt(diskData[x][1]) * 1.69);
					diskItems[y][4].style.left = Math.floor((parseInt(diskData[x][1]) * 1.69) + 21);
					usedDisks[x] = true;
					break;
				}
			}
		}
	}
}

function getProcesses() {
	if(!widget.preferenceForKey("processesMode"))
		widget.setPreferenceForKey("cpu","processesMode");

	if(widget.preferenceForKey("processesMode") == 'cpu')
		widget.system('ps -arcwwwxo "pid %cpu command" | egrep "PID|$1" | grep -v grep | head -7 | tail -6 | awk \'{print "<pid>"$1"</pid><cpu>"$2"</cpu><name>"$3,$4,$5"</name></item>"}\'',processesOut);
	else
		widget.system('ps -amcwwwxo "pid rss command"  | egrep "PID|$1" | grep -v grep | head -7 | tail -6 | awk \'{print "<pid>"$1"</pid><cpu>"$2"</cpu><name>"$3,$4,$5"</name></item>"}\'',processesOut);
}

function processesOut(data) {
	procSplit=data.outputString.split("</item>");
	y = 0;
	for(x=0;x<procSplit.length-1;x++){
		pid = procSplit[x].substring(procSplit[x].indexOf("<pid>")+5,procSplit[x].indexOf("</pid>"));
		if(pid == iStatNano.getselfpid())
			continue;
		
		if(procSplit[x].substring(procSplit[x].indexOf("<name>")+6,procSplit[x].indexOf("</name>")).match("DashboardClient")){
			name = iStatNano.getPsName(pid).replace("DashboardClient","");
		} else {
			name = procSplit[x].substring(procSplit[x].indexOf("<name>")+6,procSplit[x].indexOf("</name>"));
		}
		
		icon = iStatNano.getAppPath(pid, name);
		if(icon == "")
			icon = "./images/defaultProcessIcon.tiff";
	
		processItems[y][0].innerHTML = name;
		if(widget.preferenceForKey("processesMode") == 'cpu')
			processItems[y][1].innerHTML = procSplit[x].substring(procSplit[x].indexOf("<cpu>")+5,procSplit[x].indexOf("</cpu>"))+"%";
		else
			processItems[y][1].innerHTML = Math.round(parseInt(procSplit[x].substring(procSplit[x].indexOf("<cpu>")+5,procSplit[x].indexOf("</cpu>"))) / 1024) + "MB";
		processItems[y][2].src = icon;
		y++;
		if(y == 5)
			return;
	}
}

function updateTemps() {
	if(!widget.preferenceForKey("degrees"))
		widget.setPreferenceForKey(0,"degrees");

	var temps = iStatNano.temps(widget.preferenceForKey("degrees"));

	if(temps.length != totalTemps) {
		if(temps.length == 0) {
			getElement("temps_available").style.display = 'none';
			getElement("no_temps").style.display = 'block';
		} else {
			getElement("temps_available").style.display = 'block';
			getElement("no_temps").style.display = 'none';
		}
		totalTemps = temps.length;
	}

	y = 0;
	for(x=0;x<temps.length;x++){
		tempItems[y][0].innerHTML = temps[x][0];
		tempItems[y][1].innerHTML = temps[x][1];
		y++;
		if(y == 7)
			return;	
	}	
}

function updateFans() {
	var fans = iStatNano.fans();
	
	if(fans.length != totalFans) {
		if(fans.length == 0) {
			getElement("fan_available").style.display = 'none';
			getElement("no_fans").style.display = 'block';
		} else {
			getElement("fan_available").style.display = 'block';
			getElement("no_fans").style.display = 'none';
		}
		totalFans = fans.length;
	}
	
	y = 0;
	for(x=0;x<fans.length;x++){
		fanItems[y][0].innerHTML = fans[x][0];
		fanItems[y][1].innerHTML = fans[x][1];
		y++;
		if(y == 7)
			return;	
	}	
}

function updateNetwork() {
	var change = false;
	if(iStatNano.hasNetworkSetupChanged())
		change = true;
		
	var network = iStatNano.network();
	
	if(network.length != totalNetworkAdapters) {
		if(network.length == 0) {
			getElement("network_available").style.display = 'none';
			getElement("no_network").style.display = 'block';
			totalNetworkAdapters = 0;
			return;
		} else {
			getElement("network_available").style.display = 'block';
			getElement("no_network").style.display = 'none';
		}
		totalNetworkAdapters = network.length;
		change = true;
	}
	
	if(network.length == 0)
		return;
	
	var found = false;
	var item;
	if(widget.preferenceForKey("primaryNetworkInterface")) {
		for(x=0;x<network.length;x++){
			if(network[x][0] == widget.preferenceForKey("primaryNetworkInterface")) {
				found = true;
				item = network[x];
				break;
			}
		}	
	}
	
	if(!found)
		item = network[0];
	
	if(change){
		if(network_icons[item[1].toLowerCase()]) {
			if(network_icons[item[1].toLowerCase()] != current_net_icon){
				getElement("network_icon").src = network_icons[item[1].toLowerCase()]
				current_net_icon = network_icons[item[1].toLowerCase()]
			}
		} else {
			if(network_icons['ethernet'] != current_net_icon){
				getElement("network_icon").src = network_icons['ethernet']
				current_net_icon = network_icons['ethernet'];
			}
		}
		network_name.innerText = item[0];
		network_ip.innerText = item[2];
		getExtIP();
	}
	
	network_in.innerText = item[3];
	network_out.innerText = item[4];
	network_totalin.innerText = item[5];
	network_totalout.innerText = item[6];
}

function getExtIP(){
	extIP = iStatNano.externalIP();
	if(iStatNano.externalIPValid() && extIP.length > 0 && extIP.length < 32){
		external_ip.innerHTML = extIP;
		valid_ip = true;
	} else {
		valid_ip = false;
		external_ip.innerHTML = "Unknown";
	}
}

function updateUptime() {
	uptime.innerHTML = iStatNano.uptime();
	loadavg.innerHTML = iStatNano.load();
	processes.innerHTML = iStatNano.processinfo();
}

function updateCPU() {
	if(change_cpu_bar_mode){
		if(!widget.preferenceForKey("bar_mode"))
			widget.setPreferenceForKey("0","bar_mode");
		if(widget.preferenceForKey("bar_mode") == '0') {
			cpu_section_advanced.style.display = 'none';
			cpu_section_simple.style.display = 'block';
		} else {
			cpu_section_advanced.style.display = 'block';
			cpu_section_simple.style.display = 'none';
		}
		change_cpu_bar_mode = false;
	}
	
	var cpuData = iStatNano.cpuUsage();
	var graphMultiplier;
	if(cpus == 8)
		graphMultiplier = 1;
	else
		graphMultiplier = 2.04;
		
	for(x=0;x<cpus;x++){
		if(cpuData[1].length > x){
			if(widget.preferenceForKey("bar_mode") == '0') {
				cpuBars_simple[x].style.width = Math.floor(cpuData[1][x][0] * graphMultiplier);
				if(x > 3)
					cpuBarShadows_simple[x].style.left = Math.max(125,Math.floor(cpuData[1][x][0] * graphMultiplier) + 125);
				else
					cpuBarShadows_simple[x].style.left = Math.max(21,Math.floor(cpuData[1][x][0] * graphMultiplier) + 21);
			} else {
				if(x > 3)
					var offset = 125;
				else
					var offset = 21;
					
				var user = Math.floor(cpuData[1][x][2] * graphMultiplier);
				var sys = Math.floor(cpuData[1][x][1] * graphMultiplier);
				var nice = Math.floor(cpuData[1][x][3] * graphMultiplier);
				cpuBars_advanced[x][0].style.left = offset;
				cpuBars_advanced[x][0].style.width = user;
				offset += user;
				cpuBars_advanced[x][1].style.left = offset;
				cpuBars_advanced[x][1].style.width = sys;
				offset += sys;
				cpuBars_advanced[x][2].style.left = offset;
				cpuBars_advanced[x][2].style.width = nice;
				offset += nice;
				
				var shadowOffset = user + sys + nice;
				if(isNaN(shadowOffset))
					shadowOffset = 0;
				
				if(x > 3)
					cpuBarShadows_advanced[x].style.left = Math.max(125,shadowOffset + 125);
				else
					cpuBarShadows_advanced[x].style.left = Math.max(21,shadowOffset + 21);
			}
		}
	}

	if(widget.preferenceForKey("bar_mode") == '0') {
		cpu_user_simple.innerHTML = cpuData[0][1] + "%";
		cpu_system_simple.innerHTML = cpuData[0][0] + "%";
		cpu_nice_simple.innerHTML = cpuData[0][2] + "%";
		cpu_idle_simple.innerHTML = cpuData[0][3] + "%";
	} else {
		cpu_user_advanced.innerHTML = cpuData[0][1] + "%";
		cpu_system_advanced.innerHTML = cpuData[0][0] + "%";
		cpu_nice_advanced.innerHTML = cpuData[0][2] + "%";
		cpu_idle_advanced.innerHTML = cpuData[0][3] + "%";
	}
}

function updateMemory() {
	if(change_memory_bar_mode){
		if(!widget.preferenceForKey("bar_mode"))
			widget.setPreferenceForKey("0","bar_mode");
		if(widget.preferenceForKey("bar_mode") == '0') {
			memory_section_advanced.style.display = 'none';
			memory_section_simple.style.display = 'block';
			memory_text_container.style.left = 0;
		} else {
			memory_text_container.style.left = 9;
			memory_section_advanced.style.display = 'block';
			memory_section_simple.style.display = 'none';
		}
		change_memory_bar_mode = false;
	}
	
	var data = iStatNano.memoryUsage();
	mem_active.innerHTML = data[2];
	mem_wired.innerHTML = data[4];
	mem_inactive.innerHTML = data[3];
	mem_used.innerHTML = data[1];
	mem_free.innerHTML = data[0];
	mem_pageins.innerHTML = data[6];
	mem_pageouts.innerHTML = data[7];
	mem_swap.innerHTML = data[9];

	if(widget.preferenceForKey("bar_mode") == '0') {
		mem_bar.style.width = Math.round(data[5]) * 2.04;
		mem_bar_shadow.style.left = 21 + (Math.round(data[5]) * 2.04);
	} else {
		mem_bar_wired.style.width = Math.round(data[10]) * 2.04;
		mem_bar_active.style.left = 21 + (Math.round(data[10]) * 2.04);
		mem_bar_active.style.width = Math.round(data[11]) * 2.04;
		mem_bar_shadow_advanced.style.left = 21 + (Math.round(data[10]) * 2.04) + (Math.round(data[11]) * 2.04);
	}
}

function updateBattery() {
	if(!iStatNano.isLaptop()) {
		if(document.getElementById("no_battery").style.display == "none"){
			document.getElementById("no_battery").style.display = "block";
			document.getElementById("battery_available").style.display = "none";
		}
		return;
	}
	
	if(document.getElementById("no_battery").style.display == "block"){
		document.getElementById("no_battery").style.display = "none";
		document.getElementById("battery_available").style.display = "block";
	}
	
	var data = iStatNano.battery();

	if(current_battery_source != data[2]){
		current_battery_source = data[2];
		if(data[2] == "AC Power")
			getElement("battery_source_image").src = './images/battery_mains.png';
		else
			getElement("battery_source_image").src = './images/battery_nomains.png';
	}
	
	battery_cycles.innerHTML = data[4];
	battery_health.innerHTML = data[5];
	battery_source.innerHTML = data[2];
	battery_time.innerHTML = data[0];
	battery_percentage.innerHTML = data[1];
	battery_bar.style.width = parseInt(data[1]) * 2.04;
}

function updateOverview() {
	if(change_overview_bar_mode){
		if(!widget.preferenceForKey("bar_mode"))
			widget.setPreferenceForKey("0","bar_mode");
		if(widget.preferenceForKey("bar_mode") == '0') {
			overview_graphs_advanced.style.display = 'none';
			overview_graphs_simple.style.display = 'block';
		} else {
			overview_graphs_advanced.style.display = 'block';
			overview_graphs_simple.style.display = 'none';
		}
		change_overview_bar_mode = false;
	}
	
	var cpuData = iStatNano.cpuUsage();
	if(widget.preferenceForKey("bar_mode") == '0') {
		overview_cpu.style.width = Math.floor(cpuData[0][4] * 1.06);
		overview_cpushadow.style.left = Math.floor(cpuData[0][4] * 1.06) + 21;
	} else {
		var offset = 21;
		overview_cpu_user.style.width = Math.floor(cpuData[0][1] * 1.06);
		offset += Math.floor(cpuData[0][1] * 1.06);
		overview_cpu_sys.style.left = offset;
		overview_cpu_sys.style.width = Math.floor(cpuData[0][0] * 1.06);	
		offset += Math.floor(cpuData[0][0] * 1.06);
		overview_cpu_nice.style.left = offset;
		overview_cpu_nice.style.width = Math.floor(cpuData[0][2] * 1.06);	
		offset += Math.floor(cpuData[0][2] * 1.06);
		overview_cpushadow.style.left = offset;
	}
	
	if(overviewPosition == 0){
		var memoryData = iStatNano.memoryUsage();
		if(widget.preferenceForKey("bar_mode") == '0') {
			overview_mem.style.width = Math.floor(memoryData[5] * 1.06);
			overview_memoryshadow.style.left = Math.floor(memoryData[5] * 1.06) + 21;
		} else {
			overview_mem_wired.style.width = Math.floor(memoryData[10] * 1.06);
			overview_mem_active.style.left = 21 + (Math.floor(memoryData[10]) * 1.06);
			overview_mem_active.style.width = Math.floor(memoryData[11] * 1.06);
			overview_memoryshadow.style.left = 21 + (Math.floor(memoryData[10]) * 1.06) + (Math.floor(memoryData[11]) * 1.06);
		}
	}
		
	if(overviewPosition == 0){
		var diskData = iStatNano.diskUsage();
		if(!widget.preferenceForKey("disk0") && diskData.length > 0)
			widget.setPreferenceForKey(diskData[0][0],"disk0");
		
		var found = false;
		for(x=0;x<diskData.length;x++){
			if(diskData[x][0] == widget.preferenceForKey("disk0")){
				overview_diskname.innerHTML = diskData[x][0];
				overview_disk.style.width = Math.floor(diskData[x][1] * 1.06);
				overview_disksshadow.style.left = Math.floor(diskData[x][1] * 1.06) + 21;
				found = true;
			}
		}
		
		if(!found && diskData.length > 0){
			overview_diskname.innerHTML = diskData[0][0];
			overview_disk.style.width = Math.floor(diskData[0][1] * 1.06);
			overview_disksshadow.style.left = Math.floor(diskData[0][1] * 1.06) + 21;
		}
	}
		
	iStatNano.hasNetworkSetupChanged();
	var networkData = iStatNano.network();
	if(networkData.length > 0){		
		var found = false;
		var item;
		if(widget.preferenceForKey("primaryNetworkInterface")) {
			for(x=0;x<networkData.length;x++){
				if(networkData[x][0] == widget.preferenceForKey("primaryNetworkInterface")) {
					found = true;
					item = networkData[x];
					break;
				}
			}	
		}
		
		if(!found)
			item = networkData[0];

		overview_in.innerHTML = item[3];
		overview_out.innerHTML = item[4];
	} else {
		overview_in.innerHTML = '0kb/s'
		overview_out.innerHTML = '0kb/s'
	}
	
	if(overviewPosition == 0){
		if(!widget.preferenceForKey("degrees"))
			widget.setPreferenceForKey(0,"degrees");

		var tempsData = iStatNano.temps(widget.preferenceForKey("degrees"));
		if(!widget.preferenceForKey("primaryTempSensor") && tempsData.length > 0)
			widget.setPreferenceForKey(tempsData[0][0],"primaryTempSensor");

		var found = false;
		for(x=0;x<tempsData.length;x++){
			if(tempsData[x][0] == widget.preferenceForKey("primaryTempSensor")){
				overview_temp.innerHTML = tempsData[x][1];
				found = true;
			}
		}
		
		if(!found && tempsData.length > 0)
			overview_temp.innerHTML = tempsData[0][1];
		else if(!found && tempsData.length == 0)
			overview_temp.innerHTML = "N/A";
	}
		
	if(overviewPosition == 0){
		var fansData = iStatNano.fans();
		if(!widget.preferenceForKey("primaryFanSensor") && fansData.length > 0)
			widget.setPreferenceForKey(fansData[0][0],"primaryFanSensor");
		
		var found = false;
		for(x=0;x<fansData.length;x++){
			if(fansData[x][0] == widget.preferenceForKey("primaryFanSensor")){
				overview_fan.innerHTML = fansData[x][1];
				found = true;
			}
		}
		
		if(!found && fansData.length > 0)
			overview_fan.innerHTML = fansData[0][1];
		else if(!found && fansData.length == 0)
			overview_fan.innerHTML = "N/A";
	}
		
	if(overviewPosition == 0){
		var uptimeData = iStatNano.uptime();
		overview_uptime.innerHTML = uptimeData;
	}
	
	overviewPosition++;
	if(overviewPosition == 7)
		overviewPosition = 0;
}

function updateSMART() {
	iStatNano.setNeedsSMARTUpdate();
}
	
