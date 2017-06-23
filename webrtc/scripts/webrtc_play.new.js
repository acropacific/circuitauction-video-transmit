var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;
var wsURL =ConnectionServer;
var wsConnection = null;
var streamInfo = {applicationName:"webrtc", streamName:"myStream", sessionId:"[empty]"};
var userData = {param1:"value1"};
var repeaterRetryCount = 0;
var newAPI = false;
var sdpURLVal;
var applicationNameVal;
var streamNameVal;
////////
var dout;
var worker;
var workerState = {};
var defaultId = 'default';
var dataChannel;

window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

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

	worker = new Worker('worker.js');
	worker.onmessage = function(e){
		//dout.innerHTML = JSON.stringify(e.data);
		for(var i in e.data['tasks']){
			var cmdline = e.data['tasks'][i].split(' ');
			switch(cmdline[0]){
			case 'receive':
				streamNameVal = cmdline[1];
				restartPlay();
				break;
			case 'attach':
				streamNameVal = cmdline[1] + '_t';
				restartPlay();
				break;
			case 'grab':
				streamNameVal = cmdline[1] + '_r';
				restartPlay();
				break;
			case 'restart':
				restartPlay();
				break;
			case 'stop':
				stopPlay();
				break;
			case 'start':
				startPlay();
				break;
			}
			console.info('dispatcher: receiver: ' + e.data['tasks'][i]);
		}
		workerState['last'] = e.data['last'];
		localStorage.setItem('workerState', JSON.stringify(workerState));
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
	/*
    var cookieStreamName = $.cookie("webrtcPublishStreamName");
    if (cookieStreamName === undefined)
    {
		cookieStreamName = streamInfo.streamName;
		$.cookie("webrtcPublishStreamName", cookieStreamName);
	}
	*/
	if(getParams['streamname']){
		cookieStreamName = getParams['streamname'];
	} else {
		cookieStreamName = streamInfo.streamName;
	}

	startDispatcher(getParams['rid']);
	
	sdpURLVal = cookieWSURL;
	applicationNameVal = cookieApplicationName;
	streamNameVal = cookieStreamName;
		
    remoteVideo = document.getElementById('remoteVideo');

    if(navigator.mediaDevices.getUserMedia)
	{
		newAPI = false;
	}
    startPlay();
    enableFullscreen();
   
    setInterval( "e_timer()", 1000);
	
}

function startDispatcher(name){
	if(localStorage.getItem("workerState"))
		workerState = JSON.parse(localStorage.getItem('workerState'));
	else
		workerState = { 'last': -1, 'id' : defaultId };
	if(name){
		workerState['id'] = name;
	}
	document.getElementById('dispatcherInfo').innerHTML = 'Your ID - ' + workerState['id'];
	worker.postMessage("start " + workerState['id'] + " " + workerState['last']);
}
function stopDispatcher(name){
	worker.postMessage("stop");
	if(name)
		workerState['id'] = name;
	localStorage.setItem('workerState', JSON.stringify(workerState));
}

function changeName(){
	var name = prompt('Смените id:', workerState['id']);
	stopDispatcher(name);
	startDispatcher();
}

function f_hideVideo() {
	var el = document.getElementById("remoteVideo");
	if (el) el.style.display = "none";
	
	var el = document.getElementById("remoteImg");
	if (el) 
	{
		el.src  = videoReplaceImgURL;
		el.style.display = "inline";
	}
}

function f_showVideo() {
	var el = document.getElementById("remoteVideo");
	if (el) el.style.display = "inline";
	
	var el = document.getElementById("remoteImg");
	if (el) el.style.display = "none";	
}

var StopCount = 0;

function e_timer() {
    if ( (peerConnection == null) || (!localStream) ||   ( (localStream) && (localStream.getVideoTracks().length > 0)))//&&(localStream.getVideoTracks()[0].readyState!="live" )))
	  {
		StopCount++;
		if (StopCount > 5){
			f_hideVideo();
			startPlay();
		}
      }	
     
	if (peerConnection != null) 
	{	
		if ( localStream && (localStream.getVideoTracks().length > 0)&&(localStream.getVideoTracks()[0].readyState=="live" ))
		{
	     StopCount = 0;
		 f_showVideo();
		}
    }
}

function wsConnect(url)
{
	wsConnection = new WebSocket(url);
	wsConnection.binaryType = 'arraybuffer';
	
	wsConnection.onopen = function()
	{
		console.info('webrtc_play: ws onopen triggered');
		
		peerConnection = new RTCPeerConnection(peerConnectionConfig);
		peerConnection.onicecandidate = gotIceCandidate;
		
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
		if((wsConnection != null) && (wsConnection.connectionState == 'connected'))
			wsConnection.send('{"direction":"play", "command":"getOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "userData":'+JSON.stringify(userData)+'}');
	}
	
	wsConnection.onmessage = function(evt)
	{
		
		var msgJSON = JSON.parse(evt.data);
		
		var msgStatus = Number(msgJSON['status']);
		var msgCommand = msgJSON['command'];
		
		if (msgStatus == 514) 
		{
			repeaterRetryCount++;
			if (repeaterRetryCount < 10)
			{
				setTimeout(sendGetOffer, 1000);
			}
			else
			{
				restartPlay();
			}
		}
		else if (msgStatus != 200)
		{
			restartPlay();
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
			if (wsConnection != null)
				wsConnection.close();
			wsConnection = null;
		}
	}
	
	wsConnection.onclose = function()
	{
		console.info('webrtc_play: ws onclose triggered');
	}
	
	wsConnection.onerror = function(evt)
	{
			console.warn('webrtc_play: ws onerror triggered');
           restartPlay();		
	}
}


function startPlay()
{
	repeaterRetryCount = 0;
				
	wsURL = sdpURLVal;
	streamInfo.applicationName = applicationNameVal;
	streamInfo.streamName = streamNameVal;
	worker.postMessage('stream ' + streamNameVal);
		
	$.cookie("webrtcPublishWSURL", wsURL, { expires: 365 });
	$.cookie("webrtcPublishApplicationName", streamInfo.applicationName, { expires: 365 });
	$.cookie("webrtcPublishStreamName", streamInfo.streamName, { expires: 365 });
		
	wsConnect(wsURL);
	
}

function restartPlay()
{
        stopPlay();
        setTimeout(startPlay, 1000);
}

function stopPlay()
{
	if (peerConnection != null)
		peerConnection.close();
	peerConnection = null;
	
	if (wsConnection != null)
		wsConnection.close();
	wsConnection = null;
	
	remoteVideo.src = ""; 


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
    peerConnection.setLocalDescription(description, function () 
	{
        wsConnection.send('{"direction":"play", "command":"sendResponse", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+', "userData":'+JSON.stringify(userData)+'}');

    }, function() {});
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
