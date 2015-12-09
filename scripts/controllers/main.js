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
		});
	};

	$scope.logout = function(){
		$scope.myUser = false;
		Data.setTamed(false);
		Data.setUser(false);
		$location.path('/home');
	}
}]);

app.controller('battleController', ['$scope', 'Querys','Data','$location', function ($scope, Querys, Data, $location) {
	"use strict";
	$scope.estado = "In game";
	$scope.turno = 1;
	$scope.tameds = Data.getTameds() || false;
	$scope.myTamed  = Data.getTamed() || false;
	if($scope.tameds) {
		var tamed = $scope.tameds[Math.range(0, $scope.tameds.length - 1 )]; 		// Set random Tamed;
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

		var popularHab = [ null, null, null, null];	// Habilidades mas usadas por el usuario

		// Porcentaje de vida actual, se comienza con el 100% de la vida
		$scope.myTamed.vidaActual = 100;
		$scope.IA.vidaActual = 100;

		$scope.myTamed.vidaTotal = $scope.myTamed.vida;
		$scope.IA.vidaTotal = $scope.IA.vida;

		var habDuration = 4;

        Materialize.toast("TE DESTRUIRE!", 2000, "toast-ia");

		$scope.ataque = function( habilidad ) {
			if( $scope.turno == 1 ) {
				$scope.turno++;
				datos.turnos.push( habilidad.id_hab );

				let elemento = $scope.myTamed.elemento_tam;

				switch ( habilidad.clasificacion_hab ) {
					case "Ofensivo":

						let damage = calculateDmg( $scope.myTamed.ataque, $scope.IA.defensa, habilidad[ elemento ] );

                        Materialize.toast(habilidad.nombre_hab + ": " + damage, 2000, "toast-user");

						$scope.IA.vida = hurt( $scope.IA.vida, damage );	// Codigo del ataque


						$scope.turno = evaluarVidas( $scope.turno, $scope.myTamed.vida, $scope.IA.vida );

						// Fin del turno
						$scope.IA.vidaActual = porcentajeVida( $scope.IA.vida, $scope.IA.vidaTotal );
						break;

					case "Buff de ataque":
					case "Buff de defensa":
					case "Debuff de ataque":
					case "Debuff de defensa":
					case "Desgaste":
						if( !habilidad.sleep ) {
							habilidad.sleep = habDuration;
                            Materialize.toast(habilidad.nombre_hab + ": " + habilidad[elemento], 2000, "toast-user");
                        }
						break;

					case "Recuperacion":
						$scope.myTamed.vida = recoverLife( $scope.myTamed.vida, $scope.myTamed.vidaTotal, habilidad[ elemento ] );
						$scope.myTamed.vidaActual = porcentajeVida( $scope.myTamed.vida, $scope.myTamed.vidaTotal );
						break;

				}

				$scope.myTamed = buffHab( $scope.myTamed, habDuration );
				$scope.IA = debuffHab( $scope.IA, elemento,habDuration );

				$scope.turno = evaluarVidas( $scope.turno, $scope.myTamed.vida, $scope.IA.vida );
				$scope.turno == 3 ? $scope.estado = "Perdiste" : $scope.estado;
				$scope.turno == 4 ? $scope.estado = "Ganaste" : $scope.estado;
				if( $scope.turno == 2 ) {
					var iaAtaque = function() {
						//var habilidad = $scope.IA.habilidades[ Math.range( 0, 3 ) ]; // Select Random hab
						let iaHabilidad = ArtificialInteligent( $scope.myTamed, $scope.IA ); // Select hab
						console.log(iaHabilidad);
						$scope.turno--;

						let elemento = $scope.IA.elemento_tam;

						switch ( iaHabilidad.clasificacion_hab ) {
							case "Ofensivo":

								let damage = calculateDmg( $scope.IA.ataque, $scope.myTamed.defensa, iaHabilidad[ elemento ] );

								Materialize.toast(iaHabilidad.nombre_hab + ": " + damage, 2000, "toast-ia");

								$scope.myTamed.vida = hurt( $scope.myTamed.vida, damage );	// Codigo del ataque


								$scope.turno = evaluarVidas( $scope.turno, $scope.myTamed.vida, $scope.IA.vida );

								// Fin del turno
								$scope.myTamed.vidaActual = porcentajeVida( $scope.myTamed.vida, $scope.myTamed.vidaTotal );
								break;

							case "Buff de ataque":
							case "Buff de defensa":
							case "Debuff de ataque":
							case "Debuff de defensa":
							case "Desgaste":
								if( !iaHabilidad.sleep ) {
									iaHabilidad.sleep = habDuration;
									Materialize.toast(iaHabilidad.nombre_hab + ": " + iaHabilidad[elemento], 2000, "toast-ia");
								}
								break;

							case "Recuperacion":
								let life = recoverLife( $scope.IA.vida, $scope.IA.vidaTotal, iaHabilidad[ elemento ] ) ;
								Materialize.toast(iaHabilidad.nombre_hab + ": " + life, 2000, "toast-ia");
								$scope.IA.vida = life;
								$scope.IA.vidaActual = porcentajeVida( $scope.IA.vida, $scope.IA.vidaTotal );
								break;

						}

						$scope.IA = buffHab( $scope.IA, habDuration );
						$scope.myTamed = debuffHab( $scope.myTamed, elemento, habDuration );

						$scope.turno = evaluarVidas( $scope.turno, $scope.myTamed.vida, $scope.IA.vida );
						$scope.turno == 3 ? $scope.estado = "Perdiste" : $scope.estado;
						$scope.turno == 4 ? $scope.estado = "Ganaste" : $scope.estado;
						$scope.$apply();
					};
					setTimeout( iaAtaque, 2000);
				}
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

		var hurt = function( vida, damage ) {
			vida -= damage;
			return vida < 0 ? 0 : vida;
		};

		var recoverLife = function( vida, vidaTotal, add ) {
			vida += add;
			return vida > vidaTotal ? vidaTotal : vida;
		};

		var calculateDmg = function(ataque, defensa, habilidad ) {
			var calculo = ataque + habilidad - defensa;
			return calculo <= 0 ? 1 : calculo;
		};

		var buffHab = function ( tamed, duration ) {
			var element = tamed.elemento_tam;
			for( var i = 0; i < 4; i++ ) {
				var hab = tamed.habilidades[i];
				switch( hab.clasificacion_hab ) {
					case "Buff de ataque":
						if( hab.sleep !== 0 ) {
							if( hab.sleep === duration )
								tamed.ataque += hab[ element ];

							hab.sleep--;

							if( hab.sleep === 0 )
								tamed.ataque -= hab[ element ];
						}
						break;

					case "Buff de defensa":
						if( hab.sleep !== 0 ) {
							if( hab.sleep === duration )
								tamed.defensa += hab[ element ];


							hab.sleep--;

							if( hab.sleep === 0 )
								tamed.defensa -= hab[ element ];
						}
						break;
				}
			}
			return tamed;
		};

		var debuffHab = function( tamed, element, duration ) {
			for( var i = 0; i < 4; i++ ) {
				var hab = tamed.habilidades[i];
				switch( hab.clasificacion_hab ) {
					case "Debuff de ataque":
						if( hab.sleep !== 0 ) {
							if( hab.sleep === duration )
								tamed.ataque -= hab[ element ];

							hab.sleep--;

							if( hab.sleep === 0 )
								tamed.ataque += hab[ element ];
						}
						break;

					case "Debuff de defensa":
						if( hab.sleep !== 0 ) {
							if( hab.sleep === duration )
								tamed.defensa -= hab[ element ];

							hab.sleep--;

							if( hab.sleep === 0 )
								tamed.defensa += hab[ element ];
						}
						break;

					case "Desgaste":
						if( hab.sleep !== 0 ) {
							let damage = calculateDmg( 0, 0, hab[ element ] );

							tamed.vida = hurt( tamed.vida, damage );	// Codigo del ataque
							tamed.vidaActual = porcentajeVida( tamed.vida, tamed.vidaTotal );

							hab.sleep--;
						}
						break;
				}
			}
			return tamed;
		};

		var ArtificialInteligent = function( user, ia ) {
			"use strict";
			var iaPowerfulHab;
			var userPowerfulHab;
			var userElement = user.elemento_tam;
			var iaElement = ia.elemento_tam;

			// Buscamos la habilidad ofensiva mas poderosa de la IA
			if( (iaPowerfulHab = powerfulHab( ia, "Ofensivo" )) ) {
				// Verificamos si se puede matar con un solo golpe de la habilidad
				if( user.vida <= calculateDmg( ia.ataque, user.defensa, iaPowerfulHab[ iaElement ] ) )
					return iaPowerfulHab;
				// Si no muere de un golpe entonces
				else {
					// Obtenemos el ofensiva mas poderosa del user
					if( (userPowerfulHab = powerfulHab( user, "Ofensivo" )) ) {
						// Verificamos si nos puede matar con un solo golpe de la habilidad
						if( ia.vida <= calculateDmg( user.ataque, ia.defensa, userPowerfulHab ) ) {
							// Buscamos la habilidad regenerativa mas poderosa de la IA
							if( (iaPowerfulHab = powerfulHab( ia, "Recuperacion" )) ) {
								// Verificamos si nos puede matar con un solo golpe de la habilidad igualmente
								if( ia.vida + iaPowerfulHab[iaElement] <= calculateDmg( user.ataque, ia.defensa, userPowerfulHab ) ) {
									return iaPowerfulHab; // Nos hechamos vida igualmente
								}
								// Si no entonces usamos la habilidad
								else
									return iaPowerfulHab;
							}
							// Si no tenemos hab regenerativas entonces
							else {
								// Buscamos los buffs defensivos de la IA
								let buffDefensa = powerfulHab( ia, "Buff de defensa" );
								let anotherBuffDefensa = powerfulHab( ia, "Buff de defensa", buffDefensa );

								// Buscamos los debuffs de ataque de la IA
								let debuffAtaque = powerfulHab( ia, "Debuff de ataque" );
								let anotherDebuffAtaque = powerfulHab( ia, "Debuff de ataque", debuffAtaque );

								let existPowerBuff = (buffDefensa && !buffDefensa.sleep);
								let existAnotherBuff = (anotherBuffDefensa && !anotherBuffDefensa.sleep);

								let existPowerDebuff = (debuffAtaque && !debuffAtaque.sleep);
								let existAnotherDebuff = (anotherDebuffAtaque && !anotherDebuffAtaque.sleep);

								// Si existe algun buff defensivo y algun debuff de ataque utilizable
								if( (existPowerBuff || existAnotherBuff) && (existPowerDebuff || existAnotherDebuff) ) {
									let buff = existPowerBuff ? buffDefensa : anotherBuffDefensa;
									let debuff = existPowerBuff ? buffDefensa : anotherBuffDefensa;

									// Si el buff protege mas entonces lo usamos
									if( buff[ iaElement ] > debuff[ iaElement ] )
										return buff;
									// Si no usamos el debuff
									else
										return debuff;
								}
								// Si existe un buff de defensa que no este durmiendo o si existe otro buff
								// de defensa que no este durmiendo
								else if( existPowerBuff || existAnotherBuff) {
									if( existPowerBuff ) {
										return buffDefensa;
									}
									else
										return anotherBuffDefensa;
								}
								// Si existe un debuff de ataque que no este durmiendo o si existe otro debuff
								// de ataque que no este durmiendo
								else if( existPowerDebuff || existAnotherDebuff ) {
									if( existPowerDebuff ) {
										return debuffAtaque;
									}
									else
										return anotherDebuffAtaque;
								}
								// Si no existe un buff o debuff que se pueda utilizar entonces
								else {
								}
							}
						}
						// Si no morimos de un golpe entonces
						else {
							// Verificamos quien hace mas daño
							userPowerfulHab = powerfulHab( user, "Ofensivo" );
							iaPowerfulHab = powerfulHab( ia, "Ofensivo" );
							// Si nosotros hacemos mas daño y tenemos mas vida
							if( calculateDmg( ia.ataque, user.defensa, iaPowerfulHab[ iaElement ] ) >= calculateDmg( user.ataque, ia.defensa, iaPowerfulHab[ userElement ] ) &&
							ia.vida >= user.vida ) {
								// Buscamos buff de ataque
								let buffAtaque = powerfulHab( ia, "Buff de ataque" );
								let anotherBuffAtaque = powerfulHab( ia, "Buff de ataque", buffAtaque );

								// Buscamos los debuffs de defensa de la IA
								let debuffDefensa = powerfulHab( ia, "Debuff de defensa" );
								let anotherDebuffDefensa = powerfulHab( ia, "Debuff de defensa", debuffDefensa );

								let existPowerBuff = (buffAtaque && !buffAtaque.sleep);
								let existAnotherBuff = (anotherBuffAtaque && !anotherBuffAtaque.sleep);

								let existPowerDebuff = (debuffDefensa && !debuffDefensa.sleep);
								let existAnotherDebuff = (anotherDebuffDefensa && !anotherDebuffDefensa.sleep);

								// Si existe algun buff de ataque y algun debuff de defensa utilizable
								if( (existPowerBuff || existAnotherBuff) && (existPowerDebuff || existAnotherDebuff) ) {
									let buff = existPowerBuff ? buffAtaque : anotherBuffAtaque;
									let debuff = existPowerBuff ? buffAtaque : anotherBuffAtaque;

									// Si el buff protege mas entonces lo usamos
									if( buff[ iaElement ] > debuff[ iaElement ] )
										return buff;
									// Si no usamos el debuff
									else
										return debuff;
								}
								// Si existe un buff de defensa que no este durmiendo o si existe otro buff
								// de defensa que no este durmiendo
								else if( existPowerBuff || existAnotherBuff) {
									if( existPowerBuff ) {
										return buffAtaque;
									}
									else
										return anotherBuffAtaque;
								}
								// Si existe un debuff de ataque que no este durmiendo o si existe otro debuff
								// de ataque que no este durmiendo
								else if( existPowerDebuff || existAnotherDebuff ) {
									if( existPowerDebuff ) {
										return debuffDefensa;
									}
									else
										return anotherDebuffDefensa;
								}
								// Si no existe un buff o debuff que se pueda utilizar entonces
								else {
									// Buscamos la habs de desgaste
									let powerfulDesgaste = powerfulHab( ia, "Desgaste" );
									let anotherDesgaste = powerfulHab( ia, "Desgaste", powerfulDesgaste );

									let existPowerfulDesgaste = (powerfulDesgaste && !powerfulDesgaste.sleep);
									let existAnotherDesgaste = (anotherDesgaste && !anotherDesgaste.sleep);

									// Si existe alguna hab de desgaste que podamos usar, la utilizamos
									if( existPowerfulDesgaste || existAnotherDesgaste ) {
										if( existPowerfulDesgaste )
											return powerfulDesgaste;
										else
											return anotherDesgaste;
									}
									// Si no existe ninguna hab de desgaste utilizable
									else {

										// Buscamos y utilizamos nuestro ataque mas fuerte
										return powerfulHab( ia, "Ofensivo" );
									}
								}
							}
							// Si el hace mas daño o tiene mas vida
							else {
								// Si tenemos menos de 50, y tenemos 20 o mas % de vida menos que el usuario
								if( ((ia.vidaActual <= 50) && user.vidaActual - ia.vidaActual >= 20) &&
								( iaPowerfulHab = powerfulHab( ia, "Recuperacion" ) ) ) {
									return iaPowerfulHab;
								}
								// Si no
								else {
									// Buscamos los buffs defensivos de la IA
									let buffDefensa = powerfulHab( ia, "Buff de defensa" );
									let anotherBuffDefensa = powerfulHab( ia, "Buff de defensa", buffDefensa );

									// Buscamos los debuffs de ataque de la IA
									let debuffAtaque = powerfulHab( ia, "Debuff de ataque" );
									let anotherDebuffAtaque = powerfulHab( ia, "Debuff de ataque", debuffAtaque );

									let existPowerBuff = (buffDefensa && !buffDefensa.sleep);
									let existAnotherBuff = (anotherBuffDefensa && !anotherBuffDefensa.sleep);

									let existPowerDebuff = (debuffAtaque && !debuffAtaque.sleep);
									let existAnotherDebuff = (anotherDebuffAtaque && !anotherDebuffAtaque.sleep);

									if( (existPowerBuff || existAnotherBuff) && (existPowerDebuff || existAnotherDebuff) ) {
										let buff = existPowerBuff ? buffDefensa : anotherBuffDefensa;
										let debuff = existPowerBuff ? buffDefensa : anotherBuffDefensa;

										// Si el buff protege mas entonces lo usamos
										if( buff[ iaElement ] > debuff[ iaElement ] )
											return buff;
										// Si no usamos el debuff
										else
											return debuff;
									}
									// Si existe un buff de defensa que no este durmiendo o si existe otro buff
									// de defensa que no este durmiendo
									else if( existPowerBuff || existAnotherBuff) {
										if( existPowerBuff ) {
											return buffDefensa;
										}
										else
											return anotherBuffDefensa;
									}
									// Si existe un debuff de ataque que no este durmiendo o si existe otro debuff
									// de ataque que no este durmiendo
									else if( existPowerDebuff || existAnotherDebuff ) {
										if( existPowerDebuff ) {
											return debuffAtaque;
										}
										else
											return anotherDebuffAtaque;
									}
									// Si no existe un buff o debuff que se pueda utilizar entonces
									else {
										// Buscamos la habilidad regenerativa mas poderosa de la IA
										return powerfulHab( ia, "Ofensivo" );
									}
								}
							}

						}
					}
					// Si el user no tiene hab ofensiva
					else {
						// Buscamos los buff de ataque que tengamos
						let buffAtaque = powerfulHab( ia, "Buff de ataque" );
						let anotherBuffAtaque = powerfulHab( ia, "Buff de ataque", buffAtaque );

						let existPowerBuff = (buffAtaque && !buffAtaque.sleep);
						let existAnotherBuff = (anotherBuffAtaque && !anotherBuffAtaque.sleep);

						// Si existe un buff de ataque que no este durmiendo o si existe otro buff
						// de ataque que no este durmiendo
						if( existPowerBuff ) {
							return buffAtaque;
						}
						else if( existAnotherBuff )
							return anotherBuffAtaque;
						else {
							return powerfulHab( user, "Ofensivo" );
						}
					}
				}
			}
			// Si no tenemos habilidad ofensiva
			else {
				// Buscamos la habs de desgaste
				let powerfulDesgaste = powerfulHab( ia, "Desgaste" );
				let anotherDesgaste = powerfulHab( ia, "Desgaste", powerfulDesgaste );

				let existPowerfulDesgaste = (powerfulDesgaste && !powerfulDesgaste.sleep);
				let existAnotherDesgaste = (anotherDesgaste && !anotherDesgaste.sleep);

				// Si existe alguna hab de desgaste que podamos usar, la utilizamos
				if( existPowerfulDesgaste || existAnotherDesgaste ) {
					if( existPowerfulDesgaste )
						return powerfulDesgaste;
					else
						return anotherDesgaste;
				}
				// Si no existe ninguna hab de desgaste utilizable
				else {
					// Buscamos los buffs defensivos de la IA
					let buffDefensa = powerfulHab( ia, "Buff de defensa" );
					let anotherBuffDefensa = powerfulHab( ia, "Buff de defensa", buffDefensa );

					// Buscamos los debuffs de ataque de la IA
					let debuffAtaque = powerfulHab( ia, "Debuff de ataque" );
					let anotherDebuffAtaque = powerfulHab( ia, "Debuff de ataque", debuffAtaque );

					let existPowerBuff = (buffDefensa && !buffDefensa.sleep);
					let existAnotherBuff = (anotherBuffDefensa && !anotherBuffDefensa.sleep);

					let existPowerDebuff = (debuffAtaque && !debuffAtaque.sleep);
					let existAnotherDebuff = (anotherDebuffAtaque && !anotherDebuffAtaque.sleep);

					if( (existPowerBuff || existAnotherBuff) && (existPowerDebuff || existAnotherDebuff) ) {
						let buff = existPowerBuff ? buffDefensa : anotherBuffDefensa;
						let debuff = existPowerBuff ? buffDefensa : anotherBuffDefensa;

						// Si el buff protege mas entonces lo usamos
						if( buff[ iaElement ] > debuff[ iaElement ] )
							return buff;
						// Si no usamos el debuff
						else
							return debuff;
					}
					// Si existe un buff de defensa que no este durmiendo o si existe otro buff
					// de defensa que no este durmiendo
					else if( existPowerBuff || existAnotherBuff) {
						if( existPowerBuff ) {
							return buffDefensa;
						}
						else
							return anotherBuffDefensa;
					}
					// Si existe un debuff de ataque que no este durmiendo o si existe otro debuff
					// de ataque que no este durmiendo
					else if( existPowerDebuff || existAnotherDebuff ) {
						if( existPowerDebuff ) {
							return debuffAtaque;
						}
						else
							return anotherDebuffAtaque;
					}
					// Si no existe un buff o debuff que se pueda utilizar entonces
					else {
						// Buscamos la habilidad regenerativa mas poderosa de la IA
						if( (iaPowerfulHab = powerfulHab( ia, "Recuperacion" )) ) {
							return iaPowerfulHab;
						}
						// Si no tenemos hab regenerativas entonces
						else {
							// Si existe algun buff defensivo y algun debuff de ataque utilizable
						}
					}
				}
			}

		};

		var powerfulHab = function( tamed, tipo, notHab ) {
			var hab = tamed.habilidades[0];  	// Asignamos por defecto la primera hab
			var element = tamed.elemento_tam;	// Obtenemos el elemento del tamed
			// Iteramos para conseguir la hab mas fuerte
			for( var i = 1; i < 4; i++ ) {
				var newHab = tamed.habilidades[i];
				if( hab.clasificacion_hab === tipo ) {
					if( (newHab.clasificacion_hab === tipo) && newHab[ element ] > hab[ element ] && newHab != notHab )
						hab = newHab;
				}
				else
					hab = newHab;
			}

			if( hab.clasificacion_hab == tipo && hab != notHab )
				return hab;
			else
				return null;
		}
	}

    $scope.reiniciar = function() {
        generateRandomIA( $scope.tameds, $scope.myTamed );
        Materialize.toast("TE DESTRUIRE!", 2000, "toast-ia");
        $scope.myTamed.vida = $scope.myTamed.vidaTotal;
        $scope.IA.vida = $scope.IA.vidaTotal;
        $scope.estado = 'In game';
        $scope.IA.vidaActual = 100;
        $scope.myTamed.vidaActual = 100;
        $scope.turno = 1;
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
        for( var i = 0; i < $scope.tameds.length; i++ )
            $scope.tameds[i].vidaTotal = $scope.tameds[i].vida;
		Data.setTameds(success.data);
	}).catch(function(error){
	});

	if(!$scope.myTamed && $scope.myUser.id_tam){
		Querys.myTamed()
		.then(function(success){
			$scope.myTamed = potenciar(success.data);
			$scope.loading = false;
            $scope.myTamed.vidaTotal = $scope.myTamed.vida;
			Data.setTamed($scope.myTamed);
		}).catch(function(error){
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
		tamed.potenciador = formData.potenciador;
		tamed.nivel = 1;
		Querys.createTamed(formData)
		.then(function(success){
			$scope.configuring = false;
			tamed = potenciar(tamed);
			Data.setTamed(tamed);
			$scope.myTamed = tamed;
		}).catch(function(error){
		})
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
	tamed.vida = parseInt( tamed.vida * tamed.potenciador + ( tamed.nivel * 8 ) );
	tamed.ataque = parseInt( tamed.ataque * tamed.potenciador + ( tamed.nivel * 8 ) );
	tamed.defensa = parseInt( tamed.defensa * tamed.potenciador + ( tamed.nivel * 8 ) );
	return tamed;
};

var porcentajeVida = function( vida, vidaTotal ) {
	var porcentaje = parseInt( (vida * 100) / vidaTotal );
	if( porcentaje >= 0 )
		return porcentaje;
	else
		return 0;
};













