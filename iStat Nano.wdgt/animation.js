var mode_selector_animation_interval = 50;
var section_transition_interval = 45;

var opacity = 0;
var opacity2 = 0;
var ipOpacity = 0;
var debug = false;
var displayTimer = null;
var currentSelection;
var previousSelection;

var selectedButton;
var didSelectButton = false;
var isSelectorVisible;
var animation = null;
var animation2 = null;
var ipAnimation = null;
var forceWait = false;
var modeDelays = Array();

modeDelays[0] = 0;
modeDelays[1] = 0;
modeDelays[2] = 0.10;
modeDelays[3] = 0.10;
modeDelays[4] = 0.20;
modeDelays[5] = 0.20;
modeDelays[6] = 0.30;
modeDelays[7] = 0.30;
modeDelays[8] = 0.40;
modeDelays[9] = 0.40;

var modeDelaysOut = Array();
modeDelaysOut[0] = 0.4;
modeDelaysOut[1] = 0.4;
modeDelaysOut[2] = 0.30;
modeDelaysOut[3] = 0.30;
modeDelaysOut[4] = 0.20;
modeDelaysOut[5] = 0.20;
modeDelaysOut[6] = 0.10;
modeDelaysOut[7] = 0.10;
modeDelaysOut[8] = 0.0;
modeDelaysOut[9] = 0.0;

function showIPWindow () {
	if(ipAnimation != null)
		return;
	
	document.getElementById("ipWindow").style.display = "block";
	document.getElementById("ipWindow").style.opacity = 1;
	
//	ipOpacity = 0;
//	ipAnimation = setInterval("fadeInIPWindow()",20);
//	ipAnimation = setInterval("fadeOutIPWindow()",20);
	ipOpacity = 10;
	setTimeout("prepareIPWindowFade()",1000);
}

function prepareIPWindowFade() {
	ipAnimation = setInterval("fadeOutIPWindow()",20);
}

function fadeInIPWindow() {
	document.getElementById("ipWindow").style.opacity = ipOpacity / 10;
	if(ipOpacity >= 10) {
		clearInterval(ipAnimation);
		setTimeout("prepareIPWindowFade()",1000);
	}
	ipOpacity = ipOpacity + 2;
}

function fadeOutIPWindow() {
	document.getElementById("ipWindow").style.opacity = (ipOpacity / 10);
	if(ipOpacity <= 0) {
		document.getElementById("ipWindow").style.display = "none";
		clearInterval(ipAnimation);
		ipAnimation = null;
		ipOpacity = 0;
	}
	ipOpacity = ipOpacity - 2;
}

function selectSectionWithAnimation(section) {
	if(section == previousSelection){
		return;
	}
	clearInterval(displayTimer);
	displayTimer = null;
	fireTimer();
	
	modeselectorcontainer.style.display = 'none';
	section.style.display = 'block';
	
	if(widget.preferenceForKey("animation") == "off") {
		currentSelection.style.opacity = 0;	
		section.style.opacity = 1;	
		currentSelection = section;
		previousSelection = currentSelection;
		onshow();
		modeselectorcontainer.style.display = 'block';
		return;
	}
		
	if(animation2 != null) {
		clearInterval(animation2);
		animation2 = null;
		if(previousSelection != section){
			previousSelection.style.opacity = 0;
			previousSelection.style.display = 'none';
		}		
		if(currentSelection != section)
			currentSelection.style.opacity = 1.0;
			
		previousSelection = currentSelection;
	}
	currentSelection = section;
	opacity2 = 10;
	animation2 = setInterval("fadeOutSection()",section_transition_interval);
}

function selectSection(section, left, top, buttonIndex, pref) {
	if(!isSelectorVisible)
		return;
		
	currentSelection.style.display = 'block';
	clearInterval(displayTimer);
	displayTimer = null;
	widget.setPreferenceForKey(pref,"mode");
	fireTimer();
	modeButtonHighlight.style.top = top;
	modeButtonHighlight.style.left = left;
	modeButtonHighlight.style.opacity = 1;
	selectedButton = buttonIndex;
	didSelectButton = true;

	currentSelection.style.opacity = 0;
	section.style.opacity = 1;
	currentSelection = section;
	previousSelection = section;
	section.style.display = 'block';
	hideModeSelector(true);
	forceWait = true;
}

function toggleModeSelector() {
	forceWait = false;
	if(!modeButtons[0])
		return;
	if(isSelectorVisible)
		hideModeSelector(true);
	else
		showModeSelector();
}

function fadeOutSection() {
	previousSelection.style.opacity = (opacity2 / 10);
	if(opacity2 <= 0) {
		clearInterval(animation2);
		animation2 = null;
		opacity2 = 0;
		animation2 = setInterval("fadeInSection()",section_transition_interval);
	}
	opacity2 = opacity2 - 2;
}

function fadeInSection() {
	currentSelection.style.opacity = (opacity2 / 10);
	if(opacity2 >= 10) {
		clearInterval(animation2);
		animation2 = null;
		previousSelection.style.display = 'none';
		previousSelection = currentSelection;
		onshow();
		modeselectorcontainer.style.display = 'block';
	}
	opacity2 = opacity2 + 2;
}	


function hideModeSelector (force) {
	if(forceWait) {
		if(window.event.pageX == -1)
			forceWait = false;
		return
	}
	
	if(window.event.pageX != -1 && force == false)
		return;
		
	isSelectorVisible = false;
	modeselectorbg.style.opacity = 1;
	
	if(widget.preferenceForKey("animation") == "off") {
		modeselectorbg.style.opacity = 0;
		info.style.opacity = 0;
		help.style.opacity = 0;
		modeButtonHighlight.style.opacity = 0;
		for(y=0;y<10;y++) {
			modeButtons[y].style.opacity = 0;
		}
		if(is_hidden == false)
			onshow();
		return;
	}


	
	for(y=0;y<10;y++) {
		modeButtons[y].style.opacity = 1 + modeDelays[y];
	}	
	opacity = 15;
	if(animation != null) {
		clearInterval(animation);
		animation = null;
	}
	animation = setInterval("decreaseOpacity()", mode_selector_animation_interval);
}

function showModeSelector() {
	if(document.getElementById("updateWindowNew").style.display == "block" || document.getElementById("intelInstallWindow").style.display == "block")
		return;
	
	if(forceWait)
		return
	if(isSelectorVisible)
		return;
		
	isSelectorVisible = true;
	
	if(widget.preferenceForKey("animation") == "off") {
		modeselectorbg.style.opacity = 1;
		info.style.opacity = 1;
		help.style.opacity = 1;
		for(y=0;y<10;y++) {
			modeButtons[y].style.opacity = 1;
		}
		return;
	}

	modeselectorbg.style.opacity = 0;
	for(y=0;y<10;y++) {
		modeButtons[y].style.opacity = 0 - modeDelays[y];
	}	

	opacity = 0;
	if(animation != null) {
		clearInterval(animation);
		animation = null;
	}
	animation = setInterval("increaseOpacity()",mode_selector_animation_interval);
}
	
function increaseOpacity(to) {
	modeselectorbg.style.opacity = (opacity / 10);
	info.style.opacity = (opacity / 10);
	help.style.opacity = (opacity / 10);
	for(y=0;y<10;y++) {
		modeButtons[y].style.opacity = (opacity / 10) - modeDelays[y];				
	}
	if(opacity >= 15) {
		clearInterval(animation);
		animation = null;
		onshow();
	}
	opacity = opacity + 2;
}

function decreaseOpacity(to) {
	modeselectorbg.style.opacity = (opacity / 10);
	info.style.opacity = (opacity / 10);
	help.style.opacity = (opacity / 10);
	for(y=0;y<10;y++) {
		if(didSelectButton && selectedButton == y) {
			modeButtonHighlight.style.opacity = (opacity / 10) - modeDelaysOut[y] + 0.5;
			modeButtons[y].style.opacity = (opacity / 10) - modeDelaysOut[y] + 0.5;
		} else {			
			modeButtons[y].style.opacity = (opacity / 10) - modeDelaysOut[y];
		}
	}
	if(opacity <= -5) {
		modeButtonHighlight.style.opacity = 0;
		didSelectButton = false;
		clearInterval(animation);
		animation = null;
		if(is_hidden == false)
			onshow();
	}
	opacity = opacity - 2;
}

function hideModeSelectorWithoutAnimation() {
	modeselectorbg.style.opacity = 0;
	info.style.opacity = 0;
	help.style.opacity = 0;
	for(y=0;y<10;y++) {
		modeButtons[y].style.opacity = 0;
	}
	opacity = 0;
	isSelectorVisible = false;
}
