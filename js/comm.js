'use strict';

/**
 * 
 * @author Amir <amirsanni@gmail.com>
 * @date 24-Dec-2016
 */



var servers = {
    iceServers: [
        {urls: 'stun:stun.l.google.com:19302'}
    ]
};

var myPC;
var awaitingResponse;
var streamConstraints;
var myMediaStream;

const room = getRoom();
const wsChat = new WebSocket("ws://localhost:8080/comm");

window.addEventListener('load', function(){
    startCounter();//shows the time spent in room
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //add event listeners to the dial buttons
    var initCallElems = document.getElementsByClassName('initCall');
    
    for (var i = 0; i < initCallElems.length; i++) {
        initCallElems[i].addEventListener('click', initCall);
    }
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    wsChat.onopen = function(){
        //subscribe to room
        wsChat.send(JSON.stringify({
            action: 'subscribe',
            room: room
        }));
        
        showSnackBar("Connected to the chat server!", 5000);
    };
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    wsChat.onerror = function(){
        showSnackBar("Unable to connect to the chat server! Kindly refresh", 20000);
    };
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    wsChat.onmessage = function(e){
        var data = JSON.parse(e.data);
        
        if(data.room === room){
            //above check is not necessary since all messages coming to this user are for the user's current room
            //but just to be on the safe side
            switch(data.action){
                case 'initCall':
                    //launch modal to show that user has a call with options to accept or deny and start ringtone
                    //start ringtone here
                    document.getElementById('calleeInfo').style.color = 'black';
                    document.getElementById('calleeInfo').innerHTML = data.msg;
                    
                    document.getElementById("rcivModal").style.display = 'block';
                    
                    document.getElementById('callerTone').play();
                    
                    //minimise chat pane if it is maximised to prevent it from covering the page on small screens
                    if (!$(".icon_minim").hasClass('panel-collapsed')) {
                        $(".icon_minim").parents('.panel').find('.panel-body').slideUp();
                        $(".icon_minim").addClass('panel-collapsed');
                        $(".icon_minim").removeClass('fa-minus').addClass('fa-plus');
                    }
                    
                    break;
                    
                case 'callRejected':
                    //get response to call initiation (if user is the initiator)
                    //show received message (i.e. reason for rejection) and end call
                    document.getElementById("callerInfo").style.color = 'red';
                    document.getElementById("callerInfo").innerHTML = data.msg;

                    setTimeout(function(){
                        document.getElementById("callModal").style.display = 'none';
                    }, 3000);
                    
                    //stop tone
                    document.getElementById('callerTone').pause();
                    
                    //enable call buttons
                    enableCallBtns();
                    
                    break;
                    
                case 'endCall':
                    //i.e. when the caller ends the call from his end (after dialing and before recipient respond)
                    //End call
                    document.getElementById("calleeInfo").style.color = 'red';
                    document.getElementById("calleeInfo").innerHTML = data.msg;

                    setTimeout(function(){
                        document.getElementById("rcivModal").style.display = 'none';
                    }, 3000);
                    
                    //stop tone
                    document.getElementById('callerTone').pause();
                    
                    break;
                    
                case 'startCall':
                    startCall(false);//to start call when callee gives the go ahead (i.e. answers call)
                    
                    document.getElementById("callModal").style.display = 'none';//hide call modal
                    
                    clearTimeout(awaitingResponse);//clear timeout
                    
                    //stop tone
                    document.getElementById('callerTone').pause();
                    break;

                case 'candidate':
                    //message is iceCandidate
                    myPC ? myPC.addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
                    
                    break;

                case 'sdp':
                    //message is signal description
                    myPC ? myPC.setRemoteDescription(new RTCSessionDescription(data.sdp)) : "";
                    
                    break;

                case 'txt':
                    //it is a text chat
                    addRemoteChat(data.msg, data.date);

                    //play msg tone
                    document.getElementById('msgTone').play();
                    
                    break;

                case 'typingStatus':
                    if(data.status){
                        document.getElementById("typingInfo").innerHTML = "Remote is typing";
                    }
                    
                    else{
                        document.getElementById("typingInfo").innerHTML = "";
                    }
                    
                    break;
                    
                case 'terminateCall'://when remote terminates call (while call is ongoing)
                    handleCallTermination();
                    //play termination tone
                    //document.getElementById('terminationTone').play();
                    break;
                    
                case 'newSub':
                    setRemoteStatus('online');

                    //once the other user joined and current user has been notified, current user should also send a signal
                    //that he is online
                    wsChat.send(JSON.stringify({
                        action: 'imOnline',
                        room: room
                    }));

                    showSnackBar("Remote entered room", 10000);
                    
                    break;
                    
                case 'imOnline':
                    setRemoteStatus('online');
                    break;
                    
                case 'imOffline':
                    setRemoteStatus('offline');
        
                    showSnackBar("Remote left room", 10000);
                    enableCallBtns();
                    break;
            }  
        }
        
        else if(data.action === "subRejected"){
            //subscription on this device rejected cos user has subscribed on another device/browser
            showSnackBar("Maximum of two users allowed in room. Communication disallowed", 5000);
        }
    };
    
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //Indicate that user is typing
    document.getElementById("chatInput").addEventListener('keyup', function(){
        var msg = this.value.trim();
        
        //if user is typing
        if(msg){
            wsChat.send(JSON.stringify({
                action: 'typingStatus',
                status: true,
                room: room
            }));
        }
        
        //if no text in input
        else{
            wsChat.send(JSON.stringify({
                action: 'typingStatus',
                status: false,
                room: room
            }));
        }
        
    });
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //TO SEND MESSAGE TO REMOTE
    document.getElementById("chatSendBtn").addEventListener('click', function(e){
        e.preventDefault();
        
        var msg = document.getElementById("chatInput").value.trim();
        
        if(msg){
            var date = new Date().toLocaleTimeString();
            
            addLocalChat(msg, date, true);
            
            //clear text
            document.getElementById("chatInput").value = "";
            
            return false;
        }
    });
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
   
    
    //WHEN ENTER IS PRESSED TO SEND MESSAGE
    document.getElementById("chatInput").addEventListener('keypress', function(e){
        var msg = this.value.trim();
        
        if((e.which === 13) && msg){
            //trigger the click event on the send btn
            document.getElementById("chatSendBtn").click();
            
            return false;
        }
    });
    
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //WHEN USER CLICKS BTN TO ANSWER CALL
    //add event listener to the answer call buttons
    var answerCallElems = document.getElementsByClassName('answerCall');
    
    for (var i = 0; i < answerCallElems.length; i++) {
        answerCallElems[i].addEventListener('click', answerCall);
    }
    
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //TO REJECT CALL
    document.getElementById("rejectCall").addEventListener('click', function(e){
        e.preventDefault();
        
        wsChat.send(JSON.stringify({
            action: 'callRejected',
            msg: "Call rejected by Remote",
            room: room
        }));
        
        document.getElementById("rcivModal").style.display = 'none';
        
        document.getElementById('callerTone').pause();
    });
    
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //WHEN THE CALLER CLICK TO END THE CALL
    document.getElementById("endCall").addEventListener('click', function(e){
        e.preventDefault();
        
        endCall("Call ended by remote", false);
        
        //enable call buttons
        enableCallBtns();
    });
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    //TO MAXIMISE/MINIMISE THE CHAT PANE
    $('.chat-pane').on('click', '.icon_minim', function (e) {
        var $this = $(this);
        
        if (!$this.hasClass('panel-collapsed')) {
            $this.parents('.panel').find('.panel-body').slideUp();
            $this.addClass('panel-collapsed');
            $this.removeClass('fa-minus').addClass('fa-plus');
        } 
        
        else {
            $this.parents('.panel').find('.panel-body').slideDown();
            $this.removeClass('panel-collapsed');
            $this.removeClass('fa-plus').addClass('fa-minus');
        }
        
        //fix scrollbar to bottom
        fixChatScrollBarToBottom();
    });
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //Maximise the chat pane when user focuses on the input and pane is collapsed
    $('.chat-pane').on('focus', '.chat_input', function () {
        var $this = $(this);
        
        if ($('#minim_chat_window').hasClass('panel-collapsed')) {
            $this.parents('.panel').find('.panel-body').slideDown();
            $('#minim_chat_window').removeClass('panel-collapsed');
            $('#minim_chat_window').removeClass('fa-plus').addClass('fa-minus');
            
            //fix scrollbar to bottom
            fixChatScrollBarToBottom();
        }
    });
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    //WHEN USER CLICKS TO TERMINATE THE CALL
    document.getElementById("terminateCall").addEventListener('click', function(e){
        e.preventDefault();
        
        //close the connection
        myPC ? myPC.close() : "";
        
        //stop media stream
        stopMediaStream();
        
        //remove video playback src
        //$('video').attr('src', appRoot+'img/vidbg.png');
        document.querySelectorAll('video').src = appRoot+'img/vidbg.png';
        
        //inform peer to also end the connection
        wsChat.send(JSON.stringify({
            action: 'terminateCall',
            room: room
        }));
        
        //enable call buttons
        enableCallBtns();
    });
});

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/
/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/


function initCall(){
    var callType = this.id === 'initVideo' ? "Video" : "Audio";
    var callerInfo = document.getElementById('callerInfo');
        
    //launch calling modal and await receiver's response by sending initCall to him (i.e. receiver)
    if(checkUserMediaSupport){
        //set media constraints based on the button clicked. Audio only should be initiated by default
        streamConstraints = callType === 'Video' ? {video:{facingMode:'user'}, audio:true} : {audio:true};

        //set message to display on the call dialog
        callerInfo.style.color = 'black';
        callerInfo.innerHTML = callType === 'Video' ? 'Video call to Remote' : 'Audio call to Remote';

        //start calling tone
        document.getElementById('callerTone').play();

        //notify callee that we're calling. Don't call startCall() yet
        wsChat.send(JSON.stringify({
            action: 'initCall',
            msg: callType === 'Video' ? "Video call from remote" : "Audio call from remote",
            room: room
        }));

        //disable call buttons
        disableCallBtns();

        //wait for response for 30secs
        awaitingResponse = setTimeout(function(){
            endCall("Call ended due to lack of response", true);
        }, 30000);
    }

    else{
        callerInfo.style.color = 'red';
        callerInfo.innerHTML = "Your browser/device does not have the capability to make call";
    }


    document.getElementById("callModal").style.display = 'block';
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function answerCall(){
    //check whether user can use webrtc and use that to determine the response to send
    if(checkUserMediaSupport){
        //set media constraints based on the button clicked. Audio only should be initiated by default
        streamConstraints = this.id === 'startVideo' ? {video:{facingMode:'user'}, audio:true} : {audio:true};

        //show msg that we're setting up call (i.e. locating servers)
        document.getElementById("calleeInfo").innerHTML = "<i class='"+spinnerClass+"'></i> Setting up call...";

        //uncomment the lines below if you comment out the get request above
        startCall(true);

        //dismiss modal
        document.getElementById("rcivModal").style.display = 'none';

        //enable the terminateCall btn
        disableCallBtns();

    }

    else{
        //inform caller and current user (i.e. receiver) that he cannot use webrtc, then dismiss modal after a while
        wsChat.send(JSON.stringify({
            action: 'callRejected',
            msg: "Remote's device does not have the necessary requirements to make call",
            room: room
        }));

        document.getElementById("calleeInfo").innerHTML = "Your browser/device does not meet the minimum requirements needed to make a call";

        setTimeout(function(){
            document.getElementById("rcivModal").style.display = 'none';
        }, 3000);
    }

    document.getElementById('callerTone').pause();
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function startCall(isCaller){
    if(checkUserMediaSupport){
        myPC = new RTCPeerConnection(servers);//RTCPeerconnection obj
        
        //When my ice candidates become available
        myPC.onicecandidate = function(e){
            if(e.candidate){
                //send my candidate to peer
                wsChat.send(JSON.stringify({
                    action: 'candidate',
                    candidate: e.candidate,
                    room: room
                }));
            }
        };
    
        //When remote stream becomes available
        myPC.ontrack = function(e){
            document.getElementById("peerVid").src = window.URL.createObjectURL(e.streams[0]);
            // document.getElementById("peerVid").src = window.HTMLMediaElement.srcObject(e.streams[0]);
        };
        
        
        //when remote connection state and ice agent is closed
        myPC.oniceconnectionstatechange = function(){
            switch(myPC.iceConnectionState){
                case 'disconnected':
                case 'failed':
                    console.log("Ice connection state is failed/disconnected");
                    showSnackBar("Call connection problem", 15000);
                    break;
                    
                case 'closed':
                    console.log("Ice connection state is 'closed'");
                    showSnackBar("Call connection closed", 15000);
                    break;
            }
        };
        
        
        //WHEN REMOTE CLOSES CONNECTION
        myPC.onsignalingstatechange = function(){
            switch(myPC.signalingState){
                case 'closed':
                    console.log("Signalling state is 'closed'");
                    showSnackBar("Signal lost", 15000);
                    break;
            }
        };
        
        //set local media
        setLocalMedia(streamConstraints, isCaller);
    }
    
    else{
        showSnackBar("Your browser does not support video call", 30000);
    }
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function checkUserMediaSupport(){
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

//get and set local media
function setLocalMedia(streamConstraints, isCaller){
    navigator.mediaDevices.getUserMedia(
        streamConstraints
    ).then(function(myStream){
        document.getElementById("myVid").src = window.URL.createObjectURL(myStream);
        // document.getElementById("peerVid").src = window.HTMLMediaElement.srcObject(e.streams[0]);
        
        myPC.addStream(myStream);//add my stream to RTCPeerConnection
        
        //set var myMediaStream as the stream gotten. Will be used to remove stream later on
        myMediaStream = myStream;
        
        if(isCaller){
            myPC.createOffer().then(description, function(e){
                console.log("Error creating offer", e.message);
                
                showSnackBar("Call connection failed", 15000);
            });
            
            //then notify callee to start call on his end
            wsChat.send(JSON.stringify({
                action: 'startCall',
                room: room
            }));
        }
        
        else{
            //myPC.createAnswer(description);
            myPC.createAnswer().then(description).catch(function(e){
                console.log("Error creating answer", e);
                
                showSnackBar("Call connection failed", 15000);
            });

        }
        
    }).catch(function(e){
        
        switch(e.name){
            case 'SecurityError':
                console.log(e.message);
                
                showSnackBar("Media sources usage is not supported on this browser/device", 10000);
                break;

            case 'NotAllowedError':
                console.log(e.message);
                
                showSnackBar("We do not have access to your audio/video sources", 10000);
                break;
                
            case 'NotFoundError':
                console.log(e.message);
                
                showSnackBar("The requested audio/video source cannot be found", 10000);
                break;
            
            case 'NotReadableError':
            case 'AbortError':
                console.log(e.message);
                showSnackBar("Unable to use your media sources", 10000);
                break;
        }
    });
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

/**
 * 
 * @param {type} msg
 * @param {type} date
 * @returns {undefined}
 */
function addRemoteChat(msg, date){
    new Promise(function(resolve, reject){
        var newNode = document.createElement('div');
        
        newNode.className = "row msg_container base_receive";
        
        return resolve(newNode);
    }).then(function(newlyCreatedNode){
        newlyCreatedNode.innerHTML = '<div class="col-sm-10 col-xs-10">\
                <div class="messages msg_receive">\
                    <p>'+msg+'</p>\
                    <time>Remote • '+date+'</time>\
                </div>\
            </div>';
        
        document.getElementById('chats').appendChild(newlyCreatedNode);

        //open the chat just in case it is closed
        document.getElementById("chatInput").focus();

        fixChatScrollBarToBottom();
    });
}


/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

/**
 * 
 * @param {type} msg
 * @param {type} date
 * @param {type} sendToPartner
 * @returns {undefined}
 */
function addLocalChat(msg, date, sendToPartner){
    //if msg is to be sent to partner, (meaning the msg was typed on the current browser), leave the sent status to 'busy' until
    //it is actually sent.
    
    var msgId = randomString(5);//this will be used to change the sent status once it is sent (applicable if we're saving to db)
    
    new Promise(function(resolve, reject){
        var newNode = document.createElement('div');
        
        newNode.className = "row msg_container base_sent";
        
        return resolve(newNode);
    }).then(function(newlyCreatedNode){
        newlyCreatedNode.innerHTML = '<div class="col-sm-10 col-xs-10">\
                <div class="messages msg_sent">\
                    <p>'+msg+'</p>\
                    <time>You • '+date+' <i class="fa fa-clock-o sentStatus" id="'+msgId+'"></i></time>\
                </div>\
            </div>';
        
        document.getElementById('chats').appendChild(newlyCreatedNode);
        
        if(sendToPartner){
            //use this if you just want to send via socket without saving in db
            sendChatToSocket(msg, date, msgId);
        }
    });
    
    
    fixChatScrollBarToBottom();
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

/**
 * 
 * @param {type} desc
 * @returns {undefined}
 */
function description(desc){
    myPC.setLocalDescription(desc);

    //send sdp
    wsChat.send(JSON.stringify({
        action: 'sdp',
        sdp: desc,
        room: room
    }));
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

/**
 * 
 * @param {type} msg
 * @param {type} setTimeOut
 * @returns {undefined}
 */
function endCall(msg, setTimeOut){
    wsChat.send(JSON.stringify({
        action: 'endCall',
        msg: msg,
        room: room
    }));

    if(setTimeOut){
        //display message
        document.getElementById("callerInfo").style.color = 'red';
        document.getElementById.innerHTML = "<i class='fa fa-exclamation-triangle'></i> No response";
        
        setTimeout(function(){
            document.getElementById("callModal").style.display = 'none';
        }, 3000);
        
        enableCallBtns();
    }
    
    else{
        document.getElementById("callModal").style.display = 'none';
    }
    
    clearTimeout(awaitingResponse);

    document.getElementById('callerTone').pause();
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function fixChatScrollBarToBottom(){
    var msgPane = document.getElementById("chats");
    msgPane.scrollTop = msgPane.scrollHeight;
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function enableCallBtns(){
    //enable dial btns and disable endcall btn
//    $(".initCall").attr('disabled', false);
//    $("#terminateCall").attr('disabled', true);
    
    var initCallElems = document.getElementsByClassName('initCall');
    
    for(let i = 0; i < initCallElems.length; i++){
        initCallElems[i].removeAttribute('disabled');
    }
    
    document.getElementById('terminateCall').setAttribute('disabled', true);
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function disableCallBtns(){
    //disable dial btns and enable endall btn
//    $(".initCall").attr('disabled', true);
//    $("#terminateCall").attr('disabled', false);

    var initCallElems = document.getElementsByClassName('initCall');
    
    for(let i = 0; i < initCallElems.length; i++){
        initCallElems[i].setAttribute('disabled', true);
    }
    
    document.getElementById('terminateCall').removeAttribute('disabled');
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function sendChatToSocket(msg, date, msgId){
    wsChat.send(JSON.stringify({
        action: 'txt',
        msg: msg,
        date: date,
        room: room
    }));
    
    //change the sent status to indicate it has been sent
    //$(".sentStatus").last().removeClass('fa-clock-o').addClass('fa-check text-success');
    $("#"+msgId).removeClass('fa-clock-o').addClass('fa-check text-success');
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function handleCallTermination(){
    myPC ? myPC.close() : "";//close connection as well
                    
    //tell user that remote terminated call
    showSnackBar("Call terminated by remote", 10000);

    //remove streams and free media devices
    stopMediaStream();
    
    //remove video playback src
    $('video').attr('src', appRoot+'img/vidbg.png');

    //enable 'call' button and disable 'terminate call' btn
    enableCallBtns();
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

//set the status of remote (online or offline)
function setRemoteStatus(status){
    if(status === 'online'){
        $("#remoteStatus").css('color', 'green');
        $("#remoteStatusTxt").css({color:'green'}).html("(Online)");
    }
    
    else{
        $("#remoteStatus").css('color', '');
        $("#remoteStatusTxt").css({color:'red'}).html("(Offline)");
    }
}


/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/


function startCounter(){
    var sec = "00";
    var min = "00";
    var hr = "00";
    
    var hrElem = document.querySelector("#countHr");
    var minElem = document.querySelector("#countMin");
    var secElem = document.querySelector("#countSec");
    
    hrElem.innerHTML = hr;
    minElem.innerHTML = min;
    secElem.innerHTML = sec;
        
    setInterval(function(){
        //display seconds and increment it by a sec
        ++sec;
        
        secElem.innerHTML = sec >= 60 ? "00" : (sec < 10 ? "0"+sec : sec);
        
        if(sec >= 60){
            //increase minute and reset secs to 00
            ++min;
            minElem.innerHTML = min < 10 ? "0"+min : min;
            
            sec = 0;
            
            if(min >= 60){
                //increase hr by one and reset min to 00
                ++hr;
                hrElem.innerHTML = hr < 10 ? "0"+hr : hr;
                
                min = 0;
            }
        }
        
    }, 1000);
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function stopMediaStream(){    
    if(myMediaStream){
//        myMediaStream.getTracks()[0].stop();
//        
//        myMediaStream.getTracks()[1] ? myMediaStream.getTracks()[1].stop() : "";
        
        var totalTracks = myMediaStream.getTracks().length;
        
        for(let i = 0; i < totalTracks; i++){
            myMediaStream.getTracks()[i].stop();
        }
    }
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function showSnackBar(msg, displayTime){
    document.getElementById('snackbar').innerHTML = msg;
    document.getElementById('snackbar').className = document.getElementById('snackbar').getAttribute('class') + " show";
    
    setTimeout(function(){
        $("#snackbar").html("").removeClass("show");
    }, displayTime);
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

/**
 * 
 * @param {type} length
 * @returns {String}
 */
function randomString(length){
    var rand = Math.random().toString(36).slice(2).substring(0, length);
    
    return rand;
}

/*
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
********************************************************************************************************************************
*/

function getRoom(){
    var params = window.location.search.substr(1).split("&");
    
    if(params){
        for(let i = 0; i < params.length; i++){
            var key = params[i].split("=")[0];
            var value = params[i].split("=")[1];
            
            if(key === "room"){
                return value;
            }
        }
    }
    
    else{
        return "";
    }
}
