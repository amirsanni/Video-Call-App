/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 23-Dec-2016
 */

'use strict';

var app = getRootWebSitePath();
const appRoot = setAppRoot(app,app);
const spinnerClass = 'fa fa-spinner faa-spin animated';


function getRootWebSitePath()
{
    var _location = document.location.toString();
    var applicationNameIndex = _location.indexOf('/', _location.indexOf('://') + 3);
    var applicationName = _location.substring(0, applicationNameIndex) + '/';
    var webFolderIndex = _location.indexOf('/', _location.indexOf(applicationName) + applicationName.length);
    var webFolderFullPath = _location.substring(0, webFolderIndex);
    return webFolderFullPath;
}

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
    
    if((hostname.search("localhost") !== -1) || (hostname.search("192.168.") !== -1)  || (hostname.search("127.0.0.") !== -1)){
        return devFolder;
    }
    
    else{
        return prodFolder + "/";
    }
}