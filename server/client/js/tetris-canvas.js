function TetrisCanvas(canvas, tetrisGame, tetrominoId, options) {
	_.bindAll(this, "draw", "handleKeyDown");
	
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.tetrisGame = tetrisGame;
	this.tetrominoId = tetrominoId;
	this.options = options;
	this.colors = {};
}

TetrisCanvas.keyEventMap = {
	13: "dropTetromino",						// Enter
	37: "moveTetrominoLeft",				// Left
	38: "rotateTetrominoClockwise", // Up
	39: "moveTetrominoRight",				// Right
	40: "moveTetrominoDown",				// Down
	32: "cheat",										// Remove a line
	16: "toggleTetrominoType",			// Make it normal
};

TetrisCanvas.prototype = {
	draw: function () {
		this._clear();
		this._drawGrid();
		this._drawTetrominoes();
	},
	
	handleKeyDown: function (event) {
		var event = TetrisCanvas.keyEventMap[event.keyCode];
		event && this.trigger(event);
	},
	
	_clear: function () {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	
	_drawGrid: function () {
		for (var row = 0; row < this.tetrisGame.data.length; row++) {
			for (var col = 0; col < this.tetrisGame.data[row].length; col++) {
				if (this.tetrisGame.data[row][col]) {
					this._drawCell(
						row, col, this.tetrisGame.data[row][col], "normal", 1.0);
				}
			}
		}
	},

	_modifyAlpha(color, alpha) {
		let rgba = "rgba" + color.slice(3, -1) + ", " + alpha + ")";
		return rgba;
	},
	
	_drawCell: function (row, col, tetrominoId, tetrominoType, alpha) {
		var color = this.colors[tetrominoId] || (this.colors[tetrominoId] = this.options.colorGeneratorFunction(tetrominoId));
		color = this._modifyAlpha(color, alpha);
		this.context.fillStyle = color;
		this.context.fillRect(
			col * this.options.cellSize,
			row * this.options.cellSize,
			this.options.cellSize,
			this.options.cellSize
		);

		let lineWidth = 10;
		if (tetrominoType === "bulldoze") {
			color = "rgb(255, 0, 0)";
		} else if (tetrominoType === "float") {
			color = "rgb(0, 255, 0)";
		} else if (tetrominoType === "chameleon") {
			color = "rgb(0, 255, 255)";
		} else if (tetrominoType === "shear") {
			color = "rgb(255, 0, 255)";
		} else {
			color = "rgb(0, 0, 0)";
			lineWidth = 5;
		}
		color = this._modifyAlpha(color, alpha);
		this.context.strokeStyle = color;
		this.context.lineWidth = lineWidth;
		this.context.strokeRect(
			col * this.options.cellSize,
			row * this.options.cellSize,
			this.options.cellSize,
			this.options.cellSize
		);
	},
	
	_drawTetrominoes: function () {
		var i = 0;
		for (var id in this.tetrisGame.tetrominoes) {
			if (id !== this.tetrominoId) this._drawTetromino(id);
		}
		this._drawTetromino(this.tetrominoId); // Draw ours last so it's not hidden behind other players
	},
	
	_drawTetromino: function (id) {
		var tetromino = this.tetrisGame.tetrominoes[id];
		for (var row = 0; row < tetromino.data.length; row++) {
			for (var col = 0; col < tetromino.data[row].length; col++) {
				if (tetromino.data[row][col]) {
					this._drawCell(
						tetromino.row + row, tetromino.col + col, id,
						tetromino.type, 1.0);
					this._drawCell(
						tetromino.shadow.row + row, tetromino.shadow.col + col, id,
						tetromino.type, 0.1);
				}
			}
		}
	}
};

_.extend(TetrisCanvas.prototype, Backbone.Events);
