var selectedTab = 0;

function shouldToggleImageForTab(tab) {
	if(tab == selectedTab)
		return false;
	return true;
}

function selectTab(tab) {
	if(tab == selectedTab)
		return;	

	if(selectedTab == 0)
		 tab_image0.src = "./images/back/tabs_general.png"
	else if(selectedTab == 1)	
		 tab_image1.src = "./images/back/tabs_sections.png"
	else if(selectedTab == 2)	
		 tab_image2.src = "./images/back/tabs_updates.png"

	selectedTab = tab;

	if(tab == 0){
		 tab_general.style.display = 'block';
		 tab_sections.style.display = 'none';
		 tab_update.style.display = 'none';
	} else if(tab == 1){
		 tab_general.style.display = 'none';
		 tab_sections.style.display = 'block';
		 tab_update.style.display = 'none';
	} else if(tab == 2){
		 tab_general.style.display = 'none';
		 tab_sections.style.display = 'none';
		 tab_update.style.display = 'block';
	}
}

var backside = false;

var flipShown = false;

function doneMouseUp(event){
	hideElement(document.getElementById("updateWindowNew"))
	hideElement(document.getElementById("updateWindowCurrent"))
	hideModeSelectorWithoutAnimation();	
	var front = document.getElementById("front");
	var back = document.getElementById("behind");


	if (window.widget)
		widget.prepareForTransition("ToFront");
		front.style.display="block";
		back.style.display="none";
		
	if (window.widget)
		setTimeout ('widget.performTransition();', 0);
	backside = false;
	overviewPosition = 0;
	isSelectorVisible = false;
	forceWait = false;
	
	if(displayTimer){
		clearInterval(displayTimer);
		displayTimer = null;
	}
	
	onshow();
	window.resizeTo(246,149);
}

function setupDiskMenus() {
	var diskData = iStatNano.diskUsage();

	disk0Menu.options.length = 0;
	for(x=0;x<diskData.length;x++){
		disk0Menu[x]=new Option(diskData[x][0], diskData[x][0], false);
	}

	disk1Menu.options.length = 0;
	if(diskData.length >= 2){
		for(x=0;x<diskData.length;x++){
			disk1Menu[x]=new Option(diskData[x][0], diskData[x][0], false);
		}
	}		
	
	disk2Menu.options.length = 0;
	if(diskData.length >= 3){
		for(x=0;x<diskData.length;x++){
			disk2Menu[x]=new Option(diskData[x][0], diskData[x][0], false);
		}
	}
	var usedDisks = Array();;
	for(x=0;x<diskData.length;x++){
		usedDisks[x] = false;
	}
		
	for(y=0;y<3;y++){
		var found = false;
		if(widget.preferenceForKey("disk"+y)){
			for(x=0;x<diskData.length;x++){
				if(diskData[x][0] == widget.preferenceForKey("disk"+y)){
					usedDisks[x] = true;
					getElement("disk"+y+"MenuText").innerHTML = diskData[x][0];
					//getElement("disk"+y+"MenuText").style.color = "white";
					getElement("disk"+y+"Menu").selectedIndex = x;
					found = true;
					break;
				}
			}
		}
		
		if(found == true)
			continue;

		if(diskData.length > y){
			for(x=0;x<diskData.length;x++){
				if(usedDisks[x] == false){
					usedDisks[x] = true;
					getElement("disk"+y+"MenuText").innerHTML = diskData[x][0];
					//getElement("disk"+y+"MenuText").style.color = "white";
					getElement("disk"+y+"Menu").selectedIndex = x;
					found = true;
					break;
				}
			}			
		}
		
		if(found == false){
			getElement("disk"+y+"MenuText").innerHTML = "N/A";
			//getElement("disk"+y+"MenuText").style.color = "#838383";
		}

	}
}

function setupNetworkMenu() {
	iStatNano.hasNetworkSetupChanged();
	var interfaces = iStatNano.network();

	if(!widget.preferenceForKey("primaryNetworkInterface") && interfaces.length > 0)
		widget.setPreferenceForKey(interfaces[0][0],"primaryNetworkInterface");

	networkMenu.options.length = 0;
	if(interfaces.length > 0){
		for(x=0;x<interfaces.length;x++){
			networkMenu[x]=new Option(interfaces[x][0], interfaces[x][0], false);
			if(interfaces[x][0] == widget.preferenceForKey("primaryNetworkInterface")){
				networkInterfaceMenuText.innerHTML = interfaces[x][0];	
				networkMenu.selectedIndex = x;
			}
		}
	} else {
		networkInterfaceMenuText.innerHTML = "N/A";		
	}
}

function checkIntelBundleTimer() {
	if(isIntel && !iStatNano.needsIntelBundle()){
		intelModuleButton.style.background = "url(./images/back/button_install_done.png)";
	}

	if(displayTimer){
		clearInterval(displayTimer);
		displayTimer = null;
	}
	displayTimer = setInterval("checkIfIntelModuleInstalled()",300);
	
}

function checkIfIntelModuleInstalled() {
	if(iStatNano.hasDiskSetupChanged()){
		setupDiskMenus();
	}

	if(iStatNano.hasNetworkSetupChanged()){
		setupNetworkMenu();
	}
		
	if((isIntel && iStatNano.wasIntelModuleInstalled() && !iStatNano.needsIntelBundle()) || !backside){
		clearInterval(displayTimer);	
		intelModuleButton.style.background = "url(./images/back/button_install_done.png)";
		
		var temps = iStatNano.temps(widget.preferenceForKey("degrees"));
		if(!widget.preferenceForKey("primaryTempSensor") && temps.length > 0)
			widget.setPreferenceForKey(temps[0][0],"primaryTempSensor");
	
		tempsMenu.options.length = 0;
		for(x=0;x<temps.length;x++) {
			tempsMenu[x]=new Option(temps[x][0], temps[x][0], false);
			if(temps[x][0] == widget.preferenceForKey("primaryTempSensor")){
				tempSensorMenuText.innerHTML = temps[x][0];	
				tempsMenu.selectedIndex = x;
			}
		}

		if(tempsMenu.options.length == 0){
			tempsMenu[0] = new Option("N/A","", false);		
			tempSensorMenuText.innerHTML = "N/A";	
		}

		var fans = iStatNano.fans();
		if(!widget.preferenceForKey("primaryFanSensor") && fans.length > 0)
			widget.setPreferenceForKey(fans[0][0],"primaryFanSensor");
	
		fansMenu.options.length = 0;
		for(x=0;x<fans.length;x++){
			fansMenu[x]=new Option(fans[x][0], fans[x][0], false);
			if(fans[x][0] == widget.preferenceForKey("primaryFanSensor")){
				fanSensorMenuText.innerHTML = fans[x][0];
				fansMenu.selectedIndex = x;
			}
		}

		if(fansMenu.options.length == 0){
			fansMenu[0] = new Option("N/A","", false);		
			fanSensorMenuText.innerHTML = "N/A";	
		}
	}
}

function showbackside(event){
	hideElement(document.getElementById("updateWindowNew"))
	hideElement(document.getElementById("updateWindowCurrent"))
	onhide();

	if(!widget.preferenceForKey("bar_mode"))
		widget.setPreferenceForKey("0","bar_mode");


	if(widget.preferenceForKey("bar_mode") == "0")
		barsMenuText.innerHTML = "Simple";
	else {
		barsMenuText.innerHTML = "Detailed";
		barModeMenu.selectedIndex = 1;
	}

	if(!widget.preferenceForKey("degrees"))
		widget.setPreferenceForKey(0,"degrees");

	if(!widget.preferenceForKey("processesMode"))
		widget.setPreferenceForKey("cpu","processesMode");

	if(widget.preferenceForKey("processesMode") == "cpu")
		processesMenuText.innerHTML = "CPU Usage";
	else {
		processesMenuText.innerHTML = "Memory Usage";
		processesMenu.selectedIndex = 1;
	}

	if(!widget.preferenceForKey("animation"))
		widget.setPreferenceForKey("on","animation");

	if(widget.preferenceForKey("animation") == "on")
		animationMenuText.innerHTML = "On";
	else {
		animationMenuText.innerHTML = "Off";
		animationMenu.selectedIndex = 1;
	}
				
	if(widget.preferenceForKey("degrees") == 0)
		degreesMenuText.innerHTML = "Celsius";
	else if(widget.preferenceForKey("degrees") == 1)
		degreesMenuText.innerHTML = "Fahrenheit";
	else if(widget.preferenceForKey("degrees") == 2)
		degreesMenuText.innerHTML = "Kelvin";
		
	
	degreesMenu.selectedIndex = widget.preferenceForKey("degrees");

	if(!widget.preferenceForKey("updateChecker"))
		widget.setPreferenceForKey("on","updateChecker");
	
	if(widget.preferenceForKey("updateChecker") == "on")
		updateMenuText.innerHTML = "Daily";
	else {
		updateMenuText.innerHTML = "Off";
		updateCheckerMenu.selectedIndex = 1;
	}
	
	if(isIntel && iStatNano.needsIntelBundle()){
		intelModuleButton.style.background = "url(./images/back/button_install.png)";
		checkIntelBundleTimer();
	} else if(isIntel && !iStatNano.needsIntelBundle()){
		intelModuleButton.style.background = "url(./images/back/button_install_done.png)";
	} else if(!isIntel){
		intelModuleButton.style.background = "url(./images/back/button_install_ppc.png)";
	}
	
	setupDiskMenus();
			
	setupNetworkMenu();

	var fans = iStatNano.fans();
	if(!widget.preferenceForKey("primaryFanSensor") && fans.length > 0)
		widget.setPreferenceForKey(fans[0][0],"primaryFanSensor");

	fansMenu.options.length = 0;
	for(x=0;x<fans.length;x++){
		fansMenu[x]=new Option(fans[x][0], fans[x][0], false);
		if(fans[x][0] == widget.preferenceForKey("primaryFanSensor")){
			fanSensorMenuText.innerHTML = fans[x][0];
			fansMenu.selectedIndex = x;
		}
	}
	
	if(fansMenu.options.length == 0){
		fansMenu[0] = new Option("N/A","", false);		
		fanSensorMenuText.innerHTML = "N/A";	
	}
	

	var temps = iStatNano.temps(widget.preferenceForKey("degrees"));
	if(!widget.preferenceForKey("primaryTempSensor") && temps.length > 0)
		widget.setPreferenceForKey(temps[0][0],"primaryTempSensor");
	
	tempsMenu.options.length = 0;
	for(x=0;x<temps.length;x++) {
		tempsMenu[x]=new Option(temps[x][0], temps[x][0], false);
		if(temps[x][0] == widget.preferenceForKey("primaryTempSensor")){
			tempSensorMenuText.innerHTML = temps[x][0];	
			tempsMenu.selectedIndex = x;
		}
	}
	
	if(tempsMenu.options.length == 0){
		tempsMenu[0] = new Option("N/A","", false);		
		tempSensorMenuText.innerHTML = "N/A";	
	}
	
	if(!widget.preferenceForKey("skinv2"))
		widget.setPreferenceForKey("blue","skinv2");

	switch(widget.preferenceForKey("skinv2")){
		case "blue":
			skinMenuText.innerHTML = "Blue";
			skinMenu.selectedIndex = 0;
		break	
		case "graphite":
			skinMenuText.innerHTML = "Graphite";
			skinMenu.selectedIndex = 1;
		break	
		case "green":
			skinMenuText.innerHTML = "Green";
			skinMenu.selectedIndex = 2;
		break	
		case "grey":
			skinMenuText.innerHTML = "Grey";
			skinMenu.selectedIndex = 3;
		break	
		case "pink":
			skinMenuText.innerHTML = "Pink";
			skinMenu.selectedIndex = 4;
		break
		case "putty":
			skinMenuText.innerHTML = "Putty";
			skinMenu.selectedIndex = 5;
		break
		case "red":
			skinMenuText.innerHTML = "Red";
			skinMenu.selectedIndex = 6;
		break
	}
	
	setup_smart_timer_menu();
		
	window.resizeTo(256,354);	

	var front = document.getElementById("front");
	var back = document.getElementById("behind");

	if (window.widget)
		widget.prepareForTransition("ToBack");
	
	front.style.display="none";
	back.style.display="block";

	if (window.widget)		
		setTimeout ('widget.performTransition();', 0);	
	backside = true;	
}


function setup_smart_timer_menu() {
	switch(widget.preferenceForKey("smart_timer")){
		case "0":
			document.getElementById("smartTimerMenuText").innerHTML = "Off";
			document.getElementById("smartTimerMenu").selectedIndex = 0;
		break	
		case "1":
			document.getElementById("smartTimerMenuText").innerHTML = "5 mins";
			document.getElementById("smartTimerMenu").selectedIndex = 1;
		break	
		case "2":
			document.getElementById("smartTimerMenuText").innerHTML = "15 mins";
			document.getElementById("smartTimerMenu").selectedIndex = 2;
		break	
		case "3":
			document.getElementById("smartTimerMenuText").innerHTML = "60 mins";
			document.getElementById("smartTimerMenu").selectedIndex = 3;
		break	
	}
}

function changeSmartTimer(newTimer) {
	widget.setPreferenceForKey(newTimer.value, "smart_timer");
	setup_smart_timer_menu();
	clearInterval(smart_timer);
	smart_timer = null;
	switch(widget.preferenceForKey("smart_timer")){
		case "1":
			smart_timer = setInterval("updateSMART()",300000);
		break	
		case "2":
			smart_timer = setInterval("updateSMART()",900000);
		break	
		case "3":
			smart_timer = setInterval("updateSMART()",3600000);
		break	
	}
	
	if(widget.preferenceForKey("smart_timer") != '0')
		iStatNano.setShouldMonitorSMARTTemps(1)
	else
		iStatNano.setShouldMonitorSMARTTemps(0)
	alert('timer = ' + smart_timer);
}
