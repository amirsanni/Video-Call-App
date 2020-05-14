# Video Call App
A one-to-one text, audio and video chat application built with WebRTC and [RatchetPHP](https://github.com/ratchetphp/Ratchet).

# Requirements
- PHP >= 5.4
- Composer

# Features
- Video call
- Audio call
- Recording
- Text chat
- Two participants only

If you require more than two participants, check out [this](https://github.com/amirsanni/video-call-app-nodejs) and [this](https://github.com/amirsanni/conference-call-ratchet).

# Getting Started
To test this app on your local server:
- Run `composer install` from the root directory to install dependencies.
- Set your app root (base url) in `/js/config.js`.
- Open __`/ws/bin/server.php`__ and add your `domain name` and/or `ip address` to __`$allowed_origins`__ array, then replace the `localhost` and `PORT` in `$app = new Ratchet\App('localhost', PORT, '0.0.0.0');` with either your `domain name` or `ip address` and `Port number` respectively.
- Set your web socket url in `/js/config.js`. Ensure the `domain name` and `port` matches what you set above. Use `wss` for secured connection.
- Start Ratchet server by executing `php ws/bin/server.php` from your CLI.
- Blam! Good to go. Open the app on two different devices to start chatting.
- Works best on Chrome, Firefox and the latest versions of Opera desktop browser.
- Xirsys' free STUN/TURN servers were used. If interested, you can get a free [xirsys](https://xirsys.com/) account, rename `Server.example.php` to `Server.php` and update it with your free credentials. Alternatively, you can use any STUN/TURN of your choice.


## Note
To host this online, you'll need to set up a few things:
- Create Ratchet as a service so it can run persistently on your server. Check the file *create-ratchet-as-a-service-with-daemon.txt* for the guide on how to do this on linux servers.
- If on SSL, Ratchet won't work unless you make some changes on your server.
  - Enable mod_proxy.so
  - Enable mod_proxy_wstunnel.so
  - Open your apache SSL config file and add this: `ProxyPass /wss-secured/ ws://WEB_SOCKET_DOMAIN:WEB_SOCKET_PORT/`
   
    e.g. `ProxyPass /wss-secured/ ws://www.abc.xyz:PORT/`

    Note that you can substitute the `wss-secured` above with any path of your choice but you have to use the same path while connecting from the front-end as shown below.
    
  - Update your web socket url in `/js/config.js`:
    
    `const wsUrl = 'wss://YOUR_WEB_SOCKET_DOMAIN/wss-secured';`
    
 - Please note that most browsers will not allow access to media devices except the application is running on SSL or localhost (127.0.0.1).
 
 
 
 # Demo
 You can test at https://1410inc.xyz/video-call-app.
