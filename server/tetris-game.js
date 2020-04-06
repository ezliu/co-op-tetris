var _ = require("underscore"),
	Events = require("backbone").Events;

function TetrisGame(rows, cols, options) {
	this.options = options;

	this._tetrominoes = {};
	this._tetrominoesCount = 0;
	this._linesCount = 0;
	this._level = 0;
	this._data = [];
	for (var row = 0; row < rows; row++) {
		this._data.push(this._getEmptyLine(cols));
	}

	this._setFallInterval(1000);
}

TetrisGame.prototype = {
	toJSON: function () {
		return {
			data: this._data,
			tetrominoes: this._tetrominoes,
			tetrominoesCount: this._tetrominoesCount,
			linesCount: this._linesCount,
			level: this._level
		};
	},

	addTetromino: function (id) {
		this._tetrominoes[id] = {};
		this._tetrominoesCount++;
		this._newTetromino(id);

		this.trigger("change:data");
	},

	removeTetromino: function (id) {
		delete this._tetrominoes[id];
		this._tetrominoesCount--;

		this.trigger("change:data");
	},

	moveTetrominoLeft: function (id) {
		this._modifyTetromino(id, this._tetrominoes[id].moveLeft);
	},

	moveTetrominoRight: function (id) {
		this._modifyTetromino(id, this._tetrominoes[id].moveRight);
	},

	moveTetrominoDown: function (id) {
		this._modifyTetromino(
			id, this._tetrominoes[id].moveDown, this._placeTetromino);
	},

	rotateTetrominoClockwise: function (id) {
		this._modifyTetromino(id, this._tetrominoes[id].rotateClockwise);
	},

	rotateTetrominoCounterClockwise: function (id) {
		this._modifyTetromino(id, this._tetrominoes[id].rotateCounterClockwise);
	},

	cheat: function (id) {
		console.log("Player " + id + " is a cheater!");
		this._removeLine(this._data.length - 1);
		this.trigger("change:data");
	},

	dropTetromino: function (id) {
		// Move the tetromino downwards until it hits and another tetromino is created
		var tetromino = this._tetrominoes[id];
		while (tetromino === this._tetrominoes[id]) {
			this.moveTetrominoDown(id);
		}
	},

	toggleTetrominoType: function (id) {
		// TODO: Should make subclasses of Tetromino to implement these.
		if (this._tetrominoes[id].type === "bulldoze") {
			this._tetrominoes[id].type = "normal";
			this.trigger("change:tetromino", id);
		} else if (this._tetrominoes[id].type === "float") {
			this._modifyTetromino(id, this._tetrominoes[id].moveUp);
			this._tetrominoes[id].jumpsLeft--;
			if (this._tetrominoes[id].jumpsLeft === 0) {
				this._tetrominoes[id].type = "normal";
			}
			this.trigger("change:tetromino", id);
		} else if (this._tetrominoes[id].type === "chameleon") {
			this._tetrominoes[id].changeTemplate();
			this.trigger("change:tetromino", id);
		}
	},

	_getEmptyLine: function (cols) {
		var line = [];
		for (var col = 0; col < cols; col++) {
			line.push(0);
		}
		return line;
	},

	_newTetromino: function (id) {
		var col = Math.floor(this._data[0].length / 2) - 1;
		this._tetrominoes[id] = TetrisGame.Tetromino.random(0, col);
		this.trigger("change:tetromino", id);

		if (this._doesTetrominoCollide(id)) {
			this._gameOver();
		}
	},

	_doesTetrominoCollide: function (id) {
		var tetromino = this._tetrominoes[id];
		for (var row = 0; row < tetromino.data.length; row++) {
			for (var col = 0; col < tetromino.data[row].length; col++) {
				if (tetromino.data[row][col] && this._isCellOccupied(
					row + tetromino.row,
					col + tetromino.col
				)) return true;
			}
		}

		return false;
	},

	_isCellOccupied: function (row, col) {
		return typeof this._data[row] === "undefined" // Above/below the boundaries
			|| typeof this._data[row][col] === "undefined" // To the left/right of the boundaries
			|| this._data[row][col] !== 0; // The cell is occupied
	},

	_gameOver: function () {
		clearInterval(this._fallInterval);
		this.trigger("game-over");
		this.off();
	},

	_setFallInterval: function (millis) {
		this._fallIntervalMillis = millis || this._fallIntervalMillis;
		if (this._fallInterval) clearInterval(this._fallInterval);
		this._fallInterval = setInterval(_.bind(this._moveTetrominoesDown, this), this._fallIntervalMillis);
	},

	_bulldoze: function(tetromino) {
		var trigger = false;
		for (var row = 0; row < tetromino.data.length; row++) {
			for (var col = 0; col < tetromino.data[row].length; col++) {
				var trueRow = row + tetromino.row;
				var trueCol = col + tetromino.col;

				if (typeof this._data[trueRow] === "undefined" ||
						typeof this._data[trueRow][trueCol] === "undefined") {
					return false;
				}

				if (tetromino.data[row][col] === 1 &&
						this._data[trueRow][trueCol] !== 0) {
					this._data[trueRow][trueCol] = 0;
					trigger = true;
				}
			}
		}

		if (trigger) {
			this.trigger("change:data");
			return true;
		}
	},

	_modifyTetromino: function (id, modificationFunction, collisionFunction) {
		var tetromino = _.clone(this._tetrominoes[id]);

		modificationFunction.call(this._tetrominoes[id]);
		if (this._doesTetrominoCollide(id)) {
			if (tetromino.type === "bulldoze") {
				var modifiedTetromino = this._tetrominoes[id];
				if (this._bulldoze(modifiedTetromino)) {
					return;
				}
			}

			_.extend(this._tetrominoes[id], tetromino);
			if (typeof collisionFunction !== "undefined") {
				collisionFunction.call(this, id);
			}
		} else {
			this.trigger("change:tetromino", id);
		}

		if (tetromino.type === "shear") {
			for (var row = 0; row < tetromino.data.length; row++) {
				for (var col = 0; col < tetromino.data[row].length; col++) {
					trueRow = row + tetromino.row;
					trueCol = col + tetromino.col;
					for (otherId in this._tetrominoes) {
						if (otherId !== id) {
							var cut = this._tetrominoes[otherId].cut(trueRow, trueCol);
							if (cut) {
								this.trigger("change:tetromino", otherId);
							}
						}
					}
				}
			}
		}
	},

	_placeTetromino: function (id) {
		var tetromino = this._tetrominoes[id];
		for (var row = 0; row < tetromino.data.length; row++) {
			for (var col = 0; col < tetromino.data[row].length; col++) {
				if (tetromino.data[row][col]) {
					this._data[row + tetromino.row][col + tetromino.col] = id;
				}
			}
		}
		this._removeCompleteLines();
		this._newTetromino(id);
		this.trigger("change:data");
	},

	_removeCompleteLines: function () {
		var row = this._data.length;
		while (--row >= 0) {
			if (this._isCompleteLine(row)) {
				this._removeLine(row);
				row++;
			}
		}
	},

	_removeLine: function (row) {
		this._data.splice(row, 1);
		this._data.unshift(this._getEmptyLine(this._data[0].length));
		this._incrementLinesCount();
	},

	_isCompleteLine: function (row) {
		for (var col = 0; col < this._data[row].length; col++) {
			if (!this._isCellOccupied(row, col)) return false;
		}
		return true;
	},

	_incrementLinesCount: function () {
		this._linesCount++;
		if (this._linesCount % this.options.levelLinesCount === 0) {
			this._levelUp();
		}
	},

	_levelUp: function () {
		this._level++;
		this._setFallInterval(this._fallIntervalMillis * this.options.levelFallIntervalMultiplier);
	},

	_moveTetrominoesDown: function () {
		for (var id in this._tetrominoes) {
			this.moveTetrominoDown(id);
		}
	}
};

_.extend(TetrisGame.prototype, Events);

TetrisGame.Tetromino = function Tetromino(row, col, templateIndex, type) {
	this.row = row;
	this.col = col;
	this.data = TetrisGame.Tetromino.templates[templateIndex];
	this.templateIndex = templateIndex;
	this.type = type;
	this.jumpsLeft = 10;
}

TetrisGame.Tetromino.templates = [
	[
		[1, 1, 1, 1]
	], [
		[1, 0, 0],
		[1, 1, 1]
	], [
		[0, 0, 1],
		[1, 1, 1]
	], [
		[1, 1],
		[1, 1]
	], [
		[1, 1, 0],
		[0, 1, 1]
	], [
		[0, 1, 1],
		[1, 1, 0]
	], [
		[0, 1, 0],
		[1, 1, 1]
	]
];

function randomSample(items) {
	var random = Math.random();
	for (var item in items) {
		var prob = items[item];
		if (random - prob < 0) {
			return item;
		}
		random -= prob;
	}
}

TetrisGame.Tetromino.random = function (row, col) {
	var typeProbabilities = {
		"normal": 0.6, "bulldoze": 0.05, "float": 0.05, "chameleon": 0.05,
		"shear": 0.25};
	var type = randomSample(typeProbabilities);
	var templateIndex = Math.floor(
		Math.random() * TetrisGame.Tetromino.templates.length);
	return new TetrisGame.Tetromino(row, col, templateIndex, type);
};

TetrisGame.Tetromino.prototype = {
	moveLeft: function () {
		this.col -= 1;
	},

	moveRight: function () {
		this.col += 1;
	},

	moveDown: function () {
		this.row += 1;
	},

	moveUp: function () {
		this.row -= 1;
	},

	rotateClockwise: function () {
		this._rotate(1);
	},

	rotateCounterClockwise: function () {
		this._rotate(-1);
	},

	cut: function(trueRow, trueCol) {
		// Don't cut if there's only one block left.
		var numBlocks = 0;
		for (var row = 0; row < this.data.length; row++) {
			for (var col = 0; col < this.data[row].length; col++) {
				if (this.data[row][col] !== 0) {
					numBlocks += 1;
				}
			}
		}
		if (numBlocks <= 1) {
			return false;
		}

		var touched = false;
		for (var row = 0; row < this.data.length; row++) {
			for (var col = 0; col < this.data[row].length; col++) {
				if (row + this.row === trueRow &&
						col + this.col === trueCol) {
					touched = touched || (this.data[row][col] === 1);
					this.data[row][col] = 0;
				}
			}
		}
		return touched;
	},

	changeTemplate: function () {
		this.templateIndex = (
			this.templateIndex + 1) % TetrisGame.Tetromino.templates.length;
		this.data = TetrisGame.Tetromino.templates[this.templateIndex];
	},

	_rotate: function (x) {
		var data = [];
		for (var col = Math.max(0, -x * (1 - this.data[0].length)); col >= 0 && col < this.data[0].length; col -= x) {
			data.push([]);
			for (var row = Math.max(0, x * (1 - this.data.length)); row >= 0 && row < this.data.length; row += x) {
				data[data.length - 1].push(this.data[row][col]);
			}
		}
		this.data = data;
	}
};

module.exports = TetrisGame;
