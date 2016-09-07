//service variables
var videoElement = null;
var audioInputSelect = null;
var videoSelect = null;
var selectors = null;
                   
//Show text function
function f_showTextMessage(text) {
    document.getElementById("sdpDataTag").innerHTML = text;
}

//Timer function to start our VIDEO elements with camera and mic and show current status for connection
function e_timer() {
    if (!localStream)
        getVideo();

    if (peerConnection == null) {
        f_showTextMessage("Not connected")
        if (started) start(true);
    }
    else
        f_showTextMessage(peerConnection.iceConnectionState);
}

//function to dinamically create SELECT element for Quality selection from a_Qualitys array
function f_formQualitySelector() {
    var t = "";
    for (var i = 0; i < a_Qualitys.length; i++) {
        val = a_Qualitys[i].split(",");
        txt = val[0];
        val = val[1];

        t += ("<option value='" + val + "'>" + txt + "</option>");
    }
    document.getElementById("id_resolution").innerHTML = t;
}

//function Get Quality for stream from SELECT element and put it to local variables
function f_getQuality() {
    var el = document.getElementById("id_resolution");
    var wh = (el.options[el.selectedIndex].value).split("x");
    l_maxWidth = wh[0];
    l_maxHeight = wh[1];
}

//event for page onloads -- set some predefined variables and got points to dom elements when it's loaded
function e_onload() {

    videoElement = document.getElementById('localVideo');
    audioInputSelect = document.querySelector('select#audioSource');
    videoSelect = document.querySelector('select#videoSource');
    selectors = [audioInputSelect, videoSelect];

    navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

    audioInputSelect.onchange = changeVideo;
    videoSelect.onchange = changeVideo;

    f_formQualitySelector();
    f_getQuality();
    changeVideo();

    setInterval("e_timer()", 1000);
}
