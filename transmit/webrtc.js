var localVideo = null;
var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var postURL = "https://578729ceed349.streamlock.net:443/webrtc-session.json";
var streamInfo = {applicationName:"webrtc", streamName:"myStream", sessionId:"[empty]"};

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function pageReady()
{
  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');

  var constraints =
  {
    video: true,
    audio: true,
    video: {
      mandatory: {
        maxWidth: 320,
        maxHeight: 240
      }
    }
  };

  if(navigator.getUserMedia)
  {
    navigator.getUserMedia(constraints, getUserMediaSuccess, errorHandler);
  }
  else
  {
    alert('Your browser does not support getUserMedia API');
  }
}

function sendPost(url, params)
{
  var http = new XMLHttpRequest();

  http.open("POST", url, true);

  http.setRequestHeader("Content-Length", params.length);
  http.setRequestHeader("Connection", "close");
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

function getUserMediaSuccess(stream)
{
  localStream = stream;
  localVideo.src = window.URL.createObjectURL(stream);
}

function start(isCaller)
{
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;
  peerConnection.addStream(localStream);

  if(isCaller)
  {
    peerConnection.createOffer(gotDescription, errorHandler);
  }
}

function gotIceCandidate(event)
{
  if(event.candidate != null)
  {
    console.log('gotIceCandidate: '+JSON.stringify({'ice': event.candidate}));
  }
}

function gotDescription(description)
{
  console.log('gotDescription: '+JSON.stringify({'sdp': description}));

  peerConnection.setLocalDescription(description, function () {

    sendPost(postURL, '{"direction":"publish", "command":"sendOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+'}');

  }, function() {console.log('set description error')});
}

function gotRemoteStream(event)
{
  console.log('gotRemoteStream');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error)
{
  console.log(error);
}
