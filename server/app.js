const express = require("express");
let app = express();
var TetrisGame = require("./tetris-game"),
  http = require("http").createServer(app),
  io = require("socket.io")(http);

http.listen(1111);

app.use(express.static("client"));

var tetrisGame = null;
let highScore = 0;

function newGame() {
  console.log("New Game");

  tetrisGame = new TetrisGame(20, 20, {
    levelFallIntervalMultiplier: 0.75,
    levelLinesCount: 10
  });

  tetrisGame.on("change:data", function () {
    let json = tetrisGame.toJSON();
    highScore = Math.max(highScore, json.linesCount);
    json.highScore = highScore;
    io.sockets.json.emit("change:data", json);
  });

  tetrisGame.on("change:tetromino", function (id) {
    io.sockets.json.emit("change:tetromino", {id: id, tetromino: tetrisGame._tetrominoes[id]});
  });

  tetrisGame.on("game-over", function () {
    io.sockets.emit("game-over");
    newGame();
  });
}

newGame();

io.sockets.on("connection", function (socket) {
  console.log("Player connected: " + socket.id);

  tetrisGame.addTetromino(socket.id);
  let json = tetrisGame.toJSON();
  json.highScore = highScore;
  socket.emit("init", {id: socket.id, tetrisGame: json});

  var local = tetrisGame;
  socket.on("message", function (message) {
    if (message.indexOf("_") < 0) { // Don't allow access to private methods
      local[message](socket.id);
    }
  });

  socket.on("disconnect", function () {
    console.log("Player disconnected: " + socket.id);
    local.removeTetromino(socket.id);
  });
});
