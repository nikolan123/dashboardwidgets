function getElement(id) {
	return document.getElementById(id);
}

function hideElement(id) {
	id.style.display = 'none';
}

function showElement(id) {
	id.style.display = 'block';
}

function checkForUpdate(mode) {
	url='http://islayer.com/index.php?op=version&id=21&type=1&random='+new Date().getTime();
	versionCheckRequest=new XMLHttpRequest();
	versionCheckRequest.open("GET",url,true);
	versionCheckRequest.onreadystatechange=function() {
		if(versionCheckRequest.readyState == 4) {
			if(versionCheckRequest.status == 200 && versionCheckRequest.responseText > 2.2){
				if(mode == 1){
					vOffset = 56;
					hOffset = 5;
				} else {
					forceWait = true;
					vOffset = 0;
					hOffset = 0;
				}
				document.getElementById('updateWindowNew').style.top = vOffset
				document.getElementById('updateWindowNew').style.left = hOffset
				document.getElementById('updateWindowNew').style.display = 'block';
			} else {
				if(mode == 1){
					document.getElementById('updateWindowCurrent').style.display = 'block';
				}
			}	
		}
	}
	versionCheckRequest.send(null);
} 	