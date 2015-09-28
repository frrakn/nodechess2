var initialFEN;
var FENFormat;
var setFEN;
var setFENRow;
var getFEN;
var pieceLookup;
var self = this;
var imgLookup;
var currentFEN;
var DEFAULT_IMG_PATH = "./img/";
var IMG_SUFFIX = ".png"

initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
FENFormat = /^(?:[1-8]|n|N|r|R|b|B|p|P|q|Q|k|K)+$/;
pieceLookup = {
    'bK': 'k',
    'bQ': 'q',
    'bR': 'r',
    'bB': 'b',
    'bN': 'n',
    'bP': 'p',
    'wK': 'K',
    'wQ': 'Q',
    'wR': 'R',
    'wB': 'B',
    'wN': 'N',
    'wP': 'P'
};

function piecesDraggable(){
  $(".piece").draggable({
			drag: function (ev, ui) {
			$(ui.draggable).css("position", "relative");
    },
    revert: true,
    revertDuration: 10
  });
}

imgLookup = _.invert(pieceLookup);
function getImg(pieceType){
	return DEFAULT_IMG_PATH + imgLookup[pieceType] + IMG_SUFFIX;
};

setFEN = function setFEN(fen){
    var rows;
    var leftover;
    var letter;
		clearBoard();
    rows = fen.split("/");
    _.each(rows, setFENRow);
		piecesDraggable();
};

clearBoard = function clearBoard(){
	$(".piece").remove();
}

setFENRow = function setFENRow(fenRow, rowNum, rows){
    var numchars;
    var currentPiece;
		var newPiece;

    numchars = 0;
    rowNum = 8 - rowNum;
    console.assert(FENFormat.exec(fenRow) != null, "WARNING: Improper FEN format on row " + rowNum + "!");
    //  Check FEN length
    _.each(fenRow, function(e, index, list){
        if(e >= '1' && e <= '8'){
            numchars += parseInt(e, 10);
        }
        else{
            numchars++;
        }
    });
    console.assert(numchars === 8, "WARNING: Improper FEN row with " + numchars + " columns detected!")

    numchars = 0;
    _.each(fenRow, function(e, index, list){
        if(e >= '1' && e <= '8'){
            numchars += parseInt(e, 10);
        }
        else{
					letter = String.fromCharCode("a".charCodeAt(0) + numchars);
					newPiece = $("<img>");
					newPiece.attr("src", getImg(e));
					newPiece.addClass(imgLookup[e]);
					newPiece.addClass("piece");
					if(e <= 'z'){
						newPiece.addClass("black");
					}
					else{
						newPiece.addClass("white");
					}
          $("#" + letter + rowNum).append(newPiece);
					numchars++;
        }
    });
};

getFEN = function(){
    var letter;
    var rows;
    var agg;
    var replacements;
    var currentElement;

    letter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    rows = [8, 7, 6, 5, 4, 3, 2, 1];
    agg = "";
    replacements = [
        ['8', /11111111/gm],
        ['7', /1111111/gm],
        ['6', /111111/gm],
        ['5', /11111/gm],
        ['4', /1111/gm],
        ['3', /111/gm],
        ['2', /11/gm]
    ];

    _.each(rows, function(e, index, list){
        _.each(letter, function(e2, index2, list2){
            currentElement = $("#" + e2 + e);
            currentElement = currentElement.children(".piece").first();
            if(currentElement.length === 1){
                _.each(pieceLookup, function(e3, index3, list3){
                    if(currentElement.hasClass(index3)){
                        agg += e3;
                    }
                });
            }
            else if(currentElement.length === 0){
                agg += "1";
            }
            else{
                console.assert(true, "Multiple chess pieces detected within square " + e2 + e + "!");
            }
        });
        agg += '/';
    });
    _.each(replacements, function(e, index, list){
        agg = agg.replace(e[1], e[0]);
    });

    return agg.slice(0, agg.length - 1);
};

$("document").ready(function(){
		var name = prompt("Please enter alias:");
		var assignment;
		var turn;
		var newElement;
		var temp;
		var lastMove;
		var totalMoves = 0;

		var socket = io.connect();
		socket.emit("chess_join", name);
		socket.emit("chat_join", name);
		socket.on("assign", function(data){
			alert("You are " + data);
			assignment = data;
		});
		socket.on("fen", function(fen){
			console.log(fen);
			currentFEN = fen;
			setFEN(currentFEN);
		});
		socket.on("turn", function(move){
			turn = move;
		});
		socket.on("pgn", function(move){
			if(!turn && (lastMove !== move)){
				lastMove = move;
				totalMoves += 1;
				newElement = $("<tr>");
				temp = $("<td>");
				temp.addClass("pgncol1");
				newElement.append(temp);
				temp = $("<td>");
				temp.addClass("pgncol2");
				newElement.append(temp);
				temp = $("<td>");
				temp.addClass("pgncol3");
				newElement.append(temp);
				$(".pgntbl tbody").append(newElement);

				$(".pgntbl tbody tr").filter(":last").find(".pgncol1").text(totalMoves);
				$(".pgntbl tbody tr").filter(":last").find(".pgncol2").text(move);
			}
			else if(lastMove !== move){
				lastMove = move;
				$(".pgntbl tbody tr").filter(":last").find(".pgncol3").text(move);
			}
			else{
			}
		});

		piecesDraggable();
    $(".boardsquare").droppable({
        accept: ".piece",
        drop: function (ev, ui) {
            $(ui.draggable).css("position", "auto");
            $(ui.draggable).css("left", "auto");
            $(ui.draggable).css("top", "auto");
						$(this).empty();
            $(this).append($(ui.draggable));
						if(assignment === "white" && turn){
							socket.emit("move", getFEN());
						}
						else if(assignment === "black" && !turn){
							socket.emit("move", getFEN());
						}
						else{
							setFEN(currentFEN);
						}
        }
    });
    //  TESTING CODE
    //  setFEN(initialFEN);
});
