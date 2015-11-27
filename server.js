var express = require("express");
var app = express();
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var bodyParser = require('body-parser');
var queryString;
var connection;


app.listen(3000);
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

mysql.createConnection({
    host: 'db4free.net',
    user: 'zaddler01',
    password: '123456',
    database: 'pokemondb'
    //host: '127.0.0.1',
    //user: 'root',
    //password: '',
    //database: 'pokemondb'
}).then(function(success){
    console.log("Conectado");
    connection = success;
}).catch(function(error){
    console.log(error);
});

app.use(express.static(__dirname + '/'));



app.post('/signup', function (req, res) {
    queryString = "SELECT user_1 FROM usuarios WHERE user_1 = '" + req.body.user_1 + "';";
    connection.query(queryString)
    .then(function(success){
        success.length > 0 ? res.send("Duplicate") : end();
    });
    function end(){
        queryString = "INSERT INTO usuarios(user_1,pass) VALUES('"+req.body.user_1+"', '"+req.body.password+"');";
        connection.query(queryString)
        .then(function(){
            res.send("DONE")
        }).catch(function(error){
            console.log(error)
        });
    }

});
app.get('/login', function (req, res) {
    queryString = "SELECT " +
        "user_1, " +
        "id_tam " +
        "FROM usuarios " +
        "WHERE user_1 = '"+req.query.user_1+"' " +
        "AND pass = '"+req.query.password+"';";
    connection.query(queryString)
    .then(function(success){
        success.length > 0 ? res.send(success[0]) : res.send("Error");
    }).catch(function(error){
        console.log(error);
    });
});

app.get('/tameds', function (req, res) {
    queryString = "SELECT id_tam FROM tamed";
    Promise.map(connection.query(queryString), function(tamed){
        return Promise.all([
            connection.query("SELECT " +
                "habilidades.id_hab, " +
                "habilidades.nombre_hab, " +
                "habilidades.descripcion_hab, " +
                "habilidades.fuego, " +
                "habilidades.agua, " +
                "habilidades.planta, " +
                "habilidades.volador " +
                "FROM tamed INNER JOIN tamed_hab " +
                    "ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades " +
                    "ON(habilidades.id_hab = tamed_hab.id_hab) " +
                "WHERE tamed.id_tam = "+tamed.id_tam+";")
            .then(function(abilities){
                tamed.habilidades = abilities;
            })
        ]).then(function(){
            return tamed;
        });

    }).then(function(success){
        res.send(success);
    }).catch(function(error){
        console.log(error);
    });
});

app.post('/createTamed', function (req, res) {
    queryString = "UPDATE " +
        "usuarios SET id_tam = "+req.body.id_tam+", " +
        "potenciador = "+req.body.potenciador+" " +
        "WHERE user_1 = '"+req.body.username+"';";
    connection.query(queryString)
    .then(function(success){    // <-- Este succes se puede borrar, te lo dejo a vos
        res.send("Success");
    }).catch(function(error){
        console.log(error);
    })
});

app.get('/myTamed', function (req, res) {
    queryString = "SELECT " +
        "usuarios.nivel, " +
        "usuarios.exp, " +
        "usuarios.potenciador, " +
        "tamed.vida, " +
        "tamed.ataque, " +
        "tamed.defensa, " +
        "tamed.precision, " +
        "tamed.id_tam, " +
        "tamed.name_tam, " +
        "tamed.elemento_tam, " +
        "tamed.debilidad_tam " +
        "FROM tamed INNER JOIN usuarios " +
            "ON(usuarios.id_tam = tamed.id_tam) " +
        "WHERE user_1 = '"+req.query.user_1+"';";
    connection.query(queryString)
    .then(function(success){
        var myTamed = {
            name_tam : success[0].name_tam,
            ataque: success[0].ataque,
            defensa: success[0].defensa,
            exp: success[0].exp,
            potenciador: success[0].potenciador,
            nivel: success[0].nivel,
            precision: success[0].precision,
            id_tam: success[0].id_tam,
            vida: success[0].vida,
            debilidad_tam: success[0].debilidad_tam,
            elemento_tam: success[0].elemento_tam,
            habilidades : []
        };
        queryString = "SELECT " +
            "habilidades.id_hab, " +
            "habilidades.nombre_hab, " +
            "habilidades.descripcion_hab, " +
            "habilidades.fuego, " +
            "habilidades.agua, " +
            "habilidades.planta, " +
            "habilidades.volador " +
            "FROM tamed INNER JOIN tamed_hab " +
                "ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades " +
                "ON(habilidades.id_hab = tamed_hab.id_hab) " +
            "WHERE tamed.id_tam = "+success[0].id_tam+";";
        connection.query(queryString)
        .then(function(abilities){
            myTamed.habilidades = abilities;
            res.send(myTamed);
        });

    }).catch(function(error){
        console.log(error);
    });
});