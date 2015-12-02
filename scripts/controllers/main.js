var app = angular.module('elementif', [
 	'ui.materialize',
    'ngStorage',
    'ngRoute',
    'ui.router'
]);

Math.range = function( a, b ) {
	var max = a ;
	var min = b;
	if( b > a ) {
		max = b;
		min = a;
	}
	return Math.floor(Math.random() * (max - min + 1)) + min;
};



app.config(['$routeProvider', '$httpProvider', '$stateProvider', '$urlRouterProvider', function ($routeProvider, $httpProvider, $stateProvider, $urlRouterProvider) {    
            $urlRouterProvider.otherwise("/home");
            $stateProvider
                .state("home", {
                    url: "/home",
                    templateUrl: "pages/home.html"
                })
                .state("battle", {
                    url: "/battle",
                    templateUrl: "pages/battle.html",
					controller: "battleController"
                })
                .state("myProfile", {
                    url: "/myProfile",
                    templateUrl: "pages/myProfile.html",
               		controller: 'myProfileController'
                });

    }
]);
app.controller('sesionController', ['$scope', 'Querys','Data','$location',
	function ($scope, Querys, Data, $location) {

	$scope.signup = function(){
		var formData = {
			user_1: $scope.username,
			password: $scope.password
		};
		Querys.signup(formData)
		.then(function(success){
			if(success.data == "DONE"){
				Data.setUser(formData);
				$scope.myUser = formData;
				closeModal();
				$location.path('/myProfile');
			}

			else{
				$scope.stateLogin = "Error Autenticando"
			}
		}).catch(function(error){
			console.log(error);
		});
	};

	$scope.login = function(){
		var formData = {
			user_1: $scope.username,
			password: $scope.password
		};
		Querys.login(formData)
		.then(function(success){
			if(success.data != "Error"){
				Data.setUser(success.data);
				$scope.myUser = success.data;
				$location.path('/myProfile');
				closeModal();
			}
			else{
				$scope.stateLogin = "Error Autenticando";
			}
		}).catch(function(error){
			console.log(error);
		});
	};

	$scope.logout = function(){
		$scope.myUser = false;
		Data.setTamed(false);
		Data.setUser(false);
		$location.path('/home');
	}
}]);
app.controller('myProfileController', ['$scope', 'Querys','Data','$location',
	function ($scope, Querys, Data, $location) {
	$scope.loading = true;
	$scope.configuring = false;
	$scope.myTamed  = Data.getTamed() || false;
	$scope.myUser = Data.getUser() || false;
	Querys.tameds()
	.then(function(success){
		$scope.tameds = success.data;
		Data.setTameds(success.data);
	}).catch(function(error){
		console.log(error);
	});

	if(!$scope.myTamed && $scope.myUser.id_tam){
		Querys.myTamed()
		.then(function(success){
			$scope.myTamed = potenciar(success.data);
			$scope.loading = false;
			Data.setTamed($scope.myTamed);
		}).catch(function(error){
			console.log(error);
		})

	}
	else{
		$scope.loading = false;
	}
	if(!$scope.myUser){
		$location.path('/home');
	}
	$scope.selectTamed = function(tamed){
		$scope.configuring = true;
		var formData = {
			id_tam: tamed.id_tam,
			username: Data.getUser().user_1,
			potenciador: Math.range(80,120)/100		// Set potenciador in range [0.80 1.20]
		};
		console.log(formData);
		Querys.createTamed(formData)
		.then(function(success){
			$scope.configuring = false;
			tamed = potenciar(tamed);
			Data.setTamed(tamed);
			$scope.myTamed = tamed;
		}).catch(function(error){
			console.log(error);
		})
	}
}]);

app.controller('battleController', ['$scope', 'Querys','Data','$location', function ($scope, Querys, Data, $location) {
	$scope.tameds = Data.getTameds() || false;
	$scope.myTamed  = Data.getTamed() || false;
	if($scope.tameds) {
		var tamed = $scope.tameds[parseInt((Math.random() * 10) % 4)]; 		// Set random Tamed;
		$scope.IA = generateRandomIA( tamed, $scope.myTamed );
	}
	if(!$scope.myTamed){
		$location.path('/home');
	}
	else {
		var datos = {
			user_1: $scope.myTamed.user_1,		// Hay que asignar el usuario
			tamed_ia: $scope.IA.id_tam,
			turnos: []
		};

		var turno = 1;

		// Porcentaje de vida actual, se comienza con el 100% de la vida
		$scope.myTamed.vidaActual = 100;
		$scope.IA.vidaActual = 100;

		$scope.myTamed.vidaTotal = $scope.myTamed.vida;
		$scope.IA.vidaTotal = $scope.IA.vida;

		$scope.ataque = function( habilidad ) {
			if( turno == 1 ) {
				console.log("----------------------------------");
				console.log("Usuario: ");
				turno++;
				datos.turnos.push( habilidad.id_hab );
				console.log("Datos: ");
				console.log(datos);

				var elemento = $scope.IA.elemento_tam;
				switch( elemento ) {
					case "F":
						elemento = "fuego";
						break;
					case "A":
						elemento = "agua";
						break;
					case "V":
						elemento = "volador";
						break;
					case "P":
						elemento = "planta";
						break;
				}

				console.log("Elemento de la IA: " + elemento);

				switch ( habilidad.clasificacion_hab ) {
					case "Ofensivo":
						console.log("Su vida era: " + $scope.IA.vida);
						console.log("Ataque con: " + parseInt( habilidad[ elemento ] * $scope.myTamed.ataque ));
						$scope.IA.vida -= parseInt( habilidad[ elemento ] * $scope.myTamed.ataque );	// Codigo del ataque
						console.log("Y ahora es: " + $scope.IA.vida);

						turno = evaluarVidas( turno, $scope.myTamed.vida, $scope.IA.vida );
						console.log("El turno es ahora: " + turno);

						// Fin del turno
						console.log("El porcentaje de vida de la IA era: " + $scope.IA.vidaActual);
						$scope.IA.vidaActual = porcentajeVida( $scope.IA.vida, $scope.IA.vidaTotal );
						console.log("El porcentaje de vida de la IA es: " + $scope.IA.vidaActual);
						break;

					case "Buff":
						console.log("IA: buff");
						break;

					case "Desgaste":
						console.log("IA: desgaste");
						break;

					case "Debuff":
						console.log("IA: debuff");
						break;
				}

				if( turno == 2 )
					setTimeout( function() {
						console.log("----------------------------------");
						console.log("IA: ");
						var iaHabilidad = $scope.IA.habilidades[ Math.range( 0, 3 ) ]; // Select Random hab
						turno--;

						console.log("Habilidad de la IA");
						console.log( iaHabilidad );

						var elemento = $scope.IA.elemento_tam;
						switch( elemento ) {
							case "F":
								elemento = "fuego";
								break;
							case "A":
								elemento = "agua";
								break;
							case "V":
								elemento = "volador";
								break;
							case "P":
								elemento = "planta";
								break;
						}

						console.log("Elemento del usuario: " + elemento);

						switch ( iaHabilidad.clasificacion_hab ) {
							case "Ofensivo":
								console.log("Su vida era: " + $scope.myTamed.vida);
								console.log("Ataque con: " + parseInt( habilidad[ elemento ] * $scope.IA.ataque ));
								$scope.myTamed.vida -=  parseInt( habilidad[ elemento ] * $scope.IA.ataque );	// Codigo del ataque
								console.log("Y ahora es: " + $scope.myTamed.vida);

								turno = evaluarVidas( turno, $scope.myTamed.vida, $scope.IA.vida );
								console.log("El turno es ahora: " + turno);

								// Fin del turno
								console.log("El porcentaje de vida del usuario era: " + $scope.myTamed.vidaActual);
								$scope.myTamed.vidaActual = porcentajeVida( $scope.myTamed.vida, $scope.myTamed.vidaTotal );
								console.log("El porcentaje de vida del usuario es: " + $scope.myTamed.vida);
								break;

							case "Buff":
								console.log("IA: buff");
								break;

							case "Desgaste":
								console.log("IA: desgaste");
								break;

							case "Debuff":
								console.log("IA: debuff");
								break;
						}


						$scope.$apply();
					}, 1000);
			}
		};

		var evaluarVidas = function( turno, usuarioVida, iaVida ) {
			if( usuarioVida <= 0 )
				return 3;
			else if( iaVida <= 0 )
				return 4;
			else
				return turno;
		};
	}

}]);

var generateRandomIA = function(tamed, user ) {
	tamed.nivel = Math.range(user.nivel-2, user.nivel+2);
	tamed.nivel = tamed.nivel<=0 ? 1 : tamed.nivel;

	tamed.potenciador = Math.range(80,120)/100;		// Set potenciador in range [0.80 1.20];
	tamed = potenciar(tamed);
	return tamed;
};

var potenciar = function(tamed){
	tamed.vida = parseInt( tamed.vida * tamed.potenciador + ( tamed.nivel * 20 ) );
	tamed.ataque = parseInt( tamed.ataque * tamed.potenciador + ( tamed.nivel * 20 ) );
	tamed.defensa = parseInt( tamed.defensa * tamed.potenciador + ( tamed.nivel * 20 ) );
	return tamed;
};

var porcentajeVida = function( vida, vidaTotal ) {
	var porcentaje = parseInt( (vida * 100) / vidaTotal );
	if( porcentaje >= 0 )
		return porcentaje;
	else
		return 0;
};













