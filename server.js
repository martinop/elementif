var express = require("express");
var app = express();
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var bodyParser = require('body-parser');
var connection;
var queryString;
var values;


app.listen(12359);
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

//connection.query('UPDATE foo SET key = ?', ['value']);


app.post('/signup', function (req, res) {
    queryString = "\
        SELECT user_1 \
        FROM usuarios \
        WHERE user_1 = ?;\
    ";
    values = [
        req.body.user_1
    ];
    connection.query(queryString, values )
    .then(function(success){
        success.length > 0 ? res.send("Duplicate") : end();
    });
    function end(){
        queryString = "\
            INSERT INTO usuarios(user_1,pass) \
            VALUES( ?, ? ); \
        ";
        values = [
            req.body.user_1,
            req.body.password
        ];
        connection.query(queryString, values)
        .then(function(){
            res.send("DONE")
        }).catch(function(error){
            console.log(error)
        });
    }

});
app.get('/login', function (req, res) {
    queryString = "\
        SELECT user_1, id_tam \
        FROM usuarios \
        WHERE user_1 = ? AND pass = ?;\
    ";
    values = [
        req.query.user_1,
        req.query.password
    ];
    connection.query(queryString, values)
    .then(function(success){
        success.length > 0 ? res.send(success[0]) : res.send("Error");
    }).catch(function(error){
        console.log(error);
    });
});

app.get('/tameds', function (req, res) {
    queryString = "\
        SELECT \
            tamed.id_tam, \
            name_tam, \
            elemento_tam, \
            debilidad_tam, \
            vida, \
            ataque, \
            defensa, \
            tamed.precision \
        FROM tamed \
    ";
    Promise.map(connection.query(queryString), function(tamed){
        queryString = "\
            SELECT \
                habilidades.id_hab, \
                habilidades.nombre_hab, \
                habilidades.descripcion_hab, \
                habilidades.fuego, \
                habilidades.planta, \
                habilidades.agua, \
                habilidades.viento, \
                habilidades.clasificacion_hab \
            FROM tamed INNER JOIN tamed_hab \
                ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades \
                ON(habilidades.id_hab = tamed_hab.id_hab) \
            WHERE tamed.id_tam = ? \
        ";
        values = [
            tamed.id_tam
        ];
        return Promise.all([
            connection.query(queryString, values)
            .then(function(abilities){
                tamed.habilidades = abilities;
            })
        ]).then(function(){
            return tamed;
        });

    }).then(function(success){
        console.log(success)
        res.send(success);
    }).catch(function(error){
        console.log(error);
    });
});

app.post('/createTamed', function (req, res) {
    queryString = "\
        UPDATE \
            usuarios SET id_tam = ?, \
            nivel = 1, \
            exp = 0, \
            potenciador = ? \
        WHERE user_1 = ?; \
    ";
    values = [
        req.body.id_tam,
        req.body.potenciador,
        req.body.username
    ];
    connection.query(queryString, values)
    .then(function(success){    // <-- Este succes se puede borrar, te lo dejo a vos
        res.send("Success");
    }).catch(function(error){
        console.log(error);
    })
});

app.get('/myTamed', function (req, res) {
    queryString = "\
        SELECT \
            usuarios.nivel, \
            usuarios.exp, \
            usuarios.potenciador, \
            tamed.vida, \
            tamed.ataque, \
            tamed.defensa, \
            tamed.precision, \
            tamed.id_tam, \
            tamed.name_tam, \
            tamed.elemento_tam, \
            tamed.debilidad_tam \
        FROM tamed INNER JOIN usuarios \
            ON(usuarios.id_tam = tamed.id_tam) \
        WHERE user_1 = ?; \
    ";
    values = [
        req.query.user_1
    ];
    connection.query(queryString, values)
        .then(function(success){
            var myTamed = success[0];
            myTamed.habilidades = [];
            queryString = "\
                SELECT \
                    habilidades.id_hab, \
                    habilidades.nombre_hab, \
                    habilidades.descripcion_hab, \
                    habilidades.fuego, \
                    habilidades.agua, \
                    habilidades.planta, \
                    habilidades.viento, \
                    habilidades.clasificacion_hab \
                FROM tamed INNER JOIN tamed_hab \
                    ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades \
                    ON(habilidades.id_hab = tamed_hab.id_hab) \
                WHERE tamed.id_tam = ?; \
            ";
            values = [
                success[0].id_tam
            ];
            connection.query(queryString, values)
                .then(function(abilities){
                    myTamed.habilidades = abilities;
                    res.send(myTamed);
                });

        }).catch(function(error){
        console.log(error);
    });
});