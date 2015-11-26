app.factory('Data', ['$http', '$localStorage', function () {
            var myUser, myTamed, tameds;
            return {
                setUser: function (data) {
                    myUser = data;
                },
                getUser: function () {
                    return myUser;
                },
                getTamed: function () {
                    return myTamed;
                },
                setTameds: function (data) {
                    tameds = data;
                },
                getTameds: function () {
                    return tameds;
                },
                setTamed: function (data) {
                    myTamed = data;
                }
            };
    }
]);
app.factory('Querys', ['$http', '$localStorage','Data', function ($http, $localStorage, Data) {

        return {
            signup: function (data) {
                return $http.post('/signup', data);
            },
            login: function (data) {
                return $http.get('/login', {params: {user_1: data.user_1, password: data.password}});
            },
            tameds: function () {
                return $http.get('/tameds');
            },
            myTamed: function () {
                return $http.get('/myTamed?user_1=' + Data.getUser().user_1);
            },
            createTamed: function (data) {
                return $http.post('/createTamed', data);
            }
        };
    }
]);
