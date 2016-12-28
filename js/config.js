/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 23-Dec-2016
 */

'use strict';

const wsChat = new WebSocket("ws://localhost:8080/comm");
const appRoot = setAppRoot('webrtc-ratchet-chat-app', '');
const spinnerClass = 'fa fa-spinner faa-spin animated';

function setAppRoot(devFolderName, prodFolderName){
    var hostname = window.location.hostname;

    /*
     * set the appRoot
     * This will work for both http, https with or without www
     * @type String
     */
    
    //attach trailing slash to both foldernames
    var devFolder = devFolderName ? devFolderName+"/" : "";
    var prodFolder = prodFolderName ? prodFolderName+"/" : "";
    
    var appRoot = "";
    
    if(hostname === "localhost" || (hostname.search("192.168.") !== -1)  || (hostname.search("127.0.0.") !== -1)){
        appRoot = window.location.origin+"/"+devFolder;
    }
    
    else{
        appRoot = window.location.origin+"/"+prodFolder;
    }
    
    return appRoot;
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