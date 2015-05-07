var app = angular.module('app', ['lumx']);

app.controller('BoardsController', function ($scope, $http, LxDialogService) {
	$scope.user_id = window.location.search.split('=')[1];
	getMyBoards();

	$scope.GoToProject = function (id) {
		window.location = "project.html?id="+id;
	};


	$scope.CreateProject = function () {
		if($scope.title.trim()=="") return;
		var req = {
			title   : $scope.title,
			color   : $scope.selectedColor,
			user_id : $scope.user_id
		}
		$http.post('/boards',  req).success(function (response) {
			console.log(response);
			LxDialogService.close($scope.dialogId);
			getMyBoards();
		});
	};

	function getMyBoards () {
		$http.get('/boards/'+$scope.user_id).success(function (response) {
			$scope.boards = response;
		});
	};

	$scope.opendDialog = function(dialogId)
	{
		$scope.dialogId = dialogId;
	    LxDialogService.open(dialogId);
	};


	$scope.red = "";
	$scope.green = "";
	$scope.orange = "";
	$scope.purple = "";
	$scope.blue = "check";
	$scope.grey = "";
	$scope.selectedColor = "blue";
	$scope.SelectColor = function (color) {
		$scope.selectedColor = color;
		$scope.red = "";
		$scope.green = "";
		$scope.orange = "";
		$scope.purple = "";
		$scope.blue = "";
		$scope.grey = "";
		switch(color){
			case "red": $scope.red = "check"; break;
			case "green": $scope.green = "check"; break;
			case "orange": $scope.orange = "check"; break;
			case "purple": $scope.purple = "check"; break;
			case "blue": $scope.blue = "check"; break;
			case "grey": $scope.grey = "check"; break;

		}
	};
});

app.controller('LoginController', function ($scope, $http) {
	$scope.Login = function () {
		var req = {
			login: $scope.auth.login,
			password: $scope.auth.password
		}
		$http.post('/login', req).success(function (response) {
			if(response == null){
				alert('Неверный логин или пароль!');
			}else{
				console.log(response);
				window.location = "boards.html?id="+response["_id"];
			}
		});
	};
});

app.controller('HomeController', function ($scope) {
	$scope.RegisterPage = function () {
		window.location = "register.html";
	};
});

app.controller('RegisterController', function ($scope, $http) {
	$scope.Register = function () {
		if($scope.auth.password != $scope.auth.confirm_password){
			alert("Пароли не совпадают!");
			return;
		}
		var req = {
			login: $scope.auth.login,
			password: $scope.auth.password,
			confirm: $scope.auth.confirm_password
		}
		$http.post('/register', req).success(function (response) {
			if(response == null){
				alert('Такой пользователь уже существует!');
			}else{
				console.log(response);
				window.location = "login.html";
			}
		});
	};
});


app.controller('myCtrl', function ($scope, $http) {

	function loadBoards () {
		$http.get('/boards').success(function (request) {
			$scope.boards = request;
		});
	};
	
	loadBoards();

	function BubbleSort(A)       // A - массив, который нужно
	{                            // отсортировать по возрастанию.
	    var n = A.length;
	    for (var i = 0; i < n-1; i++)
	     { for (var j = 0; j < n-1-i; j++)
	        { if (parseInt(A[j+1]["position"]) < parseInt(A[j]["position"]))
	           { var t = A[j+1]; A[j+1] = A[j]; A[j] = t; }
	        }
	     }                     
	    return A;    // На выходе сортированный по возрастанию массив A.
	}

	function loadLists () {
		var lists = [];
		lists = $scope.lists;
		// загрузка списов
		$http.get('/lists').then(function (request) {
			var templists = request["data"];
			lists = BubbleSort(templists);
			// загрузка карточек

			$http.get('/cards').then(function (request) {
				for(var i in request["data"]){
					for(var j in lists){
						if(lists[j]["_id"]==request["data"][i]["list_id"]){
							if(lists[j]["cards"]!=request["data"][i])
							lists[j]["cards"].push(request["data"][i]);
						}
					}
				}
				for(var i in lists){
					lists[i]["cards"] = BubbleSort(lists[i]["cards"]);
				}
				$scope.lists = lists;
			});
		});

	}

	loadLists();
			// прослушка изменения списка
		$scope.$watch('lists', function(newValue, oldValue) {
	       //set window width
	       	if(newValue===undefined) return;
	  		var window_width = (($scope.lists.length+1) * 300) + (($scope.lists.length+1) * 12);
	  		$('#addListMenu').css('left', window_width - 312);

			if(window_width < $(window).width()) window_width = $(window).width();
			$('#layout').width(window_width);
			$('.listContainer').width(window_width);

			setTimeout(InitShapeShift, 0);
			setTimeout(recalcHeight, 0);



			$('#switch1').removeAttr('disabled');
			if($scope.lists.length<=2){
				$scope.switch_disabled = true;
				$('#switch1').removeAttr('checked');
				$('#switch1').attr('disabled', true);
			}else{
				$('#switch1').attr('checked', true);
			}

			

	    });
	
	$scope.toggleSwitch = function () {
		if($('#switch1').prop('checked')){
			$(".container").trigger('ss-destroy');
			$('.needToRemove').each(function(){
				$(this).show();
				$(this).parent().append($(this));
			});
			
			InitShapeShift();
		}else{
			$('.needToRemove').each(function(){
				$(this).show();
			});
			$(".listContainer").trigger('ss-destroy');
			InitCardsShift();
		}
	};


	function InitCardsShift(){

		var containerSettings = {
		    enableDrag: true
		};

		var startListIndex, endListIndex;
		var startCardIndex, endCardIndex;

		var $container = $(".container").shapeshift(containerSettings);

		$('.needToRemove').each(function(){
			$(this).hide();

		});
		

		$('.draggableList').unbind('dragstart');

		//drag start
		$container.on('dragstart', function (e, selected) {

			var val = $(selected)[0]["offset"]["left"];
			var counter = 0;
			while(val > 300) {
				val -= 310;
				counter++;
			}

			startListIndex = counter;

			val = $(selected)[0]["originalPosition"]["top"];
			counter = 0;
			while(val > 14) {
				val -= 66;
				counter++;
			}

			startCardIndex = counter;

		});
		//dragstop
		$container.on('dragstop', function (e, selected) {
			var val = $(selected)[0]["offset"]["left"];
			var counter = 0;
			while(val > 300) {
				val -= 310;
				counter++;
			}
			endListIndex = counter;

			val = $(selected)[0]["helper"][0]["offsetTop"];
			counter = 0;
			while(val > 50) {
				val -= 66;
				counter++;
			}

			endCardIndex = counter;

			

			//сравниваем листы
			// если разные

			console.log("start list: " + startListIndex);
			console.log("start card: "  + startCardIndex);
			console.log("end list: " + endListIndex);
			console.log("end card: " + endCardIndex);
			if(startListIndex != endListIndex){
				var cards = getCardsByListPos(startListIndex);
				var iter = false;

				var saveI = 0;
			
				for(var i = 0; i < cards.length; i++){
					// -- удаляем из старого
					if(cards[i]["position"]==startCardIndex){
						console.log("чудеса");
						$http.put('/cardsSwitch/'+cards[i]["_id"], {list_id: $scope.lists[endListIndex]["_id"], pos: endCardIndex}).success(function (response) {
							//$scope.lists[endListIndex]["cards"][endCardIndex] = response;
						});

						/*
						var card = {
							_id: null,
							desc: cards[i]["desc"],
							comment_count: cards[i]["comment_count"],
							list_id: $scope.lists[endListIndex]["_id"]
						}
						$scope.lists[endListIndex]["cards"].splice(endCardIndex, 0, null);
						addNewCardFromExist(card, function (id) {
							$scope.lists[endListIndex]["cards"][endCardIndex]["position"] = endCardIndex;
							console.log("id 3 " + id);
							$http.put('/cards/'+id, {newPos: parseInt(endCardIndex)}).success(function (response) {
								$scope.lists[endListIndex]["cards"][endCardIndex] = response;
							});
						});

						*/
						saveI = i;
						
						iter = true;
						continue;
					}
					// -- сдвигаем все карточки после удалённой
					if(iter){
						// отсылать на сервер новую позицию карточки
						console.log("id 1 " + cards[i]["_id"]);
						$http.put('/cards/'+cards[i]["_id"], {newPos: parseInt(cards[i]["position"]) - 1}).success(function (response) {
							console.log("answer form id1");
							console.log(response);
						});
					}
				}

			//	$scope.deleteCard($scope.lists[startListIndex]["cards"][saveI]["_id"]);
			//	$scope.lists[startListIndex]["cards"].splice(saveI, 1);


				console.log(cards);
			
				cards = getCardsByListPos(endListIndex);
				iter = false;
				for(var i = 0; i < cards.length; i++){
					if(cards[i]["position"]==endCardIndex){
						iter = true;
					}
					if(iter){
						// отсылать на сервер новую позицию карточки
						console.log("id 2 " + cards[i]["_id"]);
						$http.put('/cards/'+cards[i]["_id"], {newPos: parseInt(cards[i]["position"]) + 1}).success(function (response) {
							console.log("answer form id2");
							console.log(response);
						});
					}
				}
				// передвигаем карточку
				
				
				
				console.log("last card to change");
				console.log($scope.lists[endListIndex]["cards"][endCardIndex]);
				loadLists();
			}else{
				
				

				if(startCardIndex==endCardIndex) return;
				var cards = getCardsByListPos(startListIndex);
				var ids = [];

				//сверху вниз
				if(startCardIndex < endCardIndex){

					for(var i = startCardIndex; i <= endCardIndex; i++){

						for(var j in cards){
							console.log("card position: " + cards[j]["position"]);
							if(cards[j]["position"]==i){
								ids.push(cards[j]["_id"]);
							}
						}
					}
					for(var i in cards){
						if(cards[i]["position"]==startCardIndex){
							cards[i]["position"] = endCardIndex + 1;
						}
					}
					for(var i in cards){
						for(var j in ids){
							if(cards[i]["_id"]==ids[j]){
								cards[i]["position"] = parseInt(cards[i]["position"]) - 1;
								$http.put('/cards/'+ids[j], {newPos: parseInt(cards[i]["position"])}).success(function (response) {
									console.log("замена позиции");
									console.log(response);
								});
							}
						}
					}
				}else {

					for(var i = endCardIndex; i <= startCardIndex; i++){
						for(var j in cards){
							console.log("card position: " + cards[j]["position"]);
							if(cards[j]["position"]==i){
								ids.push(cards[j]["_id"]);
							}
						}
					}
					for(var i in cards){
						if(cards[i]["position"]==startCardIndex){
							cards[i]["position"] = endCardIndex - 1;
						}
					}
					for(var i in cards){
						for(var j in ids){
							if(cards[i]["_id"]==ids[j]){
								cards[i]["position"] = parseInt(cards[i]["position"]) + 1;
								$http.put('/cards/'+ids[j], {newPos: parseInt(cards[i]["position"])}).success(function (response) {
									console.log("замена позиции");
									console.log(response);
								});
							}
						}
					}
				}
			}
			

		});

		$('.listContainer').unbind('ss-rearranged');

		$container.unbind('ss-drop-complete');

		$container.on('ss-drop-complete', function (e) {
			/*
			$('.container').each(function () {
				$(this).resize();
				console.log("resize");
			});
			*/
			
		});
	}

	function getCardsByListPos(listPos){
		for(var i = 0; i < $scope.lists.length; i++){
			if($scope.lists[i]["position"]==listPos){
				console.log("find");
				return $scope.lists[i]["cards"];
			}
		}
		console.log("not find");
		return null;
	}



	$scope.showBut = function (id) {
		$('#addButton_'+id).show().next().show();
	};
	$scope.hideBut = function (id) {
		$('#addButton_'+id).hide().next().hide();
	};

	$scope.toggleBoards = function () {
		if($('.left_sidebar').css('display')=='none'){
			$('.left_sidebar').css('display','block');
			$(window).resize();
		}else{
			$('.left_sidebar').css('display','none');
		}
	};

	$scope.toggleRightMenu = function () {
		if($('.right_sidebar').css('display')=='none'){
			$('.right_sidebar').css('display','block');
		}else{
			$('.right_sidebar').css('display','none');
		}
	};

	function InitShapeShift() {

		var startIndexDragging;

		var containerSettings = {
		    enableDrag: true
		};

		var listContainerSettings = {
			enableDrag: true,
			align: 'left',
			enableResize: false
		}
		if($(".listContainer").children().length == 0) return;

		$(".listContainer").trigger('ss-destroy');
		var $listContainer = $(".listContainer").shapeshift(listContainerSettings);
		$(".listContainer").trigger('ss-destroy');
		var $container = $(".container").shapeshift(containerSettings);
		$(".container").trigger('ss-destroy');
		$listContainer = $(".listContainer").shapeshift(listContainerSettings);

		if(!$('#switch1').prop('checked')){
			$(".listContainer").trigger('ss-destroy');
			$('.needToRemove').each(function(){
				$(this).show();
			});
			$(".listContainer").trigger('ss-destroy');
			InitCardsShift();
		}

		$('.draggableList').unbind('dragstart');
		$('.draggableList').on('dragstart', function (e, selected) {

			var val = $(selected)[0]["originalPosition"]["left"];
			var counter = 0;
			while(val > 300) {
				val -= 310;
				counter++;
			}
			startIndexDragging = counter;

		});
		$listContainer.unbind('ss-rearranged');
		$listContainer.on('ss-rearranged', function (e, selected) {

			var lists = $scope.lists;

			startIndexDragging = parseInt(startIndexDragging);
			var endIndexDragging = parseInt($(selected).index());
			if(startIndexDragging==endIndexDragging) return;


			var ids = [];

			//справа налево
			if(startIndexDragging > endIndexDragging)
			{
				for(var i = endIndexDragging; i <= startIndexDragging; i++){
					for(var j in lists){
						if(lists[j]["position"]==i){
							ids.push(lists[j]["_id"]);
						}
					}
				}
				for(var j in lists){
					if(lists[j]["position"]==endIndexDragging){
						for(var k in lists){
							if(lists[k]["position"]==startIndexDragging){
								lists[k]["position"] = endIndexDragging - 1;
								break;
							}
						}
						break;
					}
				}
				for(var j in lists){
					for(var i in ids){
						if(lists[j]["_id"]==ids[i]){
							lists[j]["position"] = parseInt(lists[j]["position"]) + 1;
							$http.put('/lists/'+lists[j]["_id"], {newPos: parseInt(lists[j]["position"])}).success(function (response) {
								console.log("CHANGE LSIT MOTHER FUCKER!!!!");
								console.log(response);
							});
							break;
						}
					}
				}
			}
			else
			{
				for(var i = startIndexDragging; i <= endIndexDragging; i++){
					for(var j in lists){
						if(lists[j]["position"]==i){
							ids.push(lists[j]["_id"]);
						}
					}
				}
				for(var j in lists){
					if(lists[j]["position"]==endIndexDragging){
						for(var k in lists){
							if(lists[k]["position"]==startIndexDragging){
								lists[k]["position"] = endIndexDragging + 1;
								break;
							}
						}
						break;
					}
				}
				for(var j in lists){
					for(var i in ids){
						if(lists[j]["_id"]==ids[i]){
							lists[j]["position"] = parseInt(lists[j]["position"]) - 1;
							$http.put('/lists/'+lists[j]["_id"], {newPos: parseInt(lists[j]["position"])}).success(function (response) {
								console.log("CHANGE LSIT MOTHER FUCKER!!!!");
								console.log(response);
							});
							break;
						}
					}
				}

			}
		});
		if(!$('#switch1').prop('checked')){
			$('.draggableList').unbind('dragstart');
			$listContainer.unbind('ss-rearranged');
		}

		//recalcHeight();
		//$(window).resize();
		$('.scrollbar-y-axis__handle').css('z-index', 400);

		if($scope.lists.length<=2){
			$(".listContainer").trigger('ss-destroy');
		}

	};

	function recalcHeight () {
		$('.container').each(function () {
			var total_height = 0;
			var last_height = $(this).height();
			$(this).children().each(function () {
				total_height += $(this).height();
				total_height += 10;
			});
			console.log(last_height);
			console.log(total_height);
			if(last_height-total_height>60&&total_height!=10){
				$(this).height(total_height);
				$(window).resize();
			}

		});
	}
	$scope.addList = function () {

		var newList = $('#newList').val();
		// Подставить нормальные данные
		var pos = $('.listContainer>div').children().length;
		pos = parseInt(pos);

		var req = {
			title: newList,
			desc: "Новое описание",
			board_id: "id3",
			cards: [],
			position: pos
		}
		$http.post('/lists', req).success(function (response) {
			loadLists();
		});

		$('#newList').val("");
	};

	$scope.removeList = function (id) {

		var trig = false;
		for(var i = 0; i < $scope.lists.length; i++){
			if($scope.lists[i]["_id"]==id){
				trig = true;
				continue;
			}
			if(trig){
				var pos = parseInt($scope.lists[i]["position"]) - 1;
				$http.put('/lists/'+$scope.lists[i]["_id"], {newPos: pos}).success(function (response) {
					console.log("CHANGE LSIT MOTHER FUCKER!!!!");
					console.log(response);
				});
			}
		}

		$http.delete('/lists/' + id).success(function (response) {
			loadLists();
		});
	};

	$scope.addNewCard = function (id) {
		var pos = 0;
		for(var i = 0; i < $scope.lists.length; i++){
			if($scope.lists[i]["_id"]==id){
				pos = $scope.lists[i]["cards"].length;
				break;
			}
		}
		pos = parseInt(pos);

		var req = {
			desc: $('#input_'+id).val(),
			comment_count: 0,
			list_id: id,
			position: pos
		}
		$http.post('/cards', req).success(function (response) {
			loadLists();
		});
	};

	function addNewCardFromExist(card, cb){
		$http.post('/cards', card).success(function (response) {
			console.log("answer form add new card from exist");
			console.log(response);
			cb(response["_id"]);
		});
	}

	$scope.deleteCard = function (id) {

		var trig = false;
		for(var i = 0; i < $scope.lists.length; i++){
			for(var j = 0; j < $scope.lists[i]["cards"].length; j++){
				if($scope.lists[i]["cards"][j]["_id"]==id){
					trig = true;
					continue;
				}
				if(trig){
					var pos = parseInt($scope.lists[i]["cards"][j]["position"]) - 1;
					$http.put('/cards/'+$scope.lists[i]["cards"][j]["_id"], {newPos: pos}).success(function (response) {
						console.log(response);
					});
				}
			}
			if(trig){
				break;
			}
			
		}

		$http.delete('/cards/' + id).success(function (response) {
			loadLists();
		});
	};



});