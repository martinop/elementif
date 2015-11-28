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
			potenciador: Math.range(8,12)/10		// Set potenciador in range [0.8 1.2]
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
}]);

var generateRandomIA = function(tamed, user ) {
	tamed.nivel = Math.range(user.nivel-3, user.nivel+3);
	tamed.nivel = tamed.nivel<=0 ? 1 : tamed.nivel;

	tamed.potenciador = Math.range(2,12)/10;
	tamed = potenciar(tamed);
	return tamed;
};

var potenciar = function(tamed){
	tamed.ataque = parseInt( tamed.ataque * tamed.potenciador * tamed.nivel );
	tamed.defensa = parseInt( tamed.defensa * tamed.potenciador * tamed.nivel );
	tamed.vida = parseInt( tamed.vida * tamed.potenciador * tamed.nivel );
	return tamed;
};














