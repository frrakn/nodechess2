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

app.use(express.static(__dirname + "/public"));

io.on("connection", function(socket){
  socket.on("join", function(data){
    socket.appUser = data.user;
    console.log(data.user + " has joined.");
    
    //  BROADCAST USERJOIN EVENT
    socket.broadcast.emit("userJoin", {
      user: data.user,
      time: new Date()
    });
    
    //  **ALSO ADD INIT HERE**
  });
  socket.on("message", function(data){
    console.log(socket.appUser + " (" + data.time + "): " + data.message);
    
    //  BROADCAST USERCHAT EVENT
    socket.broadcast.emit("userChat", {
      user: socket.appUser, 
      time: data.time, 
      message: data.message
    });
  });
  socket.on("disconnect", function(){
    console.log(socket.appUser + " has disconnected.");
    
    //  BROADCAST USERLEAVE EVENT
    socket.broadcast.emit("userLeave", {
      user: socket.appUser, 
      time: new Date()
    });
  });
});
server.listen(8080);

console.log("Server running");
