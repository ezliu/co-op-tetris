var TetrisGame = require("./tetris-game"),
	app = require("http").createServer(),
	io = require("socket.io")(app);

app.listen(1111);

var tetrisGame = null;

function newGame() {
	console.log("New Game");
	
	tetrisGame = new TetrisGame(20, 20, {
		levelFallIntervalMultiplier: 0.75,
		levelLinesCount: 10
	});
	
	tetrisGame.on("change:data", function () {
		io.sockets.json.emit("change:data", tetrisGame.toJSON());
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
	socket.emit("init", {id: socket.id, tetrisGame: tetrisGame.toJSON()});
	
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
