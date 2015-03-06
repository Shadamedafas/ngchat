var chatApp = angular.module("chatApp", ["ngRoute", "firebase", "luegg.directives"]);

chatApp.config(["$routeProvider",
	function($routeProvider) {
		$routeProvider.
		when("/chat", {
			templateUrl: "views/chat.html",
		}).
		when("/auth", {
			templateUrl: "views/auth.html",
		}).
		otherwise({
			redirectTo: "/chat"
		});
	}
]);

chatApp.run(['auth', '$rootScope', 
	function(auth, $rootScope){
		$rootScope.currentUser = {
			loggedIn : null,
			userName: null
		};
		auth.getCurrentUser();
	}
]);

chatApp.controller("HeaderCtrl", ["$scope", "auth",
	function($scope, auth){
		$scope.logout = function(){
			auth.logout();
		}
	}
]);

chatApp.controller("ChatCtrl", ["$scope", "messenger",
	function($scope, messenger) {
		$scope.messages = messenger.syncMessages;
		$scope.sendMessage = function(messageContent) {
			messenger.sendMessage(messageContent);
			$scope.model.messageContent = null;
		} 
	}
]);

chatApp.controller("AuthCtrl", ["$scope", "auth",
	function($scope, auth) {
		$scope.login = function(authClient) {
			auth.login(authClient);
		}
	}
]);

chatApp.factory("fbutil",
	function(){
		return {
			ref : new Firebase("https://zmchat.firebaseio.com/")
		}
	}
);

chatApp.factory("messenger", ["$rootScope", "fbutil", "$firebase",
	function($rootScope, fbutil, $firebase){
		return {
			sendMessage : function(messageContent){
				if (messageContent) {
					var message = {
						"user" : $rootScope.currentUser.userName,
						"content" : messageContent,
						"time" : Date.now()
					};
					this.syncMessages.$add(message);
				} else {
					return false;
				}
			},
			syncMessages : $firebase(fbutil.ref).$asArray()
		}
	}
]);

chatApp.factory("auth", ["$rootScope", "fbutil", "$firebaseAuth", "$location",
	function($rootScope, fbutil, $firebaseAuth, $location){
		var authObject = {
			authRef : $firebaseAuth(fbutil.ref),
			login : function(authClient){
				authObject.authRef.$authWithOAuthPopup(authClient)
				.then(function(authData){
					authObject.getCurrentUser();
					$location.path( "#/chat" );
				})
				.catch(function(error){
					console.log(error);
				});
			},
			logout : function(){
				if (this.authRef.$getAuth()){	
					this.authRef.$unauth();
					this.getCurrentUser();
					console.log("Logged out successfully.");
				} else {
					console.log("Not logged in.");
				}
			},
			getCurrentUser : function(){
				var authInformation = this.authRef.$getAuth();
				var userObject = $rootScope.currentUser;

				if (authInformation) {
					userObject.loggedIn = true;

					switch(authInformation.provider) {
						case "facebook":
							userObject.userName = authInformation.facebook.displayName;
							break;
						case "google":
							userObject.userName = authInformation.google.displayName;
							break;
					}
				} else {
					angular.forEach(userObject, function(value, key){
						userObject[key] = null;
					});
				}
			}
		}
		return authObject;
	}
]);