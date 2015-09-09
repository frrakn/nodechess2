var initialFEN;
var FENFormat;
var setFEN;
var setFENRow;
var getFEN;
var pieceLookup;

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

setFEN = function setFEN(fen){
    var rows;
    var leftover;
    var letter;
    $(".piece").addClass("toSet");
    rows = fen.split("/");
    console.assert(rows.length === 8, "WARNING: Improper FEN with " + rows.length + " rows detected!")
    _.each(rows, setFENRow);
    leftover = $(".toSet").length;
    console.assert(leftover === 0, "WARNING: " + leftover + " pieces have not been set!");
    $(".toSet").removeClass("toSet");
};

setFENRow = function setFENRow(fenRow, rowNum, rows){
    var numchars;
    var currentPiece;

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
        else if(e >= 'b' && e <= 'r'){
            letter = String.fromCharCode("a".charCodeAt(0) + numchars);
            numchars++;
            currentPiece = $(".toSet").filter(".b" + e.toUpperCase()).first();
            $("#" + letter + rowNum).append(currentPiece);
            currentPiece.removeClass("toSet");
        }
        else{
            letter = String.fromCharCode("a".charCodeAt(0) + numchars);
            numchars++;
            currentPiece = $(".toSet").filter(".w" + e.toUpperCase()).first();
            $("#" + letter + rowNum).append(currentPiece);
            currentPiece.removeClass("toSet");
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
    rows = [1, 2, 3, 4, 5, 6, 7, 8];
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

    return agg;
};

$("document").ready(function(){
    $(".piece").draggable({
        drag: function (ev, ui) {
            $(ui.draggable).css("position", "relative");
        },
        revert: true,
        revertDuration: 10
    });

    $(".boardsquare").droppable({
        accept: ".piece",
        drop: function (ev, ui) {
            $(ui.draggable).css("position", "auto");
            $(ui.draggable).css("left", "auto");
            $(ui.draggable).css("top", "auto");
            $(this).children(".white").appendTo(".wplayer");
            $(this).children(".black").appendTo(".bplayer");
            $(this).append($(ui.draggable));
        }
    });

		var name = prompt("Please enter alias:");

		var socket = io.connect();
		socket.emit("chess_join", name);
		socket.emit("chat_join", name);
		ocket.on("assign", function(data){
			alert("You are " + data);
		});	

    //TESTING CODE
    setFEN(initialFEN);
});
