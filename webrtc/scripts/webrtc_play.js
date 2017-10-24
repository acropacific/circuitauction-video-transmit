var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;
var wsURL = "wss://578729ceed349.streamlock.net/webrtc-session.json";
var wsConnection = null;
var streamInfo = {applicationName:"webrtc", streamName : defaultStreamName, sessionId:"[empty]"};
var userData = {param1:"value1"};
var repeaterRetryCount = 0;
var newAPI = false;
var sdpURLVal;
var applicationNameVal;
var streamNameVal;
var stoppedManually = true;
////////
var isStarted = false;
var Debug = false;
var dout;

window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

/* window.addEventListener('beforeunload', function(){ worker.postMessage('stream None'); }); */

function pageReady()
{
	
	document.body.style.backgroundImage  = 'url(' + backgroundImageURL+')';
	document.body.style.backgroundSize = "cover";

	
	var vid = document.getElementsByTagName("video")[0];
	fillVideo(vid);

	var getParams = {};
	if(location.href.indexOf('?') != -1){
		var getTokens = location.href.split('?')[1].split('&');
		for(var i in getTokens){
			var pair = getTokens[i].split('=');
			getParams[pair[0]] = pair[1];

		}
		console.log(getParams);
	}


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
	
	sdpURLVal = cookieWSURL;
	applicationNameVal = cookieApplicationName;
	streamNameVal = cookieStreamName;
		
    remoteVideo = document.getElementById('remoteVideo');

    if(navigator.mediaDevices.getUserMedia)
	{
		newAPI = false;
	}
    enableFullscreen();
   
    setInterval( "e_timer()", 1000);
	
}

function f_hideVideo() {
	var el = document.getElementById("remoteVideo");
	if (el) el.style.display = "none";
}

function f_showVideo() {
	var el = document.getElementById("remoteVideo");
	if (el) el.style.display = "inline";
}

var StopCount = 0;

var fillVideo = function(vid){
    var video = $(vid);
    var actualRatio = vid.videoWidth/vid.videoHeight;
    var targetRatio = video.width()/video.height();
    var adjustmentRatio = targetRatio/actualRatio;
    var scale = actualRatio < targetRatio ? targetRatio / actualRatio : actualRatio / targetRatio;
    video.css('-webkit-transform','scale(' + scale  + ')');
};

function e_timer() {

if  ( (localStream) && (localStream.getVideoTracks().length > 0) && (localStream.getVideoTracks()[0].readyState=="muted" ))
	f_hideVideo();
else
	f_showVideo();


    if ( (peerConnection == null) || ((peerConnection) && (peerConnection.iceConnectionState == 'failed')) || (!localStream) ||   ( (localStream) && (localStream.getVideoTracks().length > 0) && (localStream.getVideoTracks()[0].readyState=="ended" )))
	  {
		//console.info('e_timer: CONNECTION LOST');
		StopCount++;
		if (StopCount == 5){
			f_hideVideo();
			if(!stoppedManually){
			if(peerConnection)
				peerConnection == null;
			   setTimeout(restartPlay, 1000);
			}
		}
      }	
     
	/* if ((peerConnection != null) && ((peerConnection.iceConnectionState == 'connected') || (peerConnection.iceConnectionState == 'completed'))) */
	if (peerConnection != null)
	{	
		if ( localStream && (localStream.getVideoTracks().length > 0)&&(localStream.getVideoTracks()[0].readyState=="live" ))
		{
			//console.info('e_timer: CONNECTION RESTORED');
	     StopCount = 0;
		 f_showVideo();
		}
    }
}

function wsConnect(url)
{
	if (wsConnection) 
	{	
	 wsConnection.close();
	 wsConnection = null;
	}
	wsConnection = new WebSocket(url);
	wsConnection.binaryType = 'arraybuffer';
	
	wsConnection.onopen = function()
	{
		
		peerConnection = new RTCPeerConnection(peerConnectionConfig);
		peerConnection.onicecandidate = gotIceCandidate;
		peerConnection.oniceconnectionstatechange = function(){
			if(Debug) console.warn('play: oniceconnectionstatechange triggered', (peerConnection ? peerConnection.iceConnectionState : 'Warning'));
		}
		
		//sendChannel = peerConnection.createDataChannel('sendChannel');
		
		if (newAPI)
		{
			peerConnection.ontrack = gotRemoteTrack;
		}
		else
		{
			peerConnection.onaddstream = gotRemoteStream;
		}

		sendGetOffer();
	}
	
	function sendGetOffer()
	{
		try {
		wsConnection.send('{"direction":"play", "command":"getOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "userData":'+JSON.stringify(userData)+'}');
		} catch(e) {
			if(Debug) console.info('webrtc_play: cannot send to websock');
		}
	}
	
	wsConnection.onmessage = function(evt)
	{
		
		var msgJSON = JSON.parse(evt.data);
		
		var msgStatus = Number(msgJSON['status']);
		var msgCommand = msgJSON['command'];
		
		if (msgStatus == 514) 
		{
			repeaterRetryCount++;
			if (repeaterRetryCount < 5)
			{
				setTimeout(sendGetOffer, 500);
			}
			else
			{
			if (this != null)	
			{
			  this.onmessage  = null;
			  this.close();
		      
		 	  setTimeout(restartPlay, 1000);
			}
			}
		}
		else if (msgStatus != 200)
		{
			this.onmessage = null;
			if (this != null)
			this.close();
			
			setTimeout(restartPlay, 1000);
		}
		else
		{

			var streamInfoResponse = msgJSON['streamInfo'];
			if (streamInfoResponse !== undefined)
			{
				streamInfo.sessionId = streamInfoResponse.sessionId;
			}

			var sdpData = msgJSON['sdp'];
			if (sdpData !== undefined)
			{

				peerConnection.setRemoteDescription(new RTCSessionDescription(msgJSON.sdp), function() {
					peerConnection.createAnswer(gotDescription, errorHandler);
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
		
		if ('sendResponse'.localeCompare(msgCommand) == 0)
		{
			this.onmessage= null;
			if (this != null)
				this.close();
			
		}

		msgJSON = null;
		evt.data = null;

	}
	
	wsConnection.onclose = function()
	{
	}
	
	wsConnection.onerror = function(evt)
	{
		this.onerror = null;
		if(Debug)
			console.warn('webrtc_play: ws onerror triggered');
		if(this != null)
		   this.close();   
		setTimeout(restartPlay, 5000);		
	}
}


function startPlay()
{
	stoppedManually = false;
	//Controller.update('stream', streamNameVal);
	isStarted = true;
	repeaterRetryCount = 0;
				
	wsURL = sdpURLVal;
	streamInfo.applicationName = applicationNameVal;
	streamInfo.streamName = streamNameVal;

	$.cookie("webrtcPublishWSURL", wsURL, { expires: 365 });
	$.cookie("webrtcPublishApplicationName", streamInfo.applicationName, { expires: 365 });
	$.cookie("webrtcPublishStreamName", streamInfo.streamName, { expires: 365 });
		
	wsConnect(wsURL);
	StopCount = 0;
	
}

function restartPlay()
{
        stopPlay();
        startPlay();
}

function stopPlay()
{
	stoppedManually = true;
	isStarted = false;
	if (peerConnection != null)
		peerConnection.close();
	peerConnection = null;
	
	if (wsConnection != null)
		wsConnection.close();
	wsConnection = null;
	
//	remoteVideo.src = ""; 
	
}


function gotMessageFromServer(message) 
{
    var signal = JSON.parse(message.data);
    if(signal.sdp) 
	{
		if (signal.sdp.type == 'offer')
		{
			peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				peerConnection.createAnswer(gotDescription, errorHandler);
			}, errorHandler);
		}

    }
    else if(signal.ice)
    {
		peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}

function gotIceCandidate(event) 
{
    if(event.candidate != null) 
	{
    }
}

function handleReceiveChannelStatusChange(event){
}

function gotDescription(description) 
{
	try {
    peerConnection.setLocalDescription(description, function () 
	{
        wsConnection.send('{"direction":"play", "command":"sendResponse", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+', "userData":'+JSON.stringify(userData)+'}');

    }, function() {});
	} catch(e) {
		if(Debug) console.info('webrtc_play: cannot send to websock');
	}
}

function gotRemoteTrack(event) 
{
	remoteVideo.src = window.URL.createObjectURL(event.streams[0]);
}

function gotRemoteStream(event) 
{
    remoteVideo.src = window.URL.createObjectURL(event.stream);
	localStream = event.stream;
}

function errorHandler(error) 
{
}
function enableFullscreen() {
   $("#remoteVideo").click(function() {
    var remoteVideo = $("#remoteVideo").get(0);
    if (remoteVideo.requestFullscreen) {
      remoteVideo.requestFullscreen();
    } else if (remoteVideo.mozRequestFullScreen) {
      remoteVideo.mozRequestFullScreen();
    } else if (remoteVideo.webkitRequestFullscreen) {
      remoteVideo.webkitRequestFullscreen();
    }
    return false;
});
  
}
