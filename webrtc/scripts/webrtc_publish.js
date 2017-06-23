var localVideo = null;
var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;
var wsURL = ConnectionServer;
var wsConnection = null;
var streamInfo = {applicationName:"webrtc", streamName:  defaultStreamName , sessionId:"[empty]"};
var userData = {param1:"value1"};
var userAgent = null;
var newAPI = false;
var sdpURLVal;
var applicationNameVal;
var streamNameVal;
var videoBitrateVal;
var audioBitrateVal;
var videoFrameRateVal;

//video device array
var deviceIds = new Array();

//audio device array
var audioDeviceIds = new Array();


var currentIndex =  0;
var currentAudioIndex = 0;
 
var recordingFromMobile;
var recordingBrowser;
var keepConnectionTimer;
var manualStopPublisher = true;

var streamingWithHiQuality = true;
var Debug = false;


navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function recordingFromMobile() {

     var check = false;
     (function(a) {
         if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
     })(navigator.userAgent || navigator.vendor || window.opera);
     return check;
 }

function getRecordingBrowser(){

 var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
 var isFirefox = typeof InstallTrigger !== 'undefined';
 var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
 var isIE = /*@cc_on!@*/false || !!document.documentMode;
 var isEdge = !isIE && !!window.StyleMedia;
 var isChrome = !!window.chrome && !!window.chrome.webstore;
 var isBlink = (isChrome || isOpera) && !!window.CSS;
 if(isOpera) return 'Opera';
 else if(isFirefox) return 'Firefox';
 else if(isSafari) return 'Safari';
 else if(isIE) return 'Internet Explorer';
 else if(isEdge) return 'Edge';
 else if(isChrome) return 'Chrome';
 else if(isBlink) return 'Blink';
 else return 'unknown';
}

function getRecordingBrowserAlternative(){

var navigatorAgent = navigator.userAgent;
var browserName  = navigator.appName;
var nameOffset,verOffset;
if ((verOffset=navigatorAgent.indexOf("Opera"))!=-1) {
 return "Opera";
}
else if ((verOffset=navigatorAgent.indexOf("MSIE"))!=-1) {
 return "Internet Explorer";
}
else if ((verOffset=navigatorAgent.indexOf("Chrome"))!=-1) {
 return "Chrome";
}
else if ((verOffset=navigatorAgent.indexOf("Safari"))!=-1) {
 return "Safari";
}
else if ((verOffset=navigatorAgent.indexOf("Firefox"))!=-1) {
 return "Firefox";
} 
else if ( (nameOffset=navigatorAgent.lastIndexOf(' ')+1) < (verOffset=navigatorAgent.lastIndexOf('/')) ) {
 browserName = navigatorAgent.substring(nameOffset,verOffset);
 if (browserName.toLowerCase()==browserName.toUpperCase()) {
  browserName = navigator.appName;
 }
 return browserName;
}

else return 'unknown';

}

function pageReady()
{
	var getParams = {};
	if(location.href.indexOf('?') != -1){
		var getTokens = location.href.split('?')[1].split('&');
		for(var i in getTokens){
			var pair = getTokens[i].split('=');
			getParams[pair[0]] = pair[1];

		}
		console.log(getParams);
	}

	//Controller.id = getParams['rid'];
	//Controller.wsstart();
	
    recordingFromMobile = recordingFromMobile();
    recordingBrowser = getRecordingBrowser();
if (recordingBrowser == 'unknown') recordingBrowser = getRecordingBrowserAlternative();
    var cookieWSURL = $.cookie("webrtcPublishWSURL");
    if (cookieWSURL === undefined)
    {
		cookieWSURL = wsURL;
		$.cookie("webrtcPublishWSURL", cookieWSURL);
	}

    var cookieApplicationName = $.cookie("webrtcPublishApplicationName");
    if (cookieApplicationName === undefined)
    {
		cookieApplicationName = streamInfo.applicationName;
		$.cookie("webrtcPublishApplicationName", cookieApplicationName);
	}

	if(getParams['streamname']){
		cookieStreamName = getParams['streamname'];
	} else {
		cookieStreamName = streamInfo.streamName;
	}
	/*
	var cookieStreamName = $.cookie("webrtcPublishStreamName");
    if (cookieStreamName === undefined)
    {
		cookieStreamName = streamInfo.streamName;
		$.cookie("webrtcPublishStreamName", cookieStreamName);
	}
	*/
	var cookieVideoQuality = $.cookie("webrtcPublishVideoQuality");
    if (cookieVideoQuality === undefined)
    {
		cookieVideoQuality = 'mid';
	}
//	Controller.update('quality', cookieVideoQuality);
	var cookieVideoBitrate = $.cookie("webrtcPublishVideoBitrate");
    if (cookieVideoBitrate === undefined)
    {
		cookieVideoBitrate = videoBitrate;
		$.cookie("webrtcPublishVideoBitrate", cookieVideoBitrate);
	}
	var cookieAudioBitrate = $.cookie("webrtcPublishAudioBitrate");
    if (cookieAudioBitrate === undefined)
    {
		cookieAudioBitrate = audioBitrate;
		$.cookie("webrtcPublishAudioBitrate", cookieAudioBitrate);
	}
		var cookieVideoFrameRate = $.cookie("webrtcPublishVideoFrameRate");
    if (cookieVideoFrameRate === undefined)
    {
		cookieVideoFrameRate = videoFrameRate;
		$.cookie("webrtcPublishVideoFrameRate", cookieVideoFrameRate);
	}

	sdpURLVal = cookieWSURL;
	applicationNameVal = cookieApplicationName;
	streamNameVal = cookieStreamName;
	videoBitrateVal = cookieVideoBitrate;
	audioBitrateVal = cookieAudioBitrate;
	videoFrameRateVal = cookieVideoFrameRate;
	$('#videoQuality').val(cookieVideoQuality);
	userAgent = $('#userAgent').val().toLowerCase();

	if ( userAgent == null )
	{
		userAgent="unknown";
	}

    localVideo = document.getElementById('localVideo');
	navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(errorHandler);

    

}

function changeQuality(preset){
	switch(preset){
	case 'low':
		videoSetup['width'] = 160;
		videoSetup['height'] = 120;
		cookieVideoBitrate = 100;
		break;
	case 'mid':
		videoSetup['width'] = 320;
		videoSetup['height'] = 240;
		cookieVideoBitrate = 200;
		break;
	case 'high':
		videoSetup['width'] = 640;
		videoSetup['height'] = 480;
		cookieVideoBitrate = 400;
		break;
	case 'max':
		videoSetup['width'] = 1280;
		videoSetup['height'] = 720;
		cookieVideoBitrate = 1500;
		break;
	}
	$.cookie("webrtcPublishVideoQuality", preset);
	$.cookie("webrtcPublishVideoBitrate", cookieVideoBitrate);
	videoBitrateVal = cookieVideoBitrate;
	if (!manualStopPublisher)
	restartPublisher();
}

function wsConnect(url)
{
	
	if (localVideo.videoWidth) 
    document.getElementById("idhw").innerHTML = '<strong>Video dimensions:</strong> ' + localVideo.videoWidth + 'x' + localVideo.videoHeight + 'px';
	
	wsConnection = new WebSocket(url);
	wsConnection.binaryType = 'arraybuffer';

	wsConnection.onopen = function()
	{
		//clearInterval(keepConnectionTimer);
		if(Debug) console.info('webrtc_pub: ws onopen triggered');
		peerConnection = new RTCPeerConnection(peerConnectionConfig);
		peerConnection.onicecandidate = gotIceCandidate;
		peerConnection.onclose = () => { console.warn('webrtc_pub: pc closed'); }
		peerConnection.onerror = () => { console.warn('webrtc_pub: pc error'); }
		peerConnection.oniceconnectionstatechange = function(){
			if(Debug) console.warn('oniceconnectionstatechange triggered', (peerConnection ? peerConnection.iceConnectionState : 'Warning'));
			if(peerConnection){
			switch(peerConnection.iceConnectionState){
			case 'disconnected':
			case 'failed':
				//startPublisher();
				setTimeout('stopPublisher()', 500);
			}
			}
		}
		
		if (newAPI)
		{
			var localTracks = localStream.getTracks();
			for(localTrack in localTracks)
			{
				peerConnection.addTrack(localTracks[localTrack], localStream);
			}
		}
		else
		{
			peerConnection.addStream(localStream);
		}

		peerConnection.createOffer(gotDescription, errorHandler);
	}

	wsConnection.onmessage = function(evt)
	{
		var msgJSON = JSON.parse(evt.data);

		var msgStatus = Number(msgJSON['status']);
		var msgCommand = msgJSON['command'];
                if (msgStatus != 200)
		{
			restartPublisher();
		}
		else
		{
			var sdpData = msgJSON['sdp'];
			if (sdpData !== undefined)
			{
				peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData), function() {
					//peerConnection.createAnswer(gotDescription, errorHandler);
				}, errorHandler);
			}

			var iceCandidates = msgJSON['iceCandidates'];
			if (iceCandidates !== undefined)
			{
				for(var index in iceCandidates)
				{
					peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
				}
			}
		}
		/*
		if (wsConnection != null)
			wsConnection.close();
		wsConnection = null;
		*/
	}

	wsConnection.onclose = function()
	{
		if(Debug) console.warn('ws onclose triggered');
		/*
		if(peerConnection && peerConnection.iceConnectionState == 'disconnected'){
			setTimeout('restartPublisher()', 500);
		}
		*/
	}

	wsConnection.onerror = function(evt)
	{
		if(Debug) console.warn('ws onerror triggered');
		restartPublisher();
	}
	
}



function closeAllConnection(){
		
    if (peerConnection) {	 
     if (localStream) {
		 /*
	 if(recordingBrowser == 'Firefox') removeTrack(peerConnection,localStream);
         else peerConnection.removeStream(localStream);
     }
	 */
	 if(recordingBrowser != 'Firefox')
		 peerConnection.removeStream(localStream);
	}
	 peerConnection.close();
	 peerConnection = null;
    }
	if (localStream && recordingBrowser != 'Firefox') { 
        localStream.getTracks().forEach(
		function(track) {
          track.stop();
      });
    }	
	
     localStream = null;
    if (wsConnection != null) wsConnection.close();
    wsConnection = null;
}


function switchCamera() {
  closeAllConnection();
  setTimeout(function(){ 
	currentIndex = (currentIndex + 1) % 2;
	getVideo();
  }, 1000);
  

}

function gotDevices(deviceInfos) {
  var videoSelect = document.querySelector('select#videoSource');
  var audioSelect = document.querySelector('select#audioSource');
 
  
  
  if (!deviceInfos || deviceInfos.length == 0) return;
    for (var i = 0; i < deviceInfos.length; i++) {
        var deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === 'videoinput') 
             deviceIds.push(deviceInfo.deviceId);   
		else
		if (deviceInfo.kind === 'audioinput') 
        	audioDeviceIds.push(deviceInfo.deviceId);
    }
    if(deviceIds.length == 0) return;
    if(deviceIds.length > 1 && recordingFromMobile) document.getElementById('switchButton').style.display = 'inline';
    
	
	for (var i = 0; i < deviceInfos.length; i++) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
			option.text = deviceInfo.label ||
                'mic: ' + (audioSource.length + 1);
            audioSource.appendChild(option);
        } else
            if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || 'cam: ' + (videoSelect.length + 1);
                videoSelect.appendChild(option);
            } else {
                console.log('Unknown Device: ', deviceInfo);
            }
    }
	
	currentIndex = 0;
    currentAudioIndex = 0;
    
  getVideo();
}

function getUserMediaSuccess(stream)
{
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
	if (!manualStopPublisher)
    startPublisher();
}

function startPublisher()
{
	manualStopPublisher = false;
	//Controller.update('stream', streamNameVal);
	document.getElementById('idinfo').innerHTML = 'Streaming: ' + streamNameVal;
	wsURL = sdpURLVal;
	streamInfo.applicationName = applicationNameVal;
	streamInfo.streamName = streamNameVal;
	videoBitrate = videoBitrateVal;
	//audioBitrate = audioBitrateVal;
	//videoFrameRate = videoFrameRateVal;
	userAgent = $('#userAgent').val().toLowerCase();

	
	
	$.cookie("webrtcPublishWSURL", wsURL, { expires: 365 });
	$.cookie("webrtcPublishApplicationName", streamInfo.applicationName, { expires: 365 });
	$.cookie("webrtcPublishStreamName", streamInfo.streamName, { expires: 365 });
	$.cookie("webrtcPublishVideoBitrate", videoBitrate, { expires: 365 });
	$.cookie("webrtcPublishAudioBitrate", audioBitrate, { expires: 365 });
	$.cookie("webrtcPublishVideoFrameRate", videoFrameRate, { expires: 365 });

	wsConnect(wsURL);
	
	stopMonitoring();
	startMonitoring();
}

function restartPublisher()
{
        stopPublisher();
		startPublisher();
}

function stopPublisher()
{
	manualStopPublisher = true;
	closeAllConnection();
	document.getElementById('idinfo').innerHTML = "Stream stopped";
	setTimeout(function(){ 
		getVideo();
	}, 1000);
}

function gotIceCandidate(event)
{
    if(event.candidate != null)
    {
    }
}

function gotDescription(description)
{
	var enhanceData = new Object();

	if (audioBitrate !== undefined)
		enhanceData.audioBitrate = Number(audioBitrate);
	if (videoBitrate !== undefined)
		enhanceData.videoBitrate = Number(videoBitrate);
	if (videoFrameRate !== undefined)
		enhanceData.videoFrameRate = Number(videoFrameRate);


	description.sdp = enhanceSDP(description.sdp, enhanceData);

    peerConnection.setLocalDescription(description, function () {

		wsConnection.send('{"direction":"publish", "command":"sendOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+', "userData":'+JSON.stringify(userData)+'}');

    }, function() {});
}

function enhanceSDP(sdpStr, enhanceData)
{
	var sdpLines = sdpStr.split(/\r\n/);
	var sdpSection = 'header';
	var hitMID = false;
	var sdpStrRet = '';

	for(var sdpIndex in sdpLines)
	{
		var sdpLine = sdpLines[sdpIndex];

		if (sdpLine.length <= 0)
			continue;

		sdpStrRet += sdpLine;

		if (sdpLine.indexOf("m=audio") === 0)
		{
			sdpSection = 'audio';
			hitMID = false;
		}
		else if (sdpLine.indexOf("m=video") === 0)
		{
			sdpSection = 'video';
			hitMID = false;
		}
		else if (sdpLine.indexOf("a=rtpmap") == 0 )
		{
			sdpSection = 'bandwidth';
			hitMID = false;
		}

		if (sdpLine.indexOf("a=mid:") === 0 || sdpLine.indexOf("a=rtpmap") == 0 )
		{
			if (!hitMID)
			{
				if ('audio'.localeCompare(sdpSection) == 0)
				{
					if (enhanceData.audioBitrate !== undefined)
					{
						sdpStrRet += '\r\nb=CT:' + (enhanceData.audioBitrate);
						sdpStrRet += '\r\nb=AS:' + (enhanceData.audioBitrate);
					}
					hitMID = true;
				}
				else if ('video'.localeCompare(sdpSection) == 0)
				{
					if (enhanceData.videoBitrate !== undefined)
					{
						sdpStrRet += '\r\nb=CT:' + (enhanceData.videoBitrate);
						sdpStrRet += '\r\nb=AS:' + (enhanceData.videoBitrate);
						if ( enhanceData.videoFrameRate !== undefined )
							{
								sdpStrRet += '\r\na=framerate:'+enhanceData.videoFrameRate;
							}
					}
					hitMID = true;
				}
				else if ('bandwidth'.localeCompare(sdpSection) == 0 )
				{
					var rtpmapID;
					rtpmapID = getrtpMapID(sdpLine);
					if ( rtpmapID !== null  )
					{
						var match = rtpmapID[2].toLowerCase();
						if ( ('vp9'.localeCompare(match) == 0 ) ||  ('vp8'.localeCompare(match) == 0 ) || ('h264'.localeCompare(match) == 0 ) ||
							('red'.localeCompare(match) == 0 ) || ('ulpfec'.localeCompare(match) == 0 ) || ('rtx'.localeCompare(match) == 0 ) )
						{
							if (enhanceData.videoBitrate !== undefined)
								{
								sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.videoBitrate)+';x-google-max-bitrate='+(enhanceData.videoBitrate);
								}
						}

						if ( ('opus'.localeCompare(match) == 0 ) ||  ('isac'.localeCompare(match) == 0 ) || ('g722'.localeCompare(match) == 0 ) || ('pcmu'.localeCompare(match) == 0 ) ||
								('pcma'.localeCompare(match) == 0 ) || ('cn'.localeCompare(match) == 0 ))
						{
							if (enhanceData.videoBitrate !== undefined)
								{
								sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.audioBitrate)+';x-google-max-bitrate='+(enhanceData.audioBitrate);
								}
						}
					}
				}
			}
		}
		sdpStrRet += '\r\n';
	}
	return sdpStrRet;
}

function getrtpMapID(line)
{
	var findid = new RegExp('a=rtpmap:(\\d+) (\\w+)/(\\d+)');
	var found = line.match(findid);
	return (found && found.length >= 3) ? found: null;
}

function errorHandler(error)
{
}


function getVideo() {
 var constraints;
 
   if (localStream) {
        localStream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
	
	localStream = null;
 
	
	  var constraints = {
        audio: {	
               deviceId: audioDeviceIds[currentAudioIndex] ? {exact: audioDeviceIds[currentAudioIndex]} : undefined,
		},
        video: {	
                deviceId: deviceIds[currentIndex] ? {exact: deviceIds[currentIndex]} : undefined,
                width: {exact: videoSetup['width']},    //new syntax
                height: {exact: videoSetup['height']},   //new syntax
				frameRate: {min: 25}
        }
    };

	 setTimeout(function() {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(getUserMediaSuccess)
            .catch(function (error) {
                console.log('getUserMedia error!', error.code, error.name);
            });
    }, (localStream ? 200 : 0));  //official examples had this at 200

	
	/*
    if(navigator.mediaDevices.getUserMedia)
	{
		navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
		newAPI = false;
	}
    else if (navigator.getUserMedia)
    {
        navigator.getUserMedia(constraints, getUserMediaSuccess, errorHandler);
    }
    else
    {
        swal('User media API not supported', 'Your browser does not support getUserMedia API');
    }
	*/

}

function removeTrack(pc, stream){
/*
  pc.getSenders().forEach(function(sender){
    stream.getTracks().forEach(function(track){
      if(track == sender.track){
        pc.removeTrack(sender);
      }
    });
  });
  */
  pc.getSenders().forEach((sender) => {
      stream.getTracks().includes(sender.track) && pc.removeTrack(sender);
  });
}
