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
var assignments = ["white", "black", "spectator"];
var moveLog = [];
var white;
var black;

app.use(express.static(__dirname + "/public"));

var game = new chess.Game();
var currentFEN;

game.run();
currentFEN = game.chessBoard.toFEN();

io.on("connection", function(socket){
	if(white === undefined){
		assignClient(socket, 0);
		initClient(white);
	}
	else if(black === undefined){
		assignClient(socket, 1);
		initClient(black);
	}
	else{
		assignClient(socket, 2);
		initClient(socket);
	}
  socket.on("disconnect", function(){
		if(socket === white){
			if(spectators.length === 0){
				white = undefined;
			}
			else{
				assignClient(spectators.shift(), 0);
			}
		}
		else if(socket === black){
			if(spectators.length === 0){
				black = undefined;
			}
			else{
				assignClient(spectators.shift(), 1);
			}
		}
		else{
			spectators.splice(spectators.indexOf(socket), 1);
		}
  });
	game.interface.on("update", function(arr){
		console.log("Received");
		currentFEN = arr[0];
		moveLog.push(arr[1]);
		io.emit("fen", arr[0]);
		io.emit("turn", game.turn);
		io.emit("pgn", arr[1]);
	});
	game.interface.on("invalid", function(arr){
		if(game.turn){
			white.emit("fen", currentFEN);
		}
		else{
			black.emit("fen", currentFEN);
		}
	});
});
server.listen(8080);

function initClient(socket){
		socket.emit("fen", currentFEN);
		socket.emit("turn", game.turn);
		for(var i = 0; i < moveLog.length; i++){
			socket.emit("pgn", moveLog[i]);
		}
}

function assignClient(socket, assign){
	var specIndex;
	specIndex = spectators.indexOf(socket);
	if(specIndex < 0){
		spectators.splice(specIndex, 1);
	}
	switch(assign){
		case 0:
			white = socket;
			white.emit("assign", assignments[0]);
			white.on("move", function(fen){
				if(game.turn){
					game.interface.emit("move", fen);
				}
				else{
					white.emit("fen", currentFEN);
				}
			});
			break;
		case 1:
			black = socket;
			black.emit("assign", assignments[1]);
			black.on("move", function(fen){
				if(!game.turn){
					game.interface.emit("move", fen);
				}
				else{
					black.emit("fen", currentFEN);
				}
			});
			break;
		case 2:
			spectators.push(socket);
			socket.emit("assign", assignments[2]);
			break;
	}
}


console.log("Server running");
