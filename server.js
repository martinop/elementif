var express = require("express");
var app = express();
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var bodyParser = require('body-parser');
var queryString;


app.listen(3000);
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'pokemondb'
}).then(function(success){
    console.log("Conectado");
    conexion = success;
}).catch(function(error){
    console.log(error);
});

app.use(express.static(__dirname + '/'));



app.post('/signup', function (req, res) {
    queryString = 'SELECT * FROM usuarios WHERE user_1 = "'+req.body.user_1+'"';
    conexion.query(queryString)
    .then(function(success){
        success.length > 0 ? res.send("Duplicate") : end();
    });
    function end(){
        queryString = 'INSERT INTO usuarios(user_1,pass) VALUES("'+req.body.user_1+'", "'+req.body.password+'")';
        conexion.query(queryString)
        .then(function(){
            res.send("DONE")
        }).catch(function(error){
            console.log(error)
        });
    }

});

app.get('/login', function (req, res) {
    //var password = jwt.sign(req.body.password, JWT_SECRET);
    queryString = 'SELECT user_1, id_tam FROM usuarios WHERE user_1 = "'+req.query.user_1+'" AND pass = "'+req.query.password+'"';
    conexion.query(queryString)
    .then(function(success){
        success.length > 0 ? res.send(success[0]) : res.send("Error");
    }).catch(function(error){
        console.log(error);
    });
});

app.get('/tameds', function (req, res) {
    queryString = 'SELECT * from tamed';
    Promise.map(conexion.query(queryString), function(tamed){
        return Promise.all([
            conexion.query('SELECT habilidades.id_hab, nombre_hab,descripcion_hab,fuego,agua,planta,volador from tamed INNER JOIN tamed_hab ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades ON(habilidades.id_hab = tamed_hab.id_hab) WHERE tamed.id_tam = '+tamed.id_tam)
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
    queryString = 'UPDATE usuarios SET id_tam = '+req.body.id_tam+', ataque = '+req.body.ataque+', defensa ='+req.body.ataque+', vida = '+req.body.vida+', usuarios.precision = '+req.body.precision+', usuarios.potenciador = '+req.body.potenciador+' WHERE user_1 = "'+req.body.username+'"';
    conexion.query(queryString)
    .then(function(success){
        res.send("Success");
    }).catch(function(error){
        console.log(error);
    })
});

app.get('/myTamed', function (req, res) {
    queryString = 'SELECT usuarios.nivel,usuarios.exp, usuarios.potenciador,usuarios.vida,usuarios.ataque,usuarios.defensa,usuarios.precision, usuarios.id_tam,name_tam,elemento_tam,debilidad_tam from tamed INNER JOIN usuarios ON(usuarios.id_tam = tamed.id_tam) WHERE user_1 = "'+req.query.user_1+'"';
    conexion.query(queryString)
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
        queryString = 'SELECT habilidades.id_hab, nombre_hab,descripcion_hab,fuego,agua,planta,volador from tamed INNER JOIN tamed_hab ON(tamed_hab.id_tam = tamed.id_tam) INNER JOIN habilidades ON(habilidades.id_hab = tamed_hab.id_hab) WHERE tamed.id_tam = '+success[0].id_tam;
        conexion.query(queryString)
        .then(function(abilities){
            myTamed.habilidades = abilities;
            res.send(myTamed);
        });

    }).catch(function(error){
        console.log(error);
    });
});