/** 
  * CHESS.JS v1.0.0
  * AUTHOR: Frrakn
  * 
  * Somewhat stable...
  * 
  * ISSUES / POTENTIAL "FIXES"
  * 1) Should probably make coordinates a class
  *    and convert to regular [1,8][1,8] coordinates
  * 2) Should make Board.addCoordinates method return a coordinate
  *    instead of modifying the first coordinates... confusing
  *    b/c seems like mixing function programming with OOP
  * 3) Object property declaration for coordinates do not use
  *    rank and file in quotes, as is with other object property
  *    declarations
  * 
  * Simple text-based chess game
  * Parses using algebraic chess notation
  * 
  * Uses UNDERSCORE.JS v1.8.0
  * 
  */

var _ = require('underscore');
var Events = require("events");

var TESTING = false;

/** 
  * PLAYER 
  * 
  * Keeps track of pieces a player owns 
  * and used for methods involving pieces of
  * a specific color.
  * 
  * Player color is determined as
  *   true - white
  *   false - black
  * 
  */

var Player = function Player(color){
  //  boolean: true if white, false if black
  this.color = color;
  
  //  Pieces this player currently owns
  this.pieces = [];

  //  Detemines eligibility for en passant
  this.doublePush = false;
  this.doublePushPawn = null;

  //  Easier to determine check by keeping
  //  a pointer to king and not having to search
  //  for it all the time. Value determined when
  //  game initializes.
  this.king = null;

  this.removePiece = function removePiece(piece){
    var index = _.indexOf(this.pieces, piece);
    if(index > -1){
      this.pieces.splice(index, 1);
    }
  };

  this.addPiece = function addPiece(piece){
    this.pieces.push(piece);
  };
};



/** 
  * GAME
  * 
  * Keeps track of game 
  *  
  * A game contains 2 players, flags for 
  * special positions (gameEnd, check, etc.),
  * a Board and a log of previous Moves.
  *  
  */

var Game = function Game(){
  this.blackPlayer = new Player(false);
  this.whitePlayer = new Player(true);
  this.chessBoard = new Board();
  this.interface = new WebInterface(this);
  this.moveLog = [];
	this.check = false;


  //  Boolean keeps track of game state
  this.turn = true;
  this.validatedMove = false;
  this.gameOver = false;

  //  Other data values to maintain in game
  this.nextMove = null;
  this.validMoves = null;
  this.result = null;

  //  Initializing a game will place pieces in players and boards
  this.init = function init(){
    //  Creating every piece... wish there was a better way
    //  White pieces
    var whitePieces =   [ new Piece('Rook', this.whitePlayer, {file: 2, rank: 2}, this.chessBoard),
                          new Piece('Rook', this.whitePlayer, {file: 9, rank: 2}, this.chessBoard),
                          new Piece('Knight', this.whitePlayer, {file: 3, rank: 2}, this.chessBoard),
                          new Piece('Knight', this.whitePlayer, {file: 8, rank: 2}, this.chessBoard),
                          new Piece('Bishop', this.whitePlayer, {file: 4, rank: 2}, this.chessBoard),
                          new Piece('Bishop', this.whitePlayer, {file: 7, rank: 2}, this.chessBoard),
                          new Piece('Queen', this.whitePlayer, {file: 5, rank: 2}, this.chessBoard),
                          new Piece('King', this.whitePlayer, {file: 6, rank: 2}, this.chessBoard),     //  <--------------- PIECES[7] IS KING
                          new Piece('Pawn', this.whitePlayer, {file: 2, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 3, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 4, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 5, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 6, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 7, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 8, rank: 3}, this.chessBoard),
                          new Piece('Pawn', this.whitePlayer, {file: 9, rank: 3}, this.chessBoard)
                        ];

    //  Black pieces
    var blackPieces =   [ new Piece('Rook', this.blackPlayer, {file: 2, rank: 9}, this.chessBoard),
                          new Piece('Rook', this.blackPlayer, {file: 9, rank: 9}, this.chessBoard),
                          new Piece('Knight', this.blackPlayer, {file: 3, rank: 9}, this.chessBoard),
                          new Piece('Knight', this.blackPlayer, {file: 8, rank: 9}, this.chessBoard),
                          new Piece('Bishop', this.blackPlayer, {file: 4, rank: 9}, this.chessBoard),
                          new Piece('Bishop', this.blackPlayer, {file: 7, rank: 9}, this.chessBoard),
                          new Piece('Queen', this.blackPlayer, {file: 5, rank: 9}, this.chessBoard),
                          new Piece('King', this.blackPlayer, {file: 6, rank: 9}, this.chessBoard),     //  <--------------- PIECES[7] IS KING
                          new Piece('Pawn', this.blackPlayer, {file: 2, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 3, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 4, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 5, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 6, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 7, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 8, rank: 8}, this.chessBoard),
                          new Piece('Pawn', this.blackPlayer, {file: 9, rank: 8}, this.chessBoard)
                        ];

    this.chessBoard.addPieces(whitePieces);
    this.chessBoard.addPieces(blackPieces);
    Array.prototype.push.apply(this.whitePlayer.pieces, whitePieces);
    Array.prototype.push.apply(this.blackPlayer.pieces, blackPieces);

    this.whitePlayer.king = whitePieces[7];
    this.blackPlayer.king = blackPieces[7];

    //  Sentinel pieces
    for(var i = 0; i < this.chessBoard.contents.length; i++){
      for(var j = 0; j < this.chessBoard.contents[0].length; j++){
        if(this.chessBoard.FILES - i  <= 2 || this.chessBoard.RANKS - j <= 2 || i < 2 || j < 2){
          this.chessBoard.addPiece(new Piece('INVALID', null, {file: i, rank: j}, this.chessBoard));
        }
      }
    }
  }

  this.displayState = function displayState(){
    console.log(this.chessBoard.toString());
    console.log((this.turn ? 'White' : 'Black') + '\'s turn to move:');
  };

  this.matchMove = function matchMove(move){
    //  Make sure validMoves is created
    if(!this.validMoves){
      throw 'Valid moves have not been created, need to call resolveBoard';
    }
    var potentialMoves = [];
    //  Depends on moveType
    switch(MOVE_TYPE[move.moveType]){
      case 'Move':
        _.each(this.validMoves, function(element, index, list){
          //  First, match moveType, pieceType, coordinates_new, captureflag, promoteFlag, and promotePiece
          if((element.moveType === move.moveType) && (element.chessPiece.type === move.chessPiece.type) && (_.isEqual(element.coordinates_new, move.coordinates_new)) && (element.captureFlag === move.captureFlag) && (element.promoteFlag === move.promoteFlag) && (element.promoteType === move.promoteType)){
            potentialMoves.push(element);
          }
        },this);

        //  Clearing out for any potential disambiguation
        potentialMoves = _.reject(potentialMoves, function(element, index, list){
          return ((move.coordinates_old.file !== -1) && (move.coordinates_old.file !== element.coordinates_old.file)) || ((move.coordinates_old.rank !== -1) && (move.coordinates_old.rank !== element.coordinates_old.rank));
        }, this);

        //  If one valid move, return move
        if(potentialMoves.length === 1){
          this.validatedMove = true;
          return potentialMoves[0];
        }
        //  If still multiple moves, need to disambiguate
        if(potentialMoves.length > 1){
          console.log(potentialMoves);
          throw 'Multiple moves found, need to disambiguate piece by including either file or rank of original position.'
        }
        //  If no moves, will continue to end
        break;
      //  For castling kingside and queenside, just need to match moveType
      case 'CastleKing':
      case 'CastleQueen':
        var output;
        _.each(this.validMoves, function(element, index, list){
          if(element.moveType === move.moveType){
            this.validatedMove = true;
            output = element;
          }
        }, this);
        if(this.validatedMove){
          return output;
        }
        break;
      case 'INVALID':
        throw 'INVALID move entered.'
        break;
    }
    throw 'Sorry, move is not valid in context of board.';
  };

	this.PGN = function PGN(move){
		switch(MOVE_TYPE[move.moveType]){
			case 'Move':
				var disambigRank;
				var disambigCol;
				var curLoc;
				var nextLoc;
				var output = "";
				_.each(this.validMoves, function(element, index, list){
					if(element !== move && element.chessPiece && move.chessPiece && element.chessPiece.type === move.chessPiece.type && element.coordinates_new.file === move.coordinates_new.file && element.coordinates_new.rank === move.coordinates_new.rank){
						if(element.coordinates_old.file !== move.coordinates_old.file){
							disambigCol = true;
						}
						else{
							disambigRank = true;
						}
					}
				});

				nextLoc = this.chessBoard.getLocation(move.coordinates_new);
				curLoc = this.chessBoard.getLocation(move.coordinates_old);
				if(PIECE_TYPE[move.chessPiece.type] === "Pawn"){
					if(move.captureFlag){
						output += curLoc.file + "x";
					}

					output += nextLoc.file + nextLoc.rank;

					if(move.promoteFlag){
						output += "=" + PIECE_ABBREV[move.promoteType];
					}
				}
				else{
					output += PIECE_ABBREV[move.chessPiece.type];
					if(disambigCol){
						output += curLoc.file;
					}
					if(disambigRank){
						output += curLoc.rank;
					}
					if(move.captureFlag){
						output += "x";
					}
					output += nextLoc.file + nextLoc.rank;
				}
				break;
			case 'CastleKing':
				output = "O-O";
				break;
			case 'CastleQueen':
				output = "O-O-O";
				break;
			case 'INVALID':
				output = "INVALID";
				break;
		}
		return output;
	}

  this.executeMove = function executeMove(move, setFlags){
    var player = this.turn ? this.whitePlayer : this.blackPlayer;
    var opponent = this.turn ? this.blackPlayer : this.whitePlayer;

    //  Move must be valid if Flags are going to be set
    if(!setFlags || this.validatedMove){
      this.moveLog.push([move, this.PGN(move)]);
      switch(MOVE_TYPE[move.moveType]){
        case 'Move':          
          //  Removing captured chess piece
          if(move.captureFlag){
            opponent.removePiece(move.capturePiece);
            this.chessBoard.removePiece(move.capturePiece.coordinates);
          }

          //  Moving the chess piece
          this.chessBoard.movePiece(move.chessPiece, move.coordinates_new);

          //  Promoting piece if flag is set
          if(move.promoteFlag){
            move.chessPiece.type = move.promoteType;
          }

          if(setFlags){
            move.chessPiece.hasMoved = true;

            //  Setting flags for en passant
            if((PIECE_TYPE[move.chessPiece.type] === 'Pawn') && (move.coordinates_new.rank - move.coordinates_old.rank === (player.color ? 2 : -2))){
              player.doublePush = true;
              player.doublePushPawn = move.chessPiece;
            }
						else{
							player.doublePush = false;
						}
          }
          break;
        case 'CastleKing':
          var region = this.chessBoard.castlingRegions[this.turn]['King'];
          var king = this.chessBoard.getPiece(region[region.length - 1]);
          var rook = this.chessBoard.getPiece(region[0]);
          this.chessBoard.movePiece(king, region[region.length - 3]);
          this.chessBoard.movePiece(rook, region[region.length - 2]);
          if(setFlags){
            king.hasMoved = true;
            rook.hasMoved = true;
          }
          break;
        case 'CastleQueen':
          var region = this.chessBoard.castlingRegions[this.turn]['Queen'];
          var king = this.chessBoard.getPiece(region[region.length - 1]);
          var rook = this.chessBoard.getPiece(region[0]);
          this.chessBoard.movePiece(king, region[region.length - 3]);
          this.chessBoard.movePiece(rook, region[region.length - 2]);
          if(setFlags){
            king.hasMoved = true;
            rook.hasMoved = true;
          }
          break;
        //  Shouldn't be getting here in normal execution
        //  Moves must be validated before execution
        case 'INVALID':
          throw 'Execution of INVALID Move object';
          break;
      }
    }
    else{
      throw 'Execution of non-validated Move object';
    }
  };

  this.undoMove = function undoMove(){
    var move = this.moveLog.pop()[0];
    var player = this.turn ? this.whitePlayer : this.blackPlayer;
    var opponent = this.turn ? this.blackPlayer : this.whitePlayer;
    switch(MOVE_TYPE[move.moveType]){
        case 'Move':

          //  Un-promoting pawns
          if(move.promoteFlag){
            move.chessPiece.type = PIECE_TYPE['Pawn'];
          }

          //  Returning the chess piece
          this.chessBoard.movePiece(move.chessPiece, move.coordinates_old);

          //  Adding back captured chess piece
          if(move.captureFlag){
            opponent.addPiece(move.capturePiece);
            this.chessBoard.addPiece(move.capturePiece);
          }

          break;
        case 'CastleKing':
          var region = this.chessBoard.castlingRegions[this.turn]['King'];
          var king = this.chessBoard.getPiece(region[region.length - 3]);
          var rook = this.chessBoard.getPiece(region[region.length - 2]);
          this.chessBoard.movePiece(king, region[region.length - 1]);
          this.chessBoard.movePiece(rook, region[0]);
          break;
        case 'CastleQueen':
          var region = this.chessBoard.castlingRegions[this.turn]['Queen'];
          var king = this.chessBoard.getPiece(region[region.length - 3]);
          var rook = this.chessBoard.getPiece(region[region.length - 2]);
          this.chessBoard.movePiece(king, region[region.length - 1]);
          this.chessBoard.movePiece(rook, region[0]);
          break;
        //  Shouldn't be getting here in normal execution
        //  Moves must be validated before execution
        case 'INVALID':
          throw 'Undoing of INVALID Move object';
          break;
      }
  };

  //  Differs from Piece.getValidMoves because this also
  //  validates move in context of check
  //  ** Valid moves is now a dictionary organized by FEN
  this.getValidMoves = function getValidMoves(){
    var player = this.turn ? this.whitePlayer : this.blackPlayer;
    var validMoves = {};
    _.each(player.pieces, function(element, index, list){
      var moves = element.getValidMoves();
      _.each(moves, function(element, index, list){
        if(MOVE_TYPE[element.moveType] == 'CastleKing'){
          var region = this.chessBoard.castlingRegions[this.turn]['King'];
          var king = this.chessBoard.getPiece(region[region.length - 1]);
          this.chessBoard.movePiece(king, region[region.length - 3]);
          validMoves[this.chessBoard.toFEN()] = element;
          this.chessBoard.movePiece(king, region[region.length - 1]);
        }
        else if(MOVE_TYPE[element.moveType] == 'CastleQueen'){
          var region = this.chessBoard.castlingRegions[this.turn]['Queen'];
          var king = this.chessBoard.getPiece(region[region.length - 1]);
          this.chessBoard.movePiece(king, region[region.length - 3]);
          validMoves[this.chessBoard.toFEN()] = element;
          this.chessBoard.movePiece(king, region[region.length - 1]);
        }
        else if(element.capturePiece && !(element.capturePiece.coordinates.file === element.coordinates_new.file && element.capturePiece.coordinates.rank === element.coordinates_new.rank)){
          element.captureFlag = false;
          this.executeMove(element, false);
            if(!this.chessBoard.getAttackers(player.king.coordinates, !this.turn)){
              validMoves[this.chessBoard.toFEN()] = element;
            }
          this.undoMove(element);
          element.captureFlag = true;
        }
        else{
          this.executeMove(element, false);
            if(!this.chessBoard.getAttackers(player.king.coordinates, !this.turn)){
              validMoves[this.chessBoard.toFEN()] = element;
            }
          this.undoMove(element);
        }
      }, this);
    }, this);
    return (Object.keys(validMoves).length) ? validMoves : null;
  };

  //  Based on current state of valid Moves
  //  GETVALIDMOVES MUST RUN BEFORE RESOLVING BOARD
  this.resolveBoard = function resolveBoard(){
    var player = this.turn ? this.whitePlayer : this.blackPlayer;
    this.validMoves = this.getValidMoves();
		this.check = this.chessBoard.getAttackers(player.king.coordinates, !this.turn);
    if(!this.validMoves){
      this.gameOver = true;
      this.displayState();
      //  If check
      if(this.check){
        this.result = this.turn ? 'Black player' : 'White player';
        console.log('Checkmate! ' + this.result + ' wins!');
      }
      //  No check, no valid moves -> stalemate
      else{
        this.result = 'Stalemate!';
        console.log('Stalemate!');
      }
    }
  };

  this.run = function run(){
		var self = this;
    this.init();

   //  TESTING CODE
   //  while(true){
   //    try{
   //      eval(readline.prompt());
   //    }
   //    catch(err){
   //      console.log(err);
   //    }
   //  }

    //  Loops for each turn while gameOver flag is false
    this.resolveBoard();
		this.validatedMove = true;
		this.interface.on("move", function(FEN){
			self.nextMove = self.validMoves[FEN];
			if(self.nextMove){
				self.executeMove(self.nextMove, true);

				//  Set state for next turn
				self.turn = !self.turn;
				//  self.validatedMove = false; //  Don't need this if using web interface

				//  Down here b/c gameOver takes us out of loop
				self.resolveBoard();
				if(self.gameOver && self.check){
					self.moveLog[self.moveLog.length - 1][1] = self.moveLog[self.moveLog.length - 1][1] + "*";
				}
				else if(self.check){
					self.moveLog[self.moveLog.length - 1][1] = self.moveLog[self.moveLog.length - 1][1] + "+";
				}
				else{
				}
				self.interface.emit("update", [self.chessBoard.toFEN(), self.moveLog[self.moveLog.length - 1][1]]);
				
				if(self.gameOver){
					self.interface.emit("gameover", self.result);
				}
			}
			else{
				self.interface.emit("invalid");
			}
    });
  };
};



/** 
  * PIECE
  * 
  * Represents single chess piece 
  *  
  * Lookups on piece type will be handled by
  * PIECE_TYPE lookup.
  * 
  */
//  For use with toString
var PIECE_ABBREV = ['K', 'Q', 'R', 'B', 'N', 'P'];
var PIECE_TYPE = ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn', 'INVALID'];
//  Augments the regular lookup with inverse
var INVERSE_PIECE = {
  'King': 0,
  'K': 0,
  'Queen': 1,
  'Q': 1,
  'Rook': 2,
  'R': 2,
  'Bishop': 3,
  'B': 3,
  'Knight': 4,
  'N': 4,
  'Pawn': 5,
  'P': 5,
  'INVALID': 6
};
_.extend(PIECE_TYPE, INVERSE_PIECE);

var Piece = function Piece(type, owner, coordinates, board){
  this.type = PIECE_TYPE[type];
  this.owner = owner;
  this.coordinates = coordinates;
  this.board = board;
  this.hasMoved = false;

  //  Gets all valid moves by current piece
  this.getValidMoves = function getValidMoves(){
    var validMoves = [];

    switch(PIECE_TYPE[this.type]){
      case 'King':
        //  Check that this piece has not moved
        if(!this.hasMoved){
          //  Get player color
          var color = this.owner.color;

          var regions = this.board.castlingRegions[color]['King'];
          var rook = this.board.getPiece(regions[0])
          //  Check King's rook for moves
          if(rook && !rook.hasMoved){
            //  Checking that way is unobstructed
            if(_.every(regions, function(element, index, list){
              //  if the Piece is the King or the Rook, or undefined
              var piece = this.board.getPiece(element)
              return (piece === this) || (piece === rook) || (piece === undefined);
            }, this)){
              //  Checking for any castling regions under attack
              if(!_.some(regions, function(element, index, list){
                return this.board.getAttackers(element, !color);
              }, this)){
                validMoves.push(new Move('CastleKing'));
              }
            }
          }

          regions = this.board.castlingRegions[color]['Queen'];
          rook = this.board.getPiece(regions[0])
          //  Check King's rook for moves
          if(rook && !rook.hasMoved){
            //  Checking that way is unobstructed
            if(_.every(regions, function(element, index, list){
              //  if the Piece is the King or the Rook, or undefined
              var piece = this.board.getPiece(element)
              return (piece === this) || (piece === rook) || (piece === undefined);
            }, this)){
              //  Checking for any castling regions under attack
              if(!_.some(regions, function(element, index, list){
                return this.board.getAttackers(element, !color);
              }, this)){
                validMoves.push(new Move('CastleQueen'));
              }
            }
          }
        }
      case 'Knight':
        var directions = PIECE_DIRECTIONS[PIECE_TYPE[this.type]];
        _.each(directions, function(element, index, list){
          var newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
          newMove.coordinates_new = _.clone(this.coordinates);
          this.board.addCoordinates(newMove.coordinates_new, element);

          //  If the space is empty, new move available
          if(!this.board.getPiece(newMove.coordinates_new)){
            validMoves.push(newMove);
          }
          //  Otherwise, check piece type to see if capture is available
          else{
            var adjacentPiece = this.board.getPiece(newMove.coordinates_new);
            //  First part short circuit should be unneeded, but making sure not null
            if(adjacentPiece && adjacentPiece.owner && (adjacentPiece.owner.color !== this.owner.color)){
              newMove.captureFlag = true;
              newMove.capturePiece = adjacentPiece;
              validMoves.push(newMove);
            }
          }
        }, this);
        break;
      case 'Rook':
      case 'Bishop':
      case 'Queen':
        var directions = PIECE_DIRECTIONS[PIECE_TYPE[this.type]];
        var extents = this.board.crawl(this.coordinates, directions);
        _.each(extents, function(element, index, list){
          var newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
          newMove.coordinates_new = _.clone(this.coordinates);
          this.board.addCoordinates(newMove.coordinates_new, directions[index]);
          //  Loop (element - 1) times: non-capturing move is valid, keep incrementing by direction
          for(var i = 1; i < element; i++){
            validMoves.push(newMove.clone());
            this.board.addCoordinates(newMove.coordinates_new, directions[index]);
          }
          //  Afterwards, check piece type to see if capture is available
          var adjacentPiece = this.board.getPiece(newMove.coordinates_new);
          //  First part short circuit should be unneeded, but making sure not null
          if(adjacentPiece && adjacentPiece.owner && (adjacentPiece.owner.color !== this.owner.color)){
            newMove.captureFlag = true;
            newMove.capturePiece = adjacentPiece;
            validMoves.push(newMove);
          }
        }, this);
        break;
      case 'Pawn':
        //  NOTE: OPPOSITE OF DIRECTION DEFINITION FOR BOARD.GETATTACKERS. GETATTACKERS
        //  USES DIRECTION IN CONTEXT OF ATTACKED PIECE, THIS USES DIRECTION IN CONTEXT
        //  OF SELECTED PIECE.
        var direction = this.owner.color ? 1 : -1;

        //  DIAGONAL CAPTURES
        var diagonals = [{file: 1, rank: direction}, {file: -1, rank: direction}];

        _.each(diagonals, function(element, index, list){
          var newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
          newMove.coordinates_new = _.clone(this.coordinates);
          this.board.addCoordinates(newMove.coordinates_new, element);

          var adjacentPiece = this.board.getPiece(newMove.coordinates_new);
          //  First part short circuit should be unneeded, but making sure not null
          if(adjacentPiece && adjacentPiece.owner && (adjacentPiece.owner.color !== this.owner.color)){
            newMove.captureFlag = true;
            newMove.capturePiece = adjacentPiece;
            newMove.promoteFlag = newMove.coordinates_new.rank === this.board.PROMOTIONRANKS[this.owner.color];
            if(newMove.promoteFlag){
              var promoteQ = newMove.clone();
              var promoteB = newMove.clone();
              var promoteN = newMove.clone();
              var promoteR = newMove.clone();
              promoteQ.promoteType = PIECE_TYPE['Queen'];
              promoteB.promoteType = PIECE_TYPE['Bishop'];
              promoteN.promoteType = PIECE_TYPE['Knight'];
              promoteR.promoteType = PIECE_TYPE['Rook'];
              validMoves.push(promoteQ);
              validMoves.push(promoteB);
              validMoves.push(promoteN);
              validMoves.push(promoteR);
            }
            else{
              validMoves.push(newMove);
            }
          }
        }, this);

        //  FORWARD MOVES
        var newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
        newMove.coordinates_new = _.clone(this.coordinates);
        
        //  SINGLE PUSH
        newMove.coordinates_new.rank += direction;
        if(!this.board.getPiece(newMove.coordinates_new)){
          newMove.promoteFlag = newMove.coordinates_new.rank === this.board.PROMOTIONRANKS[this.owner.color];
            if(newMove.promoteFlag){
              var promoteQ = newMove.clone();
              var promoteB = newMove.clone();
              var promoteN = newMove.clone();
              var promoteR = newMove.clone();
              promoteQ.promoteType = PIECE_TYPE['Queen'];
              promoteB.promoteType = PIECE_TYPE['Bishop'];
              promoteN.promoteType = PIECE_TYPE['Knight'];
              promoteR.promoteType = PIECE_TYPE['Rook'];
              validMoves.push(promoteQ);
              validMoves.push(promoteB);
              validMoves.push(promoteN);
              validMoves.push(promoteR);
            }
            else{
              validMoves.push(newMove);
            }

          //  DOUBLE PUSH
          newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
          newMove.coordinates_new = _.clone(this.coordinates);
          newMove.coordinates_new.rank += direction * 2;
          if(!this.board.getPiece(newMove.coordinates_new) && !this.hasMoved){
            //  Should not be the case...
            newMove.promoteFlag = newMove.coordinates_new.rank === this.board.PROMOTIONRANKS[this.owner.color];
            if(newMove.promoteFlag){
              var promoteQ = newMove.clone();
              var promoteB = newMove.clone();
              var promoteN = newMove.clone();
              var promoteR = newMove.clone();
              promoteQ.promoteType = PIECE_TYPE['Queen'];
              promoteB.promoteType = PIECE_TYPE['Bishop'];
              promoteN.promoteType = PIECE_TYPE['Knight'];
              promoteR.promoteType = PIECE_TYPE['Rook'];
              validMoves.push(promoteQ);
              validMoves.push(promoteB);
              validMoves.push(promoteN);
              validMoves.push(promoteR);
            }
            else{
              validMoves.push(newMove);
            }
          }
        }

        //  EN PASSANT
        var EPTargets = _.map(diagonals, function(element, index, list){
          var element_new = _.clone(element);
          element_new.rank = 0;
          this.board.addCoordinates(element_new, this.coordinates);
          return element_new;
        }, this);

        _.each(EPTargets, function(element, index, list){
          newMove = new Move('Move', this, this.coordinates, undefined, false, undefined, false, undefined);
          newMove.coordinates_new = _.clone(this.coordinates);
          this.board.addCoordinates(newMove.coordinates_new, diagonals[index]);
          var EPPiece = this.board.getPiece(element);
          if(EPPiece && EPPiece.owner && (EPPiece.owner.color !== this.owner.color) && !this.board.getPiece(newMove.coordinates_new) && EPPiece.owner.doublePush && (EPPiece.owner.doublePushPawn === EPPiece)){
            newMove.captureFlag = true;
            newMove.capturePiece = EPPiece;

            //  Shouldn't really be a case, but included for completeness's sake
            newMove.promoteFlag = newMove.coordinates_new.rank === this.board.PROMOTIONRANKS[this.owner.color];
            if(newMove.promoteFlag){
              var promoteQ = newMove.clone();
              var promoteB = newMove.clone();
              var promoteN = newMove.clone();
              var promoteR = newMove.clone();
              promoteQ.promoteType = PIECE_TYPE['Queen'];
              promoteB.promoteType = PIECE_TYPE['Bishop'];
              promoteN.promoteType = PIECE_TYPE['Knight'];
              promoteR.promoteType = PIECE_TYPE['Rook'];
              validMoves.push(promoteQ);
              validMoves.push(promoteB);
              validMoves.push(promoteN);
              validMoves.push(promoteR);
            }
            else{
              validMoves.push(newMove);
            }
          }
        }, this);

        break;
    }
    return (validMoves.length > 0) ? validMoves : null;
  };
};

//  Utility for checking different directions / possible relative moves
//  for pieces. Used together with Board.crawl
var PIECE_DIRECTIONS = {
  'King':   [ {file: 1,rank: 1},
              {file: 1,rank: 0},
              {file: 1,rank: -1},
              {file: 0,rank: 1},
              {file: 0,rank: -1},
              {file: -1,rank: 1},
              {file: -1,rank: 0},
              {file: -1,rank: -1}
            ],
  'Queen':  [ {file: 1,rank: 1},
              {file: 1,rank: 0},
              {file: 1,rank: -1},
              {file: 0,rank: 1},
              {file: 0,rank: -1},
              {file: -1,rank: 1},
              {file: -1,rank: 0},
              {file: -1,rank: -1}
            ],
  'Rook':   [ {file: 1,rank: 0},
              {file: 0,rank: 1},
              {file: 0,rank: -1},
              {file: -1,rank: 0}
            ],
  'Bishop': [ {file: 1,rank: 1},
              {file: 1,rank: -1},
              {file: -1,rank: 1},
              {file: -1,rank: -1}
            ],
  'Knight': [ {file: 2,rank: 1},
              {file: 2,rank: -1},
              {file: 1,rank: 2},
              {file: 1,rank: -2},
              {file: -2,rank: 1},
              {file: -2,rank: -1},
              {file: -1,rank: 2},
              {file: -1,rank: -2}
            ]
};

//  Overriding toString() for a piece to help print out entire board
Piece.prototype.toString = function toString(){
  return (this.type === 6) ? ' ' : (this.owner.color ? (PIECE_ABBREV[this.type]).toUpperCase() : (PIECE_ABBREV[this.type]).toLowerCase());
};



/** 
  * BOARD
  * 
  * Extended 12x12 array of pieces with additional
  * functionality, i.e. checking for piece location,
  * move validity, and determining check. 2 extra spaces
  * of padding on all 4 sides with sentinel pieces to ease
  * determination of move validity.
  * 
  */

var Board = function Board(){
  this.FILES_BOARD = 8;
  this.RANKS_BOARD = 8;
  this.SENTINEL_PADDING = 2;
  this.FILES = this.FILES_BOARD + this.SENTINEL_PADDING * 2;
  this.RANKS = this.RANKS_BOARD + this.SENTINEL_PADDING * 2;
  this.PROMOTIONRANKS = {true: this.SENTINEL_PADDING + this.RANKS_BOARD - 1, false: this.SENTINEL_PADDING};
  this.contents = new Array(this.FILES);

  for(var i = 0; i < this.RANKS; i++)
  {
    this.contents[i] = new Array(this.RANKS);
  }

  //  Castling regions (need to check for any attackers
  //  on these spaces)
  this.castlingRegions = {
    true:   {
              'King':   [
                          {file: 9, rank: 2},   // <------ ROOK POSITION
                          {file: 8, rank: 2},   // <------ CASTLED KING POSITION
                          {file: 7, rank: 2},   // <------ CASTLED ROOK POSITION
                          {file: 6, rank: 2}    // <------ KING POSITION
                        ],
              'Queen':  [
                          {file: 2, rank: 2},   // <------ ROOK POSITION
                          {file: 3, rank: 2},
                          {file: 4, rank: 2},   // <------ CASTLED KING POSITION
                          {file: 5, rank: 2},   // <------ CASTLED ROOK POSITION
                          {file: 6, rank: 2}    // <------ KING POSITION
                        ]
            },
    false:  {
              'King':   [
                          {file: 9, rank: 9},   // <------ ROOK POSITION
                          {file: 8, rank: 9},   // <------ CASTLED KING POSITION
                          {file: 7, rank: 9},   // <------ CASTLED ROOK POSITION
                          {file: 6, rank: 9}    // <------ KING POSITION
                        ],
              'Queen':  [
                          {file: 2, rank: 9},   // <------ ROOK POSITION
                          {file: 3, rank: 9},
                          {file: 4, rank: 9},   // <------ CASTLED KING POSITION
                          {file: 5, rank: 9},   // <------ CASTLED ROOK POSITION
                          {file: 6, rank: 9}    // <------ KING POSITION
                        ]
            }
  };

	this.getLocation = function getLocation(coordinates){
		var output = {};
		
		output.file = String.fromCharCode("a".charCodeAt(0) + coordinates.file - this.SENTINEL_PADDING);
		output.rank = coordinates.rank - this.SENTINEL_PADDING + 1;

		return output;
	};

  this.addPiece = function addPiece(piece){
    this.contents[piece.coordinates.file][piece.coordinates.rank] = piece;
  };

  this.addPieces = function addPieces(array){
    _.each(array, function(element, index, list){
      this.addPiece(element);
    }, this);
  };

  this.removePiece = function removePiece(coordinates){
    var temp = this.contents[coordinates.file][coordinates.rank];
    this.contents[coordinates.file][coordinates.rank] = undefined;
    return temp;
  }

  this.movePiece = function movePiece(piece, coordinates_new){
    var coordinates_old = piece.coordinates;
    piece.coordinates = _.clone(coordinates_new);
    this.contents[coordinates_old.file][coordinates_old.rank] = undefined;
    this.addPiece(piece);
  }

  //  Gets all attackers of a Player on a single square
  //  Returns an array of Pieces
  //  ONLY DETERMINES ATTACKERS IN CONTEXT OF CHECK
  //  DOES NOT INCORPORATE EN PASSANT
  this.getAttackers = function getAttackers(coordinates, color){
    var attackers = [];

    //  Getting direction of player
    var playerDirection = color ? -1 : 1;

    //  Crawl in all directions and check knight squares
    var directionVectors;

    //  Crawling in STRAIGHT directions
    var directionVectors = ATTACK_DIRECTIONS['Straight'];
    var extents = this.crawl(coordinates, directionVectors);
    _.each(extents, function(element, index, list){
      var coordinates_temp = _.clone(coordinates);
      var directions_temp = _.clone(directionVectors[index]);
      directions_temp.file *= element;
      directions_temp.rank *= element;
      this.addCoordinates(coordinates_temp, directions_temp);
      var adjacentPiece = this.getPiece(coordinates_temp);
      //  After getting adjacent Piece
      //  If piece exists 
      //  Has an owner
      //  Owner matches Player
      //  Piece type is King, Queen or Rook
      if(adjacentPiece && adjacentPiece.owner && adjacentPiece.owner.color === color && ((PIECE_TYPE[adjacentPiece.type] === 'King' && element === 1) || PIECE_TYPE[adjacentPiece.type] === 'Queen' || PIECE_TYPE[adjacentPiece.type] === 'Rook')){
        attackers.push(adjacentPiece);
      }
    }, this);

    //  Crawling in DIAGONAL directions
    directionVectors = ATTACK_DIRECTIONS['Diagonal'];
    extents = this.crawl(coordinates, directionVectors);
    _.each(extents, function(element, index, list){
      coordinates_temp = _.clone(coordinates);
      directions_temp = _.clone(directionVectors[index]);
      directions_temp.file *= element;
      directions_temp.rank *= element;
      this.addCoordinates(coordinates_temp, directions_temp);
      adjacentPiece = this.getPiece(coordinates_temp);
      //  After getting adjacent Piece
      //  If piece exists 
      //  Has an owner
      //  Owner matches Player
      //  Piece type is King, Pawn, Queen, or Bishop
      if(adjacentPiece && adjacentPiece.owner && adjacentPiece.owner.color === color && ((PIECE_TYPE[adjacentPiece.type] === 'Pawn' && directionVectors[index].rank === playerDirection && element === 1) || (PIECE_TYPE[adjacentPiece.type] === 'King' && element === 1) || PIECE_TYPE[adjacentPiece.type] === 'Queen' || PIECE_TYPE[adjacentPiece.type] === 'Bishop')){
        attackers.push(adjacentPiece);
      }
    }, this);

    //  No Crawl for Knight directions
    directionVectors = ATTACK_DIRECTIONS['Knight'];
    _.each(directionVectors, function(element, index, list){
      coordinates_temp = _.clone(coordinates);
      this.addCoordinates(coordinates_temp, element);
      adjacentPiece = this.getPiece(coordinates_temp);
      //  After getting adjacent Piece
      //  If piece exists 
      //  Has an owner
      //  Owner matches Player
      //  Piece type is Knight
      if(adjacentPiece && adjacentPiece.owner && adjacentPiece.owner.color === color && PIECE_TYPE[adjacentPiece.type] === 'Knight'){
        attackers.push(adjacentPiece);
      }
    }, this);
    return (attackers.length > 0) ? attackers : null;
  };

  //  Crawls board from point of origin in given directions (coordinate-set deltas)
  //  and returns the extent of open board room in that direction (number of deltas
  //  applied to origin before hitting another piece or running off of board) for 
  //  each direction
  this.crawl = function crawl(coordinates_origin, directions){
    var extents = new Array(directions.length);
    _.each(directions, function(element, index, list){
      //  Min number before piece collision is 1
      var count = 1;
      var coordinates_temp = _.clone(coordinates_origin);
      this.addCoordinates(coordinates_temp, element);
      while(this.getPiece(coordinates_temp) == undefined){
        count++;
        this.addCoordinates(coordinates_temp, element);
      }
      //  Store in extents array
      extents[index] = count;
    }, this);
    return extents;
  };

  //  Adds second set of coordinates to the first set. DOES NOT RETURN NEW SET
  //  AND ONLY MODIFIES THE FIRST SET. Should put this in coordinates class if 
  //  there ever were one to be made...
  this.addCoordinates = function addCoordinates(coordinates_1, coordinates_2){
    coordinates_1.file += coordinates_2.file;
    coordinates_1.rank += coordinates_2.rank;
  };

  //  Simpler piece retrieval
  this.getPiece = function getPiece(coordinates){
    return this.contents[coordinates.file][coordinates.rank];
  };

  //  Returns FEN representation of a board
	this.toFEN = function toFEN(){
  var output = "";
  for(var rank = this.contents[0].length - this.SENTINEL_PADDING - 1; rank >= this.SENTINEL_PADDING; rank--){
    var tempString = "";
    for(var file = this.SENTINEL_PADDING; file < this.contents.length - this.SENTINEL_PADDING; file++){
      tempString += this.contents[file][rank] ? this.contents[file][rank].toString() : '1'; 
    }
    output += tempString + "/";
  }

  output = output.replace(/11111111/gm, "8");
  output = output.replace(/1111111/gm, "7");
  output = output.replace(/111111/gm, "6");
  output = output.replace(/11111/gm, "5");
  output = output.replace(/1111/gm, "4");
  output = output.replace(/111/gm, "3");
  output = output.replace(/11/gm, "2");

  return output.substring(0, output.length - 1);
  }
};

//  Overriding toString to print out Board contents
Board.prototype.toString = function toString(){
  var output = '\n';
  for(var rank = 0; rank < this.contents[0].length; rank++){
    var tempString = '';
    for(var file = 0; file < this.contents.length; file++){
      tempString += (this.contents[file][rank] ? this.contents[file][rank].toString() : '-')+ ' '; 
    }
    output += tempString + '\n';
  }
  return output;
}

var ATTACK_DIRECTIONS = {
  'Straight': PIECE_DIRECTIONS['Rook'],
  'Diagonal': PIECE_DIRECTIONS['Bishop'],
  'Knight':   PIECE_DIRECTIONS['Knight']
};

/**
	* Web Interface
	* 
	* Listens for moves
	* Emits updates
	*
	*/

var WebInterface = function WebInterface(game){
	this.chessGame = game;
}

WebInterface.prototype.__proto__ = Events.EventEmitter.prototype;

/** 
  * Interface
  * 
  * Public interface that exposes certain objects and 
  * methods used to play game.
  * 
  */

var Interface = function Interface(game){
  this.chessGame = game;

  //  Parses all moves as incoming text
  this.parseMove = function parseMove(string){
    var output = new Move();
    output.chessPiece = new Piece();
    output.coordinates_new = {file: -1, rank: -1};
    output.coordinates_old = {file: -1, rank: -1};
    //  ASCII character before 'a'
    var FILE_ZERO = '`';
    //  Setting flags, default to false
    output.captureFlag = output.promoteFlag = false;
    //  By default move is INVALID
    output.moveType = MOVE_TYPE['INVALID'];
    //  Iterate over all possible move formats
    for(var i in MOVE_REGEX){
      //  Try to match regex to input string
      var res = MOVE_REGEX[i].exec(string);
      // if match, populate output Move to extent possible
      if(res !== null){
        switch(i){
          case 'PAWN_MOVE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE['Pawn'];
            output.coordinates_old.file = output.coordinates_new.file = res[1].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[2] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            break;
          case 'PAWN_PROMOTE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE['Pawn'];
            output.coordinates_old.file = output.coordinates_new.file = res[1].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[2] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.promoteFlag = true;
            output.promoteType = PIECE_TYPE[res[3]];
            break;
          case 'PAWN_CAPTURE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE['Pawn'];
            output.coordinates_old.file = res[1].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1
            output.coordinates_new.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[3] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.captureFlag = true;
            break;
          case 'PAWN_CAPTURE_PROMOTE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE['Pawn'];
            output.coordinates_old.file = res[1].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[3] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.captureFlag = true;
            output.promoteFlag = true;
            output.promoteType = PIECE_TYPE[res[4]];
            break;
          case 'PIECE_MOVE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_new.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[3] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            break;
          case 'PIECE_CAPTURE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_new.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[3] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.captureFlag = true;
            break;
          case 'PIECE_MOVE_DISAMBIG_FILE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_old.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.file = res[3].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[4] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            break;
          case 'PIECE_CAPTURE_DISAMBIG_FILE':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_old.file = res[2].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.file = res[3].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[4] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.captureFlag = true;
            break;
          case 'PIECE_MOVE_DISAMBIG_RANK':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_old.rank = +res[2] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.file = res[3].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[4] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            break;
          case 'PIECE_CAPTURE_DISAMBIG_RANK':
            output.moveType = MOVE_TYPE['Move'];
            output.chessPiece.type = PIECE_TYPE[res[1]];
            output.coordinates_old.rank = +res[2] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.file = res[3].charCodeAt() - FILE_ZERO.charCodeAt() + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.coordinates_new.rank = +res[4] + this.chessGame.chessBoard.SENTINEL_PADDING - 1;
            output.captureFlag = true;
            break;
          case 'CASTLE_KING':
            output.moveType = MOVE_TYPE['CastleKing'];
            break;
          case 'CASTLE_QUEEN':
            output.moveType = MOVE_TYPE['CastleQueen'];
            break;
        }
      }
    }
  return output;
  };  
};

//  Regex definitions of different types of moves
var MOVE_REGEX = {
  /**
    * Regular expressions to match different types of 
    * algebraic chess notation.
    *
    */
  
  //  There are capturing parentheses around non-capturing parentheses.
  //  I put them in there for simplicity of reading, in my opinion.
  PAWN_MOVE: /(?:^|^\s*)([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PAWN_PROMOTE: /(?:^|^\s*)([a-h])(1|8)\=((?:Q|B|N|R))\+?\#?(?:$|\s*$)/,
  PAWN_CAPTURE: /(?:^|^\s*)([a-h])x([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PAWN_CAPTURE_PROMOTE: /(?:^|^\s*)([a-h])x([a-h])(1|8)\=((?:Q|B|N|R))\+?\#?(?:$|\s*$)/,
  PIECE_MOVE: /(?:^|^\s*)((?:K|Q|B|N|R))([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PIECE_CAPTURE: /(?:^|^\s*)((?:K|Q|B|N|R))x([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PIECE_MOVE_DISAMBIG_FILE: /(?:^|^\s*)((?:K|Q|B|N|R))([a-h])([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PIECE_CAPTURE_DISAMBIG_FILE: /(?:^|^\s*)((?:K|Q|B|N|R))([a-h])x([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PIECE_MOVE_DISAMBIG_RANK: /(?:^|^\s*)((?:K|Q|B|N|R))([1-8])([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  PIECE_CAPTURE_DISAMBIG_RANK: /(?:^|^\s*)((?:K|Q|B|N|R))([1-8])x([a-h])([1-8])\+?\#?(?:$|\s*$)/,
  CASTLE_KING: /(?:^|^\s*)(?:O|0)\-(?:O|0)\+?\#?(?:$|\s*$)/,
  CASTLE_QUEEN: /(?:^|^\s*)(?:O|0)\-(?:O|0)\-(?:O|0)\+?\#?(?:$|\s*$)/
};



/** 
  * MOVE
  * 
  * Text moves are parsed into Moves.
  *
  * Different types of moves will be handled by
  * MOVE_TYPE lookup.
  * 
  */

var MOVE_TYPE = ['Move', 'CastleKing', 'CastleQueen', 'INVALID'];
//  Augments the regular lookup with inverse
var INVERSE_MOVE = {
  'Move': 0,
  'CastleKing': 1,
  'CastleQueen': 2,
  'INVALID': 3
};
_.extend(MOVE_TYPE, INVERSE_MOVE);

var Move = function Move(moveType, chessPiece, coordinates_old, coordinates_new, captureFlag, capturePiece, promoteFlag, promoteType){
  this.moveType = MOVE_TYPE[moveType];
  this.chessPiece = chessPiece;
  this.coordinates_old = coordinates_old;
  this.coordinates_new = coordinates_new;
  this.captureFlag = captureFlag;
  this.capturePiece = capturePiece;
  this.promoteFlag = promoteFlag;
  this.promoteType = PIECE_TYPE[promoteType];

  this.clone = function clone(){
    //  Leave chessPiece and capturePiece as pointers,
    //  'deep'-clone the coordinates
    return new Move(MOVE_TYPE[this.moveType], this.chessPiece, _.clone(this.coordinates_old), _.clone(this.coordinates_new), this.captureFlag, this.capturePiece, this.promoteFlag, this.promoteType);
  };
};

module.exports.Game = Game;

//  Short testing suite
if(TESTING){
	var argument;
	var g = new Game();
	g.run();
	g.interface.on("update", function(arr){
		console.log(arr[1]);
	});
	g.interface.on("invalid", function(err){
		console.log("Invalid! " + err);
	});
	process.stdin.resume();
	process.stdin.on("data", function(data){
		argument = data.slice(0, data.length - 1).toString().split(" ");
		if(argument[0] === "moves"){
			console.log(Object.keys(g.validMoves));
		}
		else if(argument[0] === "movesv"){
			console.log(g.validMoves);
		}
		else if(argument[0] === "getPiece"){
			console.log(g.chessBoard.getPiece({file: parseInt(argument[1]), rank: parseInt(argument[2])}));
		}
		else{
			g.interface.emit("move", data.slice(0, data.length - 1).toString());
			g.displayState();
		}
	});
}
