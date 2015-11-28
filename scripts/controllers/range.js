/**
 * Created by Orlando Bohorquez on 27/11/2015.
 */


Math.prototype.range = function( a, b ) {
    var Obj = function( number ) {
        this.number = number;
        var toString = this.number.toString().split(".");

        this.integer = parseInt( toString[0] );
        this.decimal = toString[1] ? parseInt( toString[1] ) : null;
    };

    var max;
    var min;

    if( a > b ) {
        max = new Obj( a );
        min = new Obj( b );
    }
    else if( b > a ) {
        max = new Obj( b );
        min = new Obj( a );
    }

    var len = max.toString().replace(".", "").length;

    var zeros = 1;
    for( var i = 0; i < len ) {

    }
};