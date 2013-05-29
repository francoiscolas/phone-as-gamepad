var HTTP       = require('http');
var FileServer = require('node-static').Server;
var WsServer   = require('websocket').server;

var httpServer = HTTP.createServer(function (request, response) {
    var user_agent = request.headers['user-agent'];
    var path = require('url').parse(request.url).pathname;

    if (/mobile/i.test(user_agent) && path === '/') {
        response.writeHead(303, {Location: '/gamepad.html'});
        response.end();
    } else {
        fileServer.serve(request, response);
    }
});

var fileServer = new FileServer('./public');

var wsServer = new WsServer({
    httpServer: httpServer,
    autoAcceptConnections: true
});

var mobiles = [];
var desktops = [];
wsServer.on('connect', function (connection) {
    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data);

        console.log(data);
        switch (data.command) {
            case 'mobile':
                connection.sendUTF(JSON.stringify({command: 'id', args: {id: Math.round(Math.random() * 1000)}}));
                mobiles.push(connection);
                break;
            case 'move':
                desktops.forEach(function (desktop) {
                    desktop.sendUTF(JSON.stringify({command: 'move', args: {id: data.id, x: data.args.x, y: data.args.y}}));
                });
                break;
            case 'stop':
                desktops.forEach(function (desktop) {
                    desktop.sendUTF(JSON.stringify({command: 'stop', args: {id: data.id}}));
                });
                break;
            case 'desktop':
                desktops.push(connection);
                break;
        }
    });
    connection.on('close', function () {
        var i;
        if ((i = mobiles.indexOf(connection)) >= 0)
            mobiles.splice(i, 1);
        else if ((i = desktops.indexOf(connection)) >= 0)
            desktops.splice(i, 1);
    });
});

httpServer.listen(8080);

