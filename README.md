# Video Call App
A one-to-one text, audio and video chat application built with webRTC and Ratchet (PHP WebSockets).

# Requirements
- PHP >= 5.4
- Every other required files are included or referenced as the case may be.

# Getting Started
To test this app on your local server:
- The audio and video call is best tested on two different devices. This will require more configurations.
 - Open `video-call-app/js/comm.js` and change this line `const wsChat = new WebSocket("ws://localhost:PORT/comm");` to `const wsChat = new WebSocket("ws://YOUR_SERVER_IP:PORT/comm");`
 - Open __`video-call-app/ws/bin/server.php`__ and add your server `ip address` to __`$allowed_origins`__ array, then replace the `localhost` and `PORT` in `$app = new Ratchet\App('localhost', PORT, '0.0.0.0');` with your `ip address` and `Port number`respectively.
- The Ratchet server must be running. This can be achieved by navigating to *__video-call-app/ws/bin__* from your cli and run *__php server.php__*
- Run the app from your browser at: `http://localhost/video-call-app/`
- Create a room.
- Enter the room from two different browsers (using the same link) and test by sending text chats. This can be done on the same device.
 - Blam! Good to go. Navigate to `YOUR_IP_ADDRESS/video-call-app` on your browser on two different devices to start chatting
- Works best on Chrome, Firefox and the latest versions of Opera desktop browser.


## Note
To host this online, you'll need to set up a few things:
- Create Ratchet as a service so it can run persistently on your server. Check the file *create-ratchet-as-a-service-with-daemon.txt* for the guide on how to do this on CentOS7.
- If on SSL, Ratchet won't work unless you make some changes on your server.
  - Enable mod_proxy.so
  - Enable  mod_proxy_wstunnel.so
  - Open your apache config file and add this: __ProxyPass /wss/ ws://YOUR_SERVER_IP_OR_DOMAIN:PORT/__
   
    e.g. _ProxyPass /wss/ ws://www.abc.xyz:PORT/_
    
  - From your front-end, you can connect like this:
    
    _const wsChat = new WebSocket("wss://YOUR_SERVER_IP_OR_DOMAIN/wss/comm");_

  However, if you are wondering how to edit apache config on WHM, here is how:
    - After enabling those services (mod_proxy.so and mod_proxy_wstunnel.so), log in to WHM, 
    
    go to __"service configuration" => "Apache configuration" => "include editor" => "pre main include"__, 
    
    select a version of your choice or choose _"All versions"_. The file name should be _"pre_main_global.conf'_
    - All your new configuration can be written in that textarea without tampering with httpd.conf directly. 
    The configurations will be loaded on Apache start-up.
    - Once you put the Proxypass directive there, restart your server and there you go.
    
 This [answer on Stack Overflow](https://stackoverflow.com/a/28393526/4522890) should be helpful.
 - Please note that Chrome and Firefox (>= 68) will not allow access to media devices except the application is running on SSL.
 
 
 
 # Demo
 You can test at https://1410inc.xyz/video-call-app.
