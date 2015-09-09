//  Importing variables
var express = require("express");
var app = express();
var http = require("http");
var fs = require("fs");
var server = http.createServer(app);
var io = require("socket.io").listen(server);

//  Chess.js is a reduced version of nodechess that will
//  execute the chess logic
var chess = require("./chess.js");
var spectators = [];
var white;
var black;

app.use(express.static(__dirname + "/public"));

io.on("connection", function(socket){
	socket.emit("message");
	if(white === undefined){
		white = socket;
		white.emit("assign", "white player");
	}
	else if(black === undefined){
		black = socket;
		black.emit("assign", "black player");
	}
	else{
		spectators.push(socket);
		socket.emit("assign", "spectator");
	}
  socket.on("disconnect", function(){
  });
});
server.listen(8080);

console.log("Server running");
