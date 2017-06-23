

//class WebRTCStatisticAnalyzer {
	
	
		var webrtcStatisticVerbose = false;
		
		  var mLocalConnection = null;
		  var timerId  = 0;
		  
		  //variables for statisctic analyze;
		  var mAnalyzeIntervalMs = 100;		  
		  
		  //limitation  of bitrate for publishing
		  var averageBitrate = 0;
		  
		  //array for variables;
		  var statusFrameRateArray = [];
		  
		  //maxim analyze points
		  var maxStatusPoins = 10;
		  
		/*  
		  constructor(name) {
			this.name = name;
		  } */
		  
		  function setAnalyzeInterval (interval)
		  {
			   mAnalyzeIntervalMs  = interval;
		  }
		  
		  function initialize(connection, averageBitrate, degradeFunction) {
		   mLocalConnection = connection;
		   console.log("Analyzer started with "+ connection);
		  }

			var oldresult = null;
			
			
		  function StoreToStatusArray(val)
		  {
			  statusFrameRateArray.push(val);
			  if (statusFrameRateArray.length > maxStatusPoins)
				  statusFrameRateArray.shift();
			  if(webrtcStatisticVerbose)
				console.log(statusFrameRateArray);
		  }
		
		  function ShowResults(result) {

			  
						
			var ohtml =	"";
			
			if (getRecordingBrowser()=="Firefox") 
			{
				var result = result.outbound_rtp_video_1;
			
				if (oldresult == null ) oldresult = result;
 				
				ohtml =
				"bitrateMean: " + Math.floor ( result.bitrateMean / 1000 ) + "<br>"+
				"bitrateStdDev: " + Math.floor (result.bitrateStdDev / 1000) + "<br>"+
				"framerateMean: " + Math.floor (result.framerateMean) + "<br>"+
				"framerateStdDev: " + Math.floor (result.framerateStdDev) + "<br>"+
				"packetsSent: " + (-oldresult.packetsSent +  result.packetsSent) + "<br>"+
				"droppedFrames: " + (-oldresult.droppedFrames +  result.droppedFrames) + "<br>";
				"bytesSent: " + Math.floor (( -oldresult.bytesSent +  result.bytesSent) / 1024);
				
				StoreToStatusArray(result.framerateMean);
				
				oldresult = result;
				
			 }
			else{
				var result = Array.from(result);

				if (oldresult == null ) oldresult = result;
 		
				ohtml =
				"packetsSent: " + (  result[2][1].packetsSent - oldresult[2][1].packetsSent  ) + "<br>"+
				"bytesSent: " +   Math.floor ( (result[2][1].bytesSent - oldresult[2][1].bytesSent    )/ 1024) + "<br>"+
				"framesEncoded: " + (  result[2][1].framesEncoded  - oldresult[2][1].framesEncoded)+ "<br>"+
				"packetsLost: " +   ( result[2][1].packetsLost - oldresult[2][1].packetsLost);				
			
				StoreToStatusArray(result[2][1].framesEncoded  - oldresult[2][1].framesEncoded);
				oldresult = result;
		
				
		}			 

			
			
			 document.getElementById ("idstatistic").innerHTML  = ohtml;
			
			if (localVideo.videoWidth) 
			document.getElementById("idhw").innerHTML = '<strong>Video dimensions:</strong> ' + localVideo.videoWidth + 'x' + localVideo.videoHeight + 'px';

			  
			analyzeFunction();		
			
			}
			
			
			function getStats(pc, selector) {
				if (navigator.mozGetUserMedia) {
					return pc.getStats(selector);
				}
				return new Promise(function(resolve, reject) {
					pc.getStats(function(response) {
						var standardReport = {};
						response.result().forEach(function(report) {
							var standardStats = {
								id: report.id,
								type: report.type
							};
							report.names().forEach(function(name) {
								standardStats[name] = report.stat(name);
							});
							standardReport[standardStats.id] = standardStats;
						});
						resolve(standardReport);
					}, selector, reject);
				});
			}

		  var baselineReport, currentReport;
			
		  
		  function analyzeFunction()
		  {
			if (streamingWithHiQuality==false) return;
    		//there is our analyze algoryntm
			var lessthan15points = 0;
			for (var i=0; i<statusFrameRateArray.length; i++)
			 if (statusFrameRateArray[i] < 15)
				 lessthan15points ++;
						
			if (lessthan15points >= (maxStatusPoins/2))
			{
			// closeAllConnection();
			// streamingWithHiQuality	= false;
			 statusFrameRateArray = [];
			 //getVideo();
			}
		  };

		  function getReportFunction ()
		  {
			  if (peerConnection == null) return;
			  var selector = peerConnection.getLocalStreams()[0].getVideoTracks()[0];
			    peerConnection.getStats(selector, function (report) {
				ShowResults(report);
				}, logError);
		  }
		  		  
		  function startMonitoring () {
				timerId = setInterval("getReportFunction()", 1000)
		  };
		 
		  function stopMonitoring () {
			  statusFrameRateArray = [];
			  clearTimeout(timerId);
		  };
		  
		  
		function processStats() {
			// compare the elements from the current report with the baseline
			for (var i in currentReport) {
			var now = currentReport[i];
			if (now.type != "outbund-rtp")
            continue;

        // get the corresponding stats from the baseline report
        base = baselineReport[now.id];

        if (base) {
            remoteNow = currentReport[now.associateStatsId];
            remoteBase = baselineReport[base.associateStatsId];

            var packetsSent = now.packetsSent - base.packetsSent;
            var packetsReceived = remoteNow.packetsReceived - remoteBase.packetsReceived;

            // if fractionLost is > 0.3, we have probably found the culprit
            var fractionLost = (packetsSent - packetsReceived) / packetsSent;
				}
			}
		}

		function logError(error) {
			log(error.name + ": " + error.message);
		}

 
//}