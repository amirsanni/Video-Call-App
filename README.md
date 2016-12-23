# WebRTC and Ratchet Chat Application
A text, audio and video chat application built with webRTC and Ratchet.

# Requirements
- PHP >= 5.4
- Every other required files are included or referenced as the case may be

# Getting Started
To test this app on your local server:
- The Ratchet server must be ON. This can be achived by navigating to *__webrtc-ratchet-chat-app/ws/bin__* from your cli and run *__php server.php__*
- Run the app from your browser at: `http://localhost/webrtc-ratchet-chat-app/`
- Create a room and get link to room
- Open the links from two different browsers and test by sending text chats
- The audio and video call is best tested on two different devices. This will require more configuration
 - Open `webrtc-ratchet-chat-app/config.php` and change this line `define('WS_URL', 'ws://localhost:8080/comm');` to `define('WS_URL', 'ws://YOUR_SERVER_IP:8080/comm');`
 - Open __`webrtc-ratchet-chat-app/ws/bin/server.php`__ and add your server `ip address` to __`$allowed_origins`__ array, then replace the `localhost` in `$app = new Ratchet\App('localhost', 8080, '0.0.0.0');` with your `ip address`
 - Blam! Good to go. Navigate to `YOUR_IP_ADDRESS/webrtc-ratchet-chat-app` on your browser on two different devices to start chatting
- Works best on Chrome, Firefox and the latest versions of Opera desktop browser.


#Note
To host this online, you'll need to set a few things up:
- Create Ratchet as a service so it can run persistently on your server
- If on SSL, Ratchet won't work unless you make some changes on your server. This [answer on Stack Overflow](https://stackoverflow.com/questions/16979793/php-ratchet-websocket-ssl-connect) will come handy