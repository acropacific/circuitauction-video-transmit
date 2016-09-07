// boolean variables for publishing
var started = 0;

//Service variables
var localVideo = null;
var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;

//Browser capabilities functions
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

//function that forms the list of device for us
function gotDevices(deviceInfos) {
    if (!deviceInfos || deviceInfos.length == 0) return;
    
    var values = selectors.map(function (select) {
        return select.value;
    });

    selectors.forEach(function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });

    for (var i = 0; i < deviceInfos.length; i++) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label ||
                'mic: ' + (audioInputSelect.length + 1);
            audioInputSelect.appendChild(option);
        } else
            if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || 'cam: ' + (videoSelect.length + 1);
                videoSelect.appendChild(option);
            } else {
                console.log('Unkown Device: ', deviceInfo);
            }
    }

     selectors.forEach(function (select, selectorIndex) {
        if (Array.prototype.slice.call(select.childNodes).some(function (n) {
          return n.value === values[selectorIndex];
        })) {
            select.value = values[selectorIndex];
        }
    });
}

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function changeVideo()
{
    getVideo();
}

function stop()
{
 started = 0;
 if (localStream)
	 peerConnection.removeStream(localStream);
	 peerConnection.close();
	 peerConnection = null;
}
//Close connection and stop video and audio tracks
function closeAllConnection()
{
		
	if (peerConnection)
	{	 
     if (localStream)
	 peerConnection.removeStream(localStream);
	 peerConnection.close();
	 peerConnection = null;
	}
	if (localStream) {
        localStream.getTracks().forEach(
		function(track) {
          track.stop();
      });
    }	
	
	localStream = null;
}
	
//Get the video with audio and video devices
function getVideo()
{
	localVideo = document.getElementById('localVideo');
    
	//close all tracks and connections
	closeAllConnection();	      	
	
	var audioSource = document.getElementById("audioSource").value;
	var videoSource = document.getElementById("videoSource").value;
	
   f_getQuality();
    
   remoteVideo = document.getElementById('remoteVideo');

    var constraints =
    {
        audio: {sourceId: audioSource ? audioSource : undefined},
			
		video: {
			mandatory: {
				minWidth: l_maxWidth ,
				maxWidth: l_maxWidth ,
				minHeight: l_maxHeight,
				maxHeight: l_maxHeight
				},
			    optional: [{
                    sourceId: videoSource ? videoSource : undefined
                }]	
			}
			
			
    };

    if(navigator.getUserMedia)
    {        
	    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).then(gotDevices).catch(handleError);				
    }
    else
    {
        alert('Your browser does not support getUserMedia API');
    }
		
}

//Service function to POST streaming data to server
function sendPost(url, params)
{
	var http = new XMLHttpRequest();

	http.open("POST", url, true);
	http.setRequestHeader("Accept", "text/plain");
	http.setRequestHeader("Content-Type", "text/plain");

	http.onreadystatechange = function()
	{
    	console.log('http.readyState:'+http.readyState+'  http.status:'+http.status);
		if(http.readyState == 4 && http.status == 200)
		{
	    	console.log(http.responseText);

    		//console.log('theAnswerJSON[before]');
			var theAnswerJSON = JSON.parse(http.responseText);
    		//console.log('theAnswerJSON[after]');

    		var sdpData = theAnswerJSON['sdp'];
    		if (sdpData !== undefined)
    		{
    			console.log('sdp: '+theAnswerJSON['sdp']);

				peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData), function() {
					//peerConnection.createAnswer(gotDescription, errorHandler);
				}, errorHandler);
			}

    		var iceCandidates = theAnswerJSON['iceCandidates'];
    		if (iceCandidates !== undefined)
    		{
				for(var index in iceCandidates)
				{
     				console.log('iceCandidates: '+iceCandidates[index]);

       				peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
				}
			}
		}
	}

    console.log('http.send[before]');
	http.send(params);
    console.log('http.send[after]');
}

//Service function to show our stream to VIDEO tag
function getUserMediaSuccess(stream)
{
    localStream = stream;
	document.getElementById('localVideo').srcObject = stream;
	navigator.mediaDevices.enumerateDevices();
}

//Service function to start publishing
function start(isCaller)
{
	started = 1;
	
	if (!localStream)
	{
		setTimeout("start(true)",300);
		return;
	}
		
	if (!peerConnection)
	{
	 peerConnection = new RTCPeerConnection(peerConnectionConfig, null);
     peerConnection.onicecandidate = gotIceCandidate;
     peerConnection.onaddstream = gotRemoteStream;
	}	
	if (localStream)
    peerConnection.addStream(localStream);

    if(isCaller)
    {
        peerConnection.createOffer(gotDescription, errorHandler);
    }
}

//service function
function gotIceCandidate(event)
{
    if(event.candidate != null)
    {
    	console.log('gotIceCandidate: '+JSON.stringify({'ice': event.candidate}));
    }
}

//service function
function gotDescription(description)
{
    console.log('gotDescription: '+JSON.stringify({'sdp': description}));

    peerConnection.setLocalDescription(description, function () {

        sendPost(postURL, '{"direction":"publish", "command":"sendOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+'}');

    }, function() {console.log('set description error')});
}

//service function
function gotRemoteStream(event)
{
    console.log('gotRemoteStream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
	
}

//service function
function errorHandler(error)
{
    console.log(error);
}
