var app = angular.module('app', ['lumx']);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.controller('BoardsController', function ($scope, $http, LxDialogService) {
	$scope.user_id = window.location.search.split('&')[0].split('=')[1];

	getMyBoards();
	getAccessBoards();

	$scope.GoToProject = function (id, is_leader) {
		window.location = "project.html?id="+id+"&l="+is_leader+"&u_i="+$scope.user_id;
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

	function getAccessBoards () {
		$http.get('/accessBoards').success(function (response) {
		//	$scope.accessBoards = response;
			var p_ids = [];
			for(var i in response){
				for(var j in response[i]["members"]){
					if(response[i]["members"][j]["_id"]==$scope.user_id){
						p_ids.push(response[i]["project_id"]);
						break;
					}
				}
			}
			$scope.accessBoards = [];
			for(var i in p_ids){
				$http.get('/project/'+p_ids[i]).success(function (response) {
					$scope.accessBoards.push(response);
				});
			}
		});
	}

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
				window.location = "boards.html?id="+response["_id"]+"&o=f";
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
			confirm: $scope.auth.confirm_password,
			first_name: $scope.auth.first_name,
			second_name: $scope.auth.second_name
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


app.controller('myCtrl', function ($scope, $http, LxDialogService, $filter) {

	$scope.project_id = window.location.search.split('&')[0].split('=')[1];
	var is_leader = window.location.search.split('&')[1].split('=')[1];
	$scope.user_id = window.location.search.split('&')[2].split('=')[1];

	if(is_leader=="t"){
		$scope.is_leader = true;
	}else{
		$scope.is_leader = false;
	}
	getMyBoards();
	getAccessBoards();

	function getMyBoards () {
		$http.get('/boards/'+$scope.user_id).success(function (response) {
			$scope.boards = response;
		});
	};

	$scope.$watch('card_info.date', function (newValue, oldValue) {
		if($scope.card_info==null) return;
		if(newValue == oldValue) return;
		//if(oldValue==undefined) return;
		console.log("new date " + newValue);
		$http.put('/card_date/'+$scope.card_info._id, {date: $scope.card_info.date}).success(function (response) {
			// SOCKET
			socket.emit('card_date', {
				project_id: $scope.project_id,
				user_id: $scope.user_id,
				card_id: $scope.card_info._id,
				date: $scope.card_info.date
			});
			
			var d = $filter('date')($scope.card_info.date, "yyyy-MM-dd");
			PushIntoActivity("сменил(-а) дату на " + d + " в карточке " + $scope.card_info.desc);
		});
	});

	function getAccessBoards () {
		$http.get('/accessBoards').success(function (response) {
		//	$scope.accessBoards = response;
			var p_ids = [];
			for(var i in response){
				for(var j in response[i]["members"]){
					if(response[i]["members"][j]["_id"]==$scope.user_id){
						p_ids.push(response[i]["project_id"]);
						break;
					}
				}
			}
			$scope.accessBoards = [];
			for(var i in p_ids){
				$http.get('/project/'+p_ids[i]).success(function (response) {
					$scope.accessBoards.push(response);
				});
			}
		});
	}


	ProjectSettings();
	LoadAllPeople();

	function ProjectSettings () {
		$http.get('/project/'+$scope.project_id).success(function (request) {
			$scope.project_color = request["color"];
		});
		/*
		$http.get('/userByProject/'+$scope.project_id).success(function (request) {
			$scope.user_name = request["first_name"] + " " + request["second_name"];
		});
		*/
		$http.get('/userById/'+$scope.user_id).success(function (request) {
			$scope.user_name = request["first_name"] + " " + request["second_name"];
		});
	}

	$scope.change = function () {
		alert('CHANGE');
	}

	function LoadAllPeople () {
		$http.get('/allPeople').success(function (response) {

			$http.get('/project_members/'+$scope.project_id).success(function (response2) {
				if(response2!=null)
				$scope.all_people_selected = response2["members"];
				var people = [];
				for(var r2 in response){
					var b = false;
					for(var r in response2){
						if(response2[r].login==response[r2].login){
							b = true;
							break;
						}
					}
					if(!b){
						people.push(response[r2]);
					}
				}

				$scope.all_people = people;
			});
		});
	}

	function loadBoards () {
		$http.get('/boardsByProject/'+$scope.project_id).success(function (request) {
			$scope.boards = request;
		});
	};

	$scope.GoToProject = function (id, is_leader) {
		window.location = "project.html?id="+id+"&l="+is_leader+"&u_i="+$scope.user_id;
	};

	$scope.OpenCard = function (id) {
		//if($scope.card_info==null) return;
		$http.get('/card/' + id).success(function (request) {
			if(request==null) return;

			console.log(request);
			$scope.card_info = request;
			//$scope.card_info["full_desc"] = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
			LoadComments(id);
			LoadMembers();
			LoadCheckboxes();
			LxDialogService.open('card');

		});
	};

	function LoadCheckboxes () {
		$scope.task = [];
		$http.get('/checkboxes/'+$scope.card_info._id).success(function (response) {
			if(response==null) return;
			$scope.card_info["checkboxes"] = response;
			$scope.card_info["percent"] = CalcTaskPercent();
		});
	};

	function CalcTaskPercent () {
		var t=0, f=0;
		var items = $scope.card_info["checkboxes"]["items"];
		for(var i in items){
			if(items[i]["complete"]==true) t++; else f++;
		}
		return ((t*100)/(t+f)).toFixed(0)>=0&&((t*100)/(t+f)).toFixed(0)<=100?((t*100)/(t+f)).toFixed(0):0;
	};

	$scope.RemoveTask = function () {
		$http.delete('/checkboxes/'+$scope.card_info._id).success(function (response) {
			$scope.card_info["checkboxes"] = null;
			$scope.card_info["percent"] = 0;
			setTimeout(function () {
				$(window).resize();
			}, 0);
			// SOCKET
			socket.emit('checkboxes_delete', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("удалил(-а) список заданий в карточке " + $scope.card_info.desc);
		});
	};

	$scope.AddNewTask = function () {
		$scope.card_info["checkboxes"]["items"].push({title: $scope.task.title, complete: false});
		var req = {
			items: $scope.card_info["checkboxes"]["items"]
		}
		$http.put('/AddCheckboxesTask/'+$scope.card_info._id, req).success(function (response) {
			$scope.task.title = "";
			$scope.card_info["percent"] = CalcTaskPercent();
			// SOCKET
			socket.emit('checkboxes', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("добавил(-а) новый элемент списка заданий в карточке " + $scope.card_info.desc);
		});
	};

	$scope.ApplyCheckboxes = function (index) {
		$scope.card_info["checkboxes"]["items"][index]["complete"] = !$scope.card_info["checkboxes"]["items"][index]["complete"];
		var req = {
			items: $scope.card_info["checkboxes"]["items"]
		}
		$http.put('/AddCheckboxesTask/'+$scope.card_info._id, req).success(function (response) {
			$scope.card_info["percent"] = CalcTaskPercent();
			// SOCKET
			socket.emit('checkboxes', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("изменил(-а) элемент списка заданий в карточке " + $scope.card_info.desc);
		});
	};

	$scope.CreateCheckboxes = function () {
		var req = {
			card_id: $scope.card_info._id,
			items: []
		}
		$http.post('/createCheckboxes', req).success(function (response) {
			$scope.card_info["checkboxes"] = response;
			// SOCKET
			socket.emit('checkboxes', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("добавил(-а) список заданий в карточке " + $scope.card_info.desc);
		});
	};

	$scope.EditDescription = function () {
		// смена блоков
		if($('#not_edit_block').is(':visible')){
			$scope.temp_full_desc = $scope.card_info.full_desc;
			$('#edit_block').show();
			$('#not_edit_block').hide('fast');
		}else{
			$('#edit_block').hide('fast');
			$('#not_edit_block').show('fast');
		}
	};

	$scope.LogOut = function () {
		window.location = "/";
	}

	$scope.CreateProjectFromProject = function () {
		window.location = "boards.html?id="+$scope.user_id+"&o=t";
	}

	$scope.closingDialog = function () {
		$scope.temp_full_desc = "";
		$('#edit_block').hide('fast');
		$('#not_edit_block').show('fast');
	}

	$scope.SaveNewDescription = function () {
		$http.put('/cardFullDesc/'+$scope.card_info._id, {full_desc: $scope.temp_full_desc}).success(function (response){
			// SOCKET
			socket.emit('new_desc', {
				project_id: $scope.project_id,
				user_id: $scope.user_id,
				desc: $scope.temp_full_desc,
				card_id: $scope.card_info._id
			});	

			PushIntoActivity("изменил(-а) описание в карточке " + $scope.card_info.desc + " на '" + $scope.temp_full_desc + "'");

			$scope.card_info.full_desc = $scope.temp_full_desc;
			$scope.temp_full_desc = "";
			$scope.EditDescription();

			
		});
	};


	$scope.changeProjectMembers = function (newValue, oldValue) {
		var req = {
			project_id: $scope.project_id,
			members: newValue.newValue
		}
		$http.post('/projectMembers', req).success(function (response) {
			//LoadAllPeople();

			// SOCKET
			socket.emit('project_members', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});

			PushIntoActivity("изменил(-а) участников проекта");
		});


	}

	$scope.setCardMembers = function (newValue) {
		var req = {
			card_id: $scope.card_info._id,
			members: newValue.newValue
		}
		$http.post('/cardMembers', req).success(function (response) {
			//LoadMembers();

			// SOCKET
			socket.emit('card_members', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("изменил(-а) состав пользователей в карточке " + $scope.card_info.desc);
		});
	}

	function LoadMembers () {
		$scope.selects = [];
		$http.get('/card_members/'+$scope.card_info._id).success(function (response) {
			if(response!=null)
			$scope.selects.selectedPersons = response["members"];
			$http.get('/project_members/'+$scope.project_id).success(function (response2) {
				if(response2==null) return;
				$scope.people = response2["members"];
			});
		});
	}
	
	$scope.SetNewProjectColor = function (color) {
		$scope.project_color = color;
		$http.put('/changeProjectColor/'+$scope.project_id, {color: color}).success(function (response){
			console.log(response);
			getMyBoards();
			getAccessBoards();
			// SOCKET
			socket.emit('project_color', {
				project_id: $scope.project_id,
				user_id: $scope.user_id,
				color: color
			});
			PushIntoActivity("изменил(-а) цвет проекта");
		});
	}

	$scope.SendComment = function () {
		var card_id = $scope.card_info._id;
		var message = $scope.comment;
		if(message.trim()=="") return;
		message = message.trim();
		var username = $scope.user_name;
		var req = {
			card_id: card_id,
			message: message,
			username: username
		}
		for(var i in $scope.lists){
			b = false;
			for(var j in $scope.lists[i]["cards"]){
				if($scope.lists[i]["cards"][j]["_id"]==card_id){
					b = true;
					$scope.lists[i]["cards"][j]["comment_count"] = parseInt($scope.lists[i]["cards"][j]["comment_count"]) + 1;
					break;
				}
			}
			if(b) break;
		}
		$http.post('/comment', req).success(function (response) {
			$scope.comment = "";
			console.log(response);
			LoadComments(card_id);

			//SOCKET
			socket.emit('comments', {
				project_id: $scope.project_id,
				user_id: $scope.user_id,
				card_id: card_id
			});
			PushIntoActivity("оставил(-а) новый комментарий в карточке " + $scope.card_info.desc);
		});
	};

	function LoadComments (id) {
		$http.get('/comments/'+id).success(function (response) {
			$scope.comments = response;
		});
	};

	//loadBoards();

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
		$http.get('/lists/'+$scope.project_id).then(function (request) {
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
			
			socket.emit('reranged', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("изменил(-а) расположение элементов в списке");

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
			// SOCKET
			socket.emit('reranged', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("изменил(-а) расположение списков");

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
			desc: "Список заданий",
			board_id: "id3",
			cards: [],
			position: pos,
			project_id: $scope.project_id
		}
		$http.post('/lists', req).success(function (response) {
			loadLists();
			// SOCKET
			socket.emit('create_list', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("добавил(-а) новый список: '" + newList + "'");
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
			// SOCKET
			socket.emit('delete_list', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("удалил(-а) список из проекта");
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
			position: pos,
			full_desc: "",
			date: new Date()
		}
		$http.post('/cards', req).success(function (response) {
			loadLists();
			// SOCKET
			socket.emit('create_card', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});
			PushIntoActivity("добавил(-а) новую карточку: '" + req.desc + "'");
		});
	};
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
			// SOCKET
			socket.emit('delete_card', {
				project_id: $scope.project_id,
				user_id: $scope.user_id
			});

			PushIntoActivity("удалил(-а) карточку из спика");
		});
	};

	// SOCKET.IO LOGIC

	var socket = io();


	socket.emit('connect_to_board', {
		project_id: $scope.project_id,
		user_id: $scope.user_id
	});

	//LISTENERS
	socket.on('create_card', function (obj){
		loadLists();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('delete_card', function (obj){
		loadLists();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('delete_list', function (obj){
		loadLists();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('create_list', function (obj){
		loadLists();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('reranged', function (obj){
		setTimeout(function() {
			loadLists();
		}, 100);
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('comments', function (obj){
		var card_id = obj.card_id;
		
		for(var i in $scope.lists){
			b = false;
			for(var j in $scope.lists[i]["cards"]){
				if($scope.lists[i]["cards"][j]["_id"]==card_id){
					b = true;
					$scope.lists[i]["cards"][j]["comment_count"] = parseInt($scope.lists[i]["cards"][j]["comment_count"]) + 1;
					break;
				}
			}
			if(b) break;
		}
		LoadComments(card_id);
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('project_color', function (obj){
		var color = obj.color;
		$scope.project_color = color;
		getMyBoards();
		getAccessBoards();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('project_members', function (obj){
		LoadAllPeople();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('card_members', function (obj){
		LoadMembers();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('new_desc', function (obj){
		var desc = obj.desc;
		var card_id = obj.card_id;
		if(card_id==$scope.card_info._id){
			$scope.card_info.full_desc = desc;
		}
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('checkboxes', function (obj){
		LoadCheckboxes();
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('checkboxes_delete', function (obj){
		$scope.card_info["checkboxes"] = null;
		$scope.card_info["percent"] = 0;
		setTimeout(function () {
			//$(window).resize();
		}, 0);
		console.log("MESSAGE " + obj.msg);
	});

	socket.on('card_date', function (obj){
		var card_id = obj.card_id;
		var date = obj.date;
		if($scope.card_info==null) return;
		if(card_id==$scope.card_info._id){
			$scope.card_info.date = date;
		}
		console.log("MESSAGE " + obj.msg);
	});

	getActivity();
	function getActivity () {
		$http.get('/activity/'+$scope.project_id).success(function (response) {
			$scope.activity = response;
			console.log("activity");
			console.log(response);
			setTimeout(function () {
				$(window).resize();
			});
		})
	}

	$scope.LoadAllActivity = function () {
		$http.get('/getAllActivity/'+$scope.project_id).success(function (response) {
			$scope.activity = response;
			setTimeout(function () {
				$(window).resize();
				$('#loadAA').hide();
			});

		})
	}

	function PushIntoActivity (message) {
		var req = {
			body: {
				username: $scope.user_name,
				message: message
			}
		}
		$http.put('/activity/'+$scope.project_id, req).success(function (response) {
			console.log(response);
			console.log("PUSH");
			getActivity();
		});
	}
	/// SOCKET.IO LOGIC

});