/** Britishgraphics.co.uk DashPaste
 ** Don't be evil
 ** Authors:
 ** Yarek Tyshchenko
 ** George Tyshchenko
 ** Version: 1.1.0
 **/

//Global Vars
var updateURL = 'http://britishgraphics.co.uk/files/software/version.php?app=dashpaste';
var currentVersion = '1.1.0';
var lastUpdateCheckTime;
var xmlhttp;
/**** Flipping Code ****/
function showBack() {
	var front = document.getElementById('front');
	var back = document.getElementById('back');
	if (window.widget)
		widget.prepareForTransition('ToBack');
	front.style.display = 'none';
	back.style.display = 'block';
	if (window.widget)
		setTimeout ('widget.performTransition();', 0);
}

function hideBack() {
	savePref('name');
	var front = document.getElementById('front');
	var back = document.getElementById('back');
	if (window.widget)
		widget.prepareForTransition('ToFront');
	back.style.display = 'none';
	front.style.display = 'block';
	if (window.widget)
		setTimeout ('widget.performTransition();', 0);
}
if (window.widget)
{
	widget.onshow = checkLastUpdateTime;
	widget.onhide = onhide;
}
function onhide(){
}
function reset(){
	widget.setPreferenceForKey('','pasteSystem');
	widget.setPreferenceForKey('','linkType');
	widget.setPreferenceForKey('','syntax');
	//widget.setPreferenceForKey('','update');
	widget.setPreferenceForKey('','name');
}
function openurl(aurl){
	widget.openURL(aurl);
}
/**** Widget Code ****/
function paste(data){
	document.getElementById('lastPasteLabel').innerHTML = "Sending data to:";
	document.getElementById('lastPaste').innerHTML = widget.preferenceForKey('pasteSystem');
	document.getElementById('lastPaste').onclick = function(){ openurl("https://"+
		widget.preferenceForKey('pasteSystem')) };
	savePref('name');
	xmlhttp.abort();
	xmlhttp.open('POST',getPasteURL());
	if (widget.preferenceForKey('pasteSystem') == 'paste.rs') {
		xmlhttp.setRequestHeader('Content-Type','text/plain; charset=utf-8');
	} else {
		xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	}
	xmlhttp.onreadystatechange = parse;
	xmlhttp.send(getVars(data));
}
function parse(){
	if (xmlhttp.readyState == 4) {
		// only if "OK"
		document.getElementById('lastPasteLabel').innerHTML = "Response: " + xmlhttp.status;
		if (xmlhttp.status == 200 || xmlhttp.status == 201 || xmlhttp.status == 206){
			var rtext = xmlhttp.responseText;
			var url = getLink(rtext, xmlhttp);
			if (url && url.indexOf('http') === 0) {
				document.getElementById('lastPaste').innerHTML = url;
				document.getElementById('lastPaste').onclick = function(){ openurl(url) };
				copy(url);
			} else {
				document.getElementById('lastPasteLabel').innerHTML = "Posted, but link parse failed";
				document.getElementById('lastPaste').innerHTML = "Open upaste.de";
				document.getElementById('lastPaste').onclick = function(){ openurl("https://upaste.de/") };
			}
		} else if (xmlhttp.status == 404){
			document.getElementById('lastPasteLabel').innerHTML = "Service down";
			document.getElementById('prog').style.background = "url('Images/logo.png') no-repeat";
		}
	}
}
function getVars(data){
	var nick = encodeURIComponent(widget.preferenceForKey('name'));
	//var desc = encodeURIComponent(document.getElementById('desc').value);
	var desc = encodeURIComponent('Pasted with DashPaste');
	var lang = encodeURIComponent(widget.preferenceForKey('syntax'));
	var body = encodeURIComponent(data);
	if (widget.preferenceForKey('pasteSystem') == 'paste.rs') {
		return data;
	}
	var vars = "text=" + body;
	if (widget.preferenceForKey('syntax')) {
		vars += "&type=" + lang;
	}
	return vars;
}
function getPasteURL(){
	if (widget.preferenceForKey('pasteSystem') == 'paste.rs')
		return 'https://paste.rs/';
	return 'https://upaste.de/';
}
function getLink(text, req){
	if (widget.preferenceForKey('pasteSystem') == 'paste.rs') {
		var pasteRsMatch = text.match(/https?:\/\/paste\.rs\/[^\s<"]+/);
		if (pasteRsMatch && pasteRsMatch[0]) {
			return pasteRsMatch[0];
		}
		if (req && req.responseURL && req.responseURL.match(/^https?:\/\/paste\.rs\/\S+/)) {
			return req.responseURL;
		}
	}
	// Some servers redirect directly to the created paste URL.
	if (req && req.responseURL && req.responseURL.match(/^https?:\/\/upaste\.de\/\S+/)) {
		return req.responseURL;
	}
	// Some servers expose the redirect target in headers.
	if (req && req.getResponseHeader) {
		var location = req.getResponseHeader('Location');
		if (location) {
			if (location.indexOf('http') === 0) return location;
			if (location.charAt(0) === '/') return "https://upaste.de" + location;
		}
	}
	// Absolute URLs in response body.
	var match = text.match(/https?:\/\/upaste\.de\/[^\s<"]+/);
	if (match && match[0]) {
		return match[0];
	}
	// Relative href in HTML response body.
	match = text.match(/href=["'](\/[^"']+)["']/i);
	if (match && match[1]) {
		return "https://upaste.de" + match[1];
	}
	return "";
}
function copy(data){
	result = widget.system("/usr/bin/pbcopy", onCopy);
	result.write(data);
	result.close();
}
function onCopy(){
	document.getElementById('lastPasteLabel').innerHTML = "Copied to buffer:";
	document.getElementById('prog').style.background = "url('Images/logo.png') no-repeat";
	
}
function pbget(){
	document.getElementById('inputs').style.display = "block";
	document.getElementById('cover').style.display = "none";
	document.getElementById('lastPasteLabel').innerHTML = "Getting buffer";
	document.getElementById('lastPaste').innerHTML = "";
	document.getElementById('prog').style.background = "url('Images/logo.gif') no-repeat";
	result = widget.system("/usr/bin/pbpaste",onGet);
}
function onGet(){
	if (result.outputString){
		paste(result.outputString);
	}else {
		document.getElementById('lastPasteLabel').innerHTML = "Pasteboard is empty";
		document.getElementById('prog').style.background = "url('Images/logo.png') no-repeat";
	}
}
function checkSyntax(){
	var linkType = document.getElementById('linkType');
	var syntax = document.getElementById('syntax');
	var syntaxText = document.getElementById('syntaxText');
	var codeLabel = document.getElementById('codeLabel');
	if (widget.preferenceForKey('pasteSystem') == 'paste.rs') {
		linkType.disabled = true;
		syntax.disabled = true;
		syntaxText.innerText = "n/a (paste.rs)";
		codeLabel.style.opacity = 0.5;
		return;
	}
	syntax.disabled = false;
	codeLabel.style.opacity = 1.0;
	var array = [
		{key:'', value:'', name:'none', def:true},
		{key:'bash', value:'bash', name:'Bash'},
		{key:'c', value:'c', name:'C'},
		{key:'cpp', value:'cpp', name:'C++'},
		{key:'css', value:'css', name:'CSS'},
		{key:'diff', value:'diff', name:'Diff'},
		{key:'go', value:'go', name:'Go'},
		{key:'html', value:'html', name:'HTML'},
		{key:'java', value:'java', name:'Java'},
		{key:'javascript', value:'javascript', name:'JavaScript'},
		{key:'json', value:'json', name:'JSON'},
		{key:'php', value:'php', name:'PHP'},
		{key:'python', value:'python', name:'Python'},
		{key:'ruby', value:'ruby', name:'Ruby'},
		{key:'rust', value:'rust', name:'Rust'},
		{key:'sql', value:'sql', name:'SQL'},
		{key:'toml', value:'toml', name:'TOML'},
		{key:'typescript', value:'typescript', name:'TypeScript'},
		{key:'xml', value:'xml', name:'XML'},
		{key:'yaml', value:'yaml', name:'YAML'},
	];
	linkType.disabled = true;
	var select = syntax;
	var defindex;
	// remove all children
	while (select.hasChildNodes())
		select.removeChild(select.firstChild);
	var pref = widget.preferenceForKey('syntax');
	for (var i = 0; i < array.length; ++i)
	{
		var element = document.createElement("option");
		element.innerText = array[i].name;
		element.value = array[i].value;
		select.appendChild (element);
		if (pref == array[i].key){
			select.selectedIndex = i;
			document.getElementById("syntaxText").innerHTML = array[i].name;
		}
		if (array[i].def)
			defindex = i;
	}
	if (!select.selectedIndex){
		select.selectedIndex = defindex;
		document.getElementById("syntaxText").innerText = array[defindex].name;
		savePref('syntax');
	}
}
function initPrefs(){
	// Paste System
	var pref = widget.preferenceForKey('pasteSystem');
	var pasteSystem = document.getElementById('pasteSystem');
	if ( !pref || pref.length < 1 )
		widget.setPreferenceForKey('upaste.de', 'pasteSystem');
	for (var i = 0; i < pasteSystem.options.length; i++ ){
		if (pref == pasteSystem.options[i].value){
			pasteSystem.selectedIndex = i;
		}
	}
	//Link Type
	var pref = widget.preferenceForKey('linkType');
	var linkType = document.getElementById('linkType');
	if ( !pref || pref.length < 1 )
		widget.setPreferenceForKey('html', 'linkType');
	for (var i = 0; i < linkType.options.length; i++ ){
		if (pref == linkType.options[i].value){
			linkType.selectedIndex = i;
		}
	}
	//Syntax
	var pref = widget.preferenceForKey('syntax');
	if ( !pref || pref.length < 1 )
		widget.setPreferenceForKey('', 'syntax');
	//Name / Nick
	if (widget.preferenceForKey('name'))
		document.getElementById('name').value = widget.preferenceForKey('name');
	//document.getElementById('update').checked = widget.preferenceForKey('update');
}
function savePref(element){
	var pref = widget.preferenceForKey(element);
	var newpref = document.getElementById(element).value;
	if (newpref != pref){
		widget.setPreferenceForKey(newpref, element);
	}
}
/*
function saveUpdate(){
	widget.setPreferenceForKey(document.getElementById('update').checked, 'update');
}
*/
function checkLastUpdateTime() {
    dateNow = new Date(); 
    dateNow = Math.round(dateNow.getTime() / 1000); 

    if (((dateNow - lastUpdateCheckTime) >= 86400) && (widget.preferenceForKey("update"))) {
        checkForUpdate();
    }
}
function checkForUpdate() {
	req = new XMLHttpRequest();
	req.onreadystatechange = compareVersion;
	req.open("GET", updateURL, true);
	req.setRequestHeader("Cache-Control", "no-cache");
	req.send(null);
}
function compareVersion() {
	if (req.readyState == 4) {
		if (req.status == 200) {
			dateNow = new Date();
			dateNow = Math.round(dateNow.getTime() / 1000);
			lastUpdateCheckTime = dateNow;
			var serverVersion = req.responseText;
			if ((currentVersion != serverVersion) && (serverVersion != null) && (serverVersion != "")) {
				document.getElementById('updateMessage').style.display='block';
				document.getElementById('updateLink').innerHTML = "New version: " 
							+serverVersion;
				focus();
			} else {
				document.getElementById('updateMessage').style.display='none';
			}
		}
	}
}
function popupChanged(elem) {
	var chosenOption = elem.options[elem.selectedIndex].innerHTML;
	document.getElementById("syntaxText").innerText = chosenOption;
	savePref('syntax');
	//Other code that handles the menu selection change
}
function init(){
	// Load the AppleButtons.
	new AppleGlassButton(document.getElementById('doneButton'), 'Done', hideBack); 
	new AppleInfoButton(document.getElementById('infoButton'),
						document.getElementById('front'), 'white', 'white', showBack);
	new AppleGlassButton(document.getElementById('paste'), 'Publish', pbget);
	//App Code
	initPrefs();
	checkSyntax();
	xmlhttp = new XMLHttpRequest();
	widget.setPreferenceForKey(true,'update');
	//if (widget.preferenceForKey("update"))
		checkForUpdate();
	
}
