	function setup() {
		var cpuData = iStatNano.cpuUsage();
		if(cpuData[1].length == 2) {
			cpu_mask.style.background = "url(./images/cpu_mask_2cores.png)";
			cpus = 2;
		} else if(cpuData[1].length == 4) {
			cpu_mask.style.background = "url(./images/cpu_mask_4cores.png)";
			cpus = 4;
		} else if(cpuData[1].length == 8){
			cpu_base.style.background = "url(./images/cpu_bg_8cores.png)";
			cpu_4bar_simple.style.display = "none";
			cpu_8bar_simple.style.display = "block";
			cpu_4bar_advanced.style.display = "none";
			cpu_8bar_advanced.style.display = "block";
			cpu_mask.style.background = "url(./images/cpu_mask_8cores.png)";
			cpus = 8;
		} else {
			cpus = 1;
		}
	
		if(cpus == 8){
			cpuBars_simple[0] = getElement("cpu_simple_8bar0");
			cpuBars_simple[1] = getElement("cpu_simple_8bar1");
			cpuBars_simple[2] = getElement("cpu_simple_8bar2");
			cpuBars_simple[3] = getElement("cpu_simple_8bar3");
			cpuBars_simple[4] = getElement("cpu_simple_8bar4");
			cpuBars_simple[5] = getElement("cpu_simple_8bar5");
			cpuBars_simple[6] = getElement("cpu_simple_8bar6");
			cpuBars_simple[7] = getElement("cpu_simple_8bar7");
			cpuBarShadows_simple[0] = getElement("cpu_simple_8barshadow0");
			cpuBarShadows_simple[1] = getElement("cpu_simple_8barshadow1");
			cpuBarShadows_simple[2] = getElement("cpu_simple_8barshadow2");
			cpuBarShadows_simple[3] = getElement("cpu_simple_8barshadow3");
			cpuBarShadows_simple[4] = getElement("cpu_simple_8barshadow4");
			cpuBarShadows_simple[5] = getElement("cpu_simple_8barshadow5");
			cpuBarShadows_simple[6] = getElement("cpu_simple_8barshadow6");
			cpuBarShadows_simple[7] = getElement("cpu_simple_8barshadow7");
			cpuBars_advanced[0] = Array(getElement("cpu_advanced_8bar0_part0"), getElement("cpu_advanced_8bar0_part1"), getElement("cpu_advanced_8bar0_part2"));
			cpuBars_advanced[1] = Array(getElement("cpu_advanced_8bar1_part0"), getElement("cpu_advanced_8bar1_part1"), getElement("cpu_advanced_8bar1_part2"));
			cpuBars_advanced[2] = Array(getElement("cpu_advanced_8bar2_part0"), getElement("cpu_advanced_8bar2_part1"), getElement("cpu_advanced_8bar2_part2"));
			cpuBars_advanced[3] = Array(getElement("cpu_advanced_8bar3_part0"), getElement("cpu_advanced_8bar3_part1"), getElement("cpu_advanced_8bar3_part2"));
			cpuBars_advanced[4] = Array(getElement("cpu_advanced_8bar4_part0"), getElement("cpu_advanced_8bar4_part1"), getElement("cpu_advanced_8bar4_part2"));
			cpuBars_advanced[5] = Array(getElement("cpu_advanced_8bar5_part0"), getElement("cpu_advanced_8bar5_part1"), getElement("cpu_advanced_8bar5_part2"));
			cpuBars_advanced[6] = Array(getElement("cpu_advanced_8bar6_part0"), getElement("cpu_advanced_8bar6_part1"), getElement("cpu_advanced_8bar6_part2"));
			cpuBars_advanced[7] = Array(getElement("cpu_advanced_8bar7_part0"), getElement("cpu_advanced_8bar7_part1"), getElement("cpu_advanced_8bar7_part2"));
			cpuBarShadows_advanced[0] = getElement("cpu_advanced_8barshadow0");
			cpuBarShadows_advanced[1] = getElement("cpu_advanced_8barshadow1");
			cpuBarShadows_advanced[2] = getElement("cpu_advanced_8barshadow2");
			cpuBarShadows_advanced[3] = getElement("cpu_advanced_8barshadow3");
			cpuBarShadows_advanced[4] = getElement("cpu_advanced_8barshadow4");
			cpuBarShadows_advanced[5] = getElement("cpu_advanced_8barshadow5");
			cpuBarShadows_advanced[6] = getElement("cpu_advanced_8barshadow6");
			cpuBarShadows_advanced[7] = getElement("cpu_advanced_8barshadow7");
		} else {
			cpuBars_simple[0] = getElement("cpu_simple_4bar0");
			cpuBars_simple[1] = getElement("cpu_simple_4bar1");
			cpuBars_simple[2] = getElement("cpu_simple_4bar2");
			cpuBars_simple[3] = getElement("cpu_simple_4bar3");
			cpuBarShadows_simple[0] = getElement("cpu_simple_4barshadow0");
			cpuBarShadows_simple[1] = getElement("cpu_simple_4barshadow1");
			cpuBarShadows_simple[2] = getElement("cpu_simple_4barshadow2");
			cpuBarShadows_simple[3] = getElement("cpu_simple_4barshadow3");
			cpuBars_advanced[0] = Array(getElement("cpu_advanced_4bar0_part0"), getElement("cpu_advanced_4bar0_part1"), getElement("cpu_advanced_4bar0_part2"));
			cpuBars_advanced[1] = Array(getElement("cpu_advanced_4bar1_part0"), getElement("cpu_advanced_4bar1_part1"), getElement("cpu_advanced_4bar1_part2"));
			cpuBars_advanced[2] = Array(getElement("cpu_advanced_4bar2_part0"), getElement("cpu_advanced_4bar2_part1"), getElement("cpu_advanced_4bar2_part2"));
			cpuBars_advanced[3] = Array(getElement("cpu_advanced_4bar3_part0"), getElement("cpu_advanced_4bar3_part1"), getElement("cpu_advanced_4bar3_part2"));
			cpuBarShadows_advanced[0] = getElement("cpu_advanced_4barshadow0");
			cpuBarShadows_advanced[1] = getElement("cpu_advanced_4barshadow1");
			cpuBarShadows_advanced[2] = getElement("cpu_advanced_4barshadow2");
			cpuBarShadows_advanced[3] = getElement("cpu_advanced_4barshadow3");
		}

		if(!(widget.preferenceForKey("mode"))){
			widget.setPreferenceForKey("overview","mode");
		} else if(widget.preferenceForKey("mode") == "home"){
			widget.setPreferenceForKey("overview","mode");
		}
								
		document.addEventListener("keyup", keyUp, true);
		document.addEventListener("keydown", keyDown, true);
	
		modeButtons[0] = getElement("button0");
		modeButtons[1] = getElement("button5");
		modeButtons[2] = getElement("button1");
		modeButtons[3] = getElement("button6");
		modeButtons[4] = getElement("button2");
		modeButtons[5] = getElement("button7");
		modeButtons[6] = getElement("button3");
		modeButtons[7] = getElement("button8");
		modeButtons[8] = getElement("button4");
		modeButtons[9] = getElement("button9");
		
		diskItems[0] = Array(getElement("disk_name0"),getElement("disk_icon0"),getElement("disk_space0"),getElement("disk_bar0"),getElement("disk_barshadow0"));
		diskItems[1] = Array(getElement("disk_name1"),getElement("disk_icon1"),getElement("disk_space1"),getElement("disk_bar1"),getElement("disk_barshadow1"));
		diskItems[2] = Array(getElement("disk_name2"),getElement("disk_icon2"),getElement("disk_space2"),getElement("disk_bar2"),getElement("disk_barshadow2"));

		processItems[0] = Array(getElement("process_name0"),getElement("process_cpu0"),getElement("process_icon0"));
		processItems[1] = Array(getElement("process_name1"),getElement("process_cpu1"),getElement("process_icon1"));
		processItems[2] = Array(getElement("process_name2"),getElement("process_cpu2"),getElement("process_icon2"));
		processItems[3] = Array(getElement("process_name3"),getElement("process_cpu3"),getElement("process_icon3"));
		processItems[4] = Array(getElement("process_name4"),getElement("process_cpu4"),getElement("process_icon4"));

		tempItems[0] = Array(getElement("temp_name0"),getElement("temp_value0"));
		tempItems[1] = Array(getElement("temp_name1"),getElement("temp_value1"));
		tempItems[2] = Array(getElement("temp_name2"),getElement("temp_value2"));
		tempItems[3] = Array(getElement("temp_name3"),getElement("temp_value3"));
		tempItems[4] = Array(getElement("temp_name4"),getElement("temp_value4"));
		tempItems[5] = Array(getElement("temp_name5"),getElement("temp_value5"));
		tempItems[6] = Array(getElement("temp_name6"),getElement("temp_value6"));

		fanItems[0] = Array(getElement("fan_name0"),getElement("fan_value0"));
		fanItems[1] = Array(getElement("fan_name1"),getElement("fan_value1"));
		fanItems[2] = Array(getElement("fan_name2"),getElement("fan_value2"));
		fanItems[3] = Array(getElement("fan_name3"),getElement("fan_value3"));
		fanItems[4] = Array(getElement("fan_name4"),getElement("fan_value4"));
		fanItems[5] = Array(getElement("fan_name5"),getElement("fan_value5"));
		fanItems[6] = Array(getElement("fan_name6"),getElement("fan_value6"));

		if(widget.preferenceForKey("mode")=='cpu'){
			previousSelection = cpuSection;
		} else if(widget.preferenceForKey("mode")=='overview'){
			previousSelection = overviewSection;
		} else if(widget.preferenceForKey("mode")=='mem'){
			previousSelection = memorySection;
		} else if(widget.preferenceForKey("mode")=='hd'){
			previousSelection = disksSection;
		} else if(widget.preferenceForKey("mode")=='battery'){
			previousSelection = batterySection;
		} else if(widget.preferenceForKey("mode")=='net'){
			previousSelection = networkSection;
		} else if(widget.preferenceForKey("mode")=='processes'){
			previousSelection = processesSection;
		} else if(widget.preferenceForKey("mode")=='uptime'){
			previousSelection = uptimeSection;
		} else if(widget.preferenceForKey("mode")=='temps'){
			previousSelection = tempsSection;
		} else if(widget.preferenceForKey("mode")=='fans'){
			previousSelection =fansSection;
		}
		
		previousSelection.style.opacity = 1;
		currentSelection = previousSelection;
		currentSelection.style.display = 'block';
		widget.onshow=onshow;
		widget.onhide=onhide;
		fireTimer();
		onshow();
		setTimeout("getExtIP()",1000);
	}
