var ConnectionServer = "wss://58c9da5f0c888.streamlock.net/webrtc-session.json";

// Interval for reconnection request in ms
var defaultReconectionTimeoutMS = 1500;

var videoBitrate = 600;
var audioBitrate = 96;
var videoFrameRate = "25";


var videoSetup = {
	width: 320,
	height: 240
};

var params = {};

if (location.search) {
    var parts = location.search.substring(1).split('&');

    for (var i = 0; i < parts.length; i++) {
        var nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
}

var defaultStreamName = (typeof (params.stream) !== 'undefined') ?  params.stream : 'defStream';
var backgroundImageURL =  (typeof (params.burl) !== 'undefined') ?  params.burl : '';
