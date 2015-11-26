var app = angular.module('elementif', [
 	'ui.materialize',
    'ngStorage',
    'ngRoute',
    'ui.router'
]);

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
			$scope.myTamed = success.data;
			$scope.loading = false;
			Data.setTamed($scope.myTamed);
			console.log($scope.myTamed.habilidades);
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
			vida: tamed.vida,
			ataque: tamed.ataque,
			precision: tamed.precision,
			habilidades: tamed.habilidades,
			potenciador: ((parseInt(Math.random() * 11) % 11) - 5) / 10		// Set potenciador in range [-0.5 0.5]
		};
		console.log(formData);
		Querys.createTamed(formData)
		.then(function(success){
			$scope.configuring = false;
			Data.setTamed(tamed);
			$scope.myTamed = tamed;
		}).catch(function(error){
			console.log(error);
		})
	}
}]);

app.controller('battleController', ['$scope', 'Querys','Data','$location',
	function ($scope, Querys, Data, $location) {
	$scope.tameds = Data.getTameds() || false;
	$scope.myTamed  = Data.getTamed() || false;
	if($scope.tameds) {
		$scope.IA = $scope.tameds[parseInt((Math.random() * 10) % 4)];
	}
	if(!$scope.myTamed){
		$location.path('/home');
	}
}]);