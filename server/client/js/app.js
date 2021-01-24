let highScore = 0;

(function ($) {
  var $canvas = $("#tetris-canvas"),
    height = $canvas.height(),
    $linesCount = $("#lines-count"),
    $level = $("#level"),
    $highScore= $("#highScore"),
    $playersCount = $("#players-count");

  $canvas
    .attr("width", height)
    .attr("height", height)
    .css("width", (height) + "px");

  var socket = io.connect(),
    tetrisCanvas = null;

  socket.on("init", function (data) {
    tetrisCanvas = new TetrisCanvas($canvas[0], data.tetrisGame, data.id, {
      moveIntervalMillis: 75,
      cellSize: Math.floor(height / 20),
      colorGeneratorFunction: function (id) {
        const prettyColors = ["rgb(0, 153, 153)", 
			      "rbg(102, 0, 255)", 
        		      "rbg(255, 102, 102)", 
        		      "rgb(153, 0, 51)",  
			      "rgb(204, 153, 255)",
			      "rgb(0, 255, 0)"]
        return prettyColors[id.charCodeAt(0) % prettyColors.length];     
	}
    });

    window.onkeydown = tetrisCanvas.handleKeyDown;

    tetrisCanvas.on("all", function (event) {
      socket.send(event);
    });
  });

  socket.on("change:data", function (tetrisGame) {
    if (tetrisCanvas === null) return;

    tetrisCanvas.tetrisGame = tetrisGame;
    window.requestAnimationFrame(tetrisCanvas.draw);

    $linesCount.html(tetrisGame.linesCount);
    $highScore.html(tetrisGame.highScore);
    $level.html(tetrisGame.level);
    $playersCount.html(tetrisGame.tetrominoesCount);
  });

  socket.on("change:tetromino", function (data) {
    if (tetrisCanvas === null) return;

    tetrisCanvas.tetrisGame.tetrominoes[data.id] = data.tetromino;
    window.requestAnimationFrame(tetrisCanvas.draw);
  });

  socket.on("game-over", function () {
    tetrisCanvas = null;
    socket.disconnect();
    window.location.reload();
  });
})(jQuery);
