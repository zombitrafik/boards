var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongojs = require('mongojs');
var path = require('path');
var bodyParser = require('body-parser');
//dbs
var dbBoards     = mongojs('boards', ['boards']),
	dbLists      = mongojs('lists', ['lists']),
	dbCards      = mongojs('cards', ['cards']),
	dbUsers      = mongojs('users', ['users']),
	dbComments   = mongojs('comments', ['comments']),
	dbCMembers   = mongojs('c_members', ['c_members']),
	dbPMembers   = mongojs('p_members', ['p_members']),
	dbCheckboxes = mongojs('checkboxes', ['checkboxes']),
	dbActivity   = mongojs('activity', ['activity']);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());



app.get('/', function(req, res){
    res.sendfile('public/home.html');
});

//BOARDS
app.get('/boards/:id', function (req, res) {
	var id = req.params.id;
	dbBoards.boards.find({"user_id":id},function (err, docs) {
		res.json(docs);
	});
});

app.get('/boardsByProject/:id', function (req, res) {
	var id = req.params.id;
	dbBoards.boards.findOne({"_id":mongojs.ObjectId(id)},function (err, doc) {
		var user_id = doc["user_id"];
			dbBoards.boards.find({"user_id":user_id},function (err, docs) {
			res.json(docs);
		});
	});
});

app.post('/boards', function (req, res) {
	dbBoards.boards.insert(req.body, function (err, doc) {
		res.json(doc);
	});
});

app.get('/project/:id', function (req, res) {
	var id = req.params.id;
	dbBoards.boards.findOne({"_id":mongojs.ObjectId(id)},function (err, doc) {
		res.json(doc);
	});
});

app.put('/changeProjectColor/:id', function (req, res) {
	var id = req.params.id;
	var color = req.body.color;
	dbBoards.boards.findAndModify({ query: {_id: mongojs.ObjectId(id)},
	update: {$set: {color: color}}
	}, function (err, doc) {
		res.json(doc);
	});
});

// LISTS
app.get('/lists/:id', function (req, res) {
	var project_id = req.params.id;

	dbLists.lists.find({"project_id":project_id}, function (err, docs) {
		res.json(docs);
	});
});

app.post('/lists', function (req, res) {
	dbLists.lists.insert(req.body, function (err, doc) {
		res.json(doc);
	});
});

app.delete('/lists/:id', function (req, res) {
	var id = req.params.id;
	//удаление всех карточек из этого списка

	dbLists.lists.remove({_id: mongojs.ObjectId(id)}, function (err, doc) {
		dbCards.cards.remove({list_id: mongojs.ObjectId(id)});
		res.json(doc);
	});
});

app.put('/lists/:id', function (req, res) {
	var id = req.params.id;
	var newPos = req.body.newPos;

	dbLists.lists.findAndModify({ query: {_id: mongojs.ObjectId(id)},
	update: {$set: {position: parseInt(newPos)}}
	}, function (err, doc) {
		res.json(doc);
	});

});

// CARDS
app.get('/card/:id', function (req, res) {
	var id = req.params.id;
	dbCards.cards.findOne({"_id":mongojs.ObjectId(id)}, function (err, doc) {
		res.json(doc);
	});
});

app.get('/cards', function (req, res) {
	dbCards.cards.find(function (err, docs) {
		res.json(docs);
	});
});

app.post('/cards', function (req, res) {
	req.body.list_id = mongojs.ObjectId(req.body.list_id);
	dbCards.cards.insert(req.body, function (err, doc) {
		res.json(doc);
	});
});

app.delete('/cards/:id', function (req, res) {
	var id = req.params.id;
	dbCards.cards.remove({_id: mongojs.ObjectId(id)}, function (err, doc) {
		res.json(doc);
	});
});

app.put('/cards/:id', function (req, res) {
	var id = req.params.id;
	var newPos = req.body.newPos;
	console.log("id " + id);
	console.log("new pos " + newPos);
	dbCards.cards.findAndModify({ query: {_id: mongojs.ObjectId(id)},
	update: {$set: {position: parseInt(newPos)}}
	}, function (err, doc) {
		res.json(doc);
	});
});

app.put('/cardsSwitch/:id', function (req, res) {
	var id = req.params.id;
	var list_id = req.body.list_id;
	var pos = req.body.pos;

	dbCards.cards.findAndModify({ query: {_id: mongojs.ObjectId(id)},
	update: {$set: {position: parseInt(pos), list_id: mongojs.ObjectId(list_id)}}
	}, function (err, doc) {
		res.json(doc);
	});
});

app.put('/cardFullDesc/:id', function (req, res) {
	var card_id = req.params.id;
	var full_desc = req.body.full_desc;
	dbCards.cards.findAndModify({ query: {_id: mongojs.ObjectId(card_id)},
	update: {$set: {full_desc: full_desc}}
	}, function (err, doc) {
		res.json(doc);
	});
});

app.put('/card_date/:id', function (req, res) {
	var card_id = req.params.id;
	var date = req.body.date;
	dbCards.cards.findAndModify({ query: {_id: mongojs.ObjectId(card_id)},
	update: {$set: {date: date}}
	}, function (err, doc) {
		res.json(doc);
	});
});

//USERS
app.get('/allPeople', function (req, res) {
	dbUsers.users.find(function (err, docs) {
		res.json(docs);
	});
});

app.post('/login', function (req, res) {
	var login = req.body.login;
	var password = req.body.password;
	dbUsers.users.findOne({"login": login, "password": password}, function (err, doc) {
		res.json(doc);
	});
});

app.post('/register', function (req, res) {
	var login = req.body.login;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;
	var first_name = req.body.first_name;
	var second_name = req.body.second_name;
	dbUsers.users.findOne({"login": login}, function (err, doc) {
		if(doc!=null) {
			res.json(null);
			return;
		}else{
			dbUsers.users.insert({"login": login, "password": password, "first_name": first_name, "second_name": second_name}, function (err, doc) {
				res.json(doc);
			});
		}
	});
});

app.get('/userById/:id', function (req, res){
	var id = req.params.id;
	dbUsers.users.findOne({"_id": mongojs.ObjectId(id)}, function (err, doc) {
		res.json(doc);
	});
})

app.get('/userByProject/:id', function (req, res) {
	var project_id = req.params.id;
	dbBoards.boards.findOne({"_id":mongojs.ObjectId(project_id)},function (err, doc) {
		dbUsers.users.findOne({"_id": mongojs.ObjectId(doc["user_id"])}, function (err, doc) {
			res.json(doc);
		});
	});
});

//COMMENTS

app.get('/comments/:id', function (req, res) {
	var card_id = req.params.id;
	dbComments.comments.find({"card_id": card_id}, function (err, docs) {
		res.json(docs)
	});
});

app.post('/comment', function (req, res) {
	var card_id = req.body.card_id;

	dbComments.comments.insert(req.body, function (err, docs) {
		dbCards.cards.findAndModify({ query: {_id: mongojs.ObjectId(card_id)},
		update: {$inc: {comment_count: 1}}
		}, function (err, doc) {
			res.json(docs)
		});
		
	});
});


// C_MEMBERS
app.get('/card_members/:id', function (req, res) {
	var card_id = req.params.id;
	dbCMembers.c_members.findOne({"card_id": mongojs.ObjectId(card_id)}, function (err, docs) {
		res.json(docs)
	});
});

app.post('/cardMembers', function (req, res) {

	var card_id = req.body.card_id;
	var members = req.body.members;
	dbCMembers.c_members.findAndModify({ query: {"card_id": mongojs.ObjectId(card_id)},
	update: {$set: {members: members}}
	}, function (err, doc) {
		if(doc==null){
			dbCMembers.c_members.insert({"card_id": mongojs.ObjectId(card_id), "members": members}, function (err, doc2) {
				res.json(doc2);
			});
		}else{
			res.json(doc);
		}
	});
});


// P_MEMBERS
app.get('/project_members/:id', function (req, res) {
	var project_id = req.params.id;
	dbPMembers.p_members.findOne({"project_id": mongojs.ObjectId(project_id)}, function (err, docs) {
		res.json(docs)
	});
});

app.post('/projectMembers', function (req, res) {

	var project_id = req.body.project_id;
	var members = req.body.members;
	dbPMembers.p_members.findAndModify({ query: {"project_id": mongojs.ObjectId(project_id)},
	update: {$set: {members: members}}
	}, function (err, doc) {
		if(doc==null){
			dbPMembers.p_members.insert({"project_id": mongojs.ObjectId(project_id), "members": members}, function (err, doc2) {
				res.json(doc2);
			});
		}else{
			res.json(doc);
		}
	});
});

app.get('/accessBoards', function (req, res) {
	dbPMembers.p_members.find(function (err, docs) {
		res.json(docs)
	});
});

// CHECKBOXES
app.get('/checkboxes/:id', function (req, res) {
	var id = req.params.id;
	dbCheckboxes.checkboxes.findOne({card_id: id}, function (err, doc) {
		res.json(doc);
	});
});

app.post('/createCheckboxes', function (req, res) {

	dbCheckboxes.checkboxes.insert(req.body, function (err, doc) {
		res.json(doc);
	});
});

app.put('/AddCheckboxesTask/:id', function (req, res) {
	var card_id = req.params.id;
	var items = req.body.items;
	dbCheckboxes.checkboxes.findAndModify({ query: {card_id: card_id},
	update: {$set: {items: items}}
	}, function (err, doc) {
		res.json(doc);
	});
});

app.delete('/checkboxes/:id', function (req, res) {
	var card_id = req.params.id;
	dbCheckboxes.checkboxes.remove({card_id: card_id}, function (err, doc) {
		res.json(doc);
	});
});

// ACTIVITY

app.get('/activity/:id', function (req, res) {
	var id = req.params.id;
	dbActivity.activity.find({project_id: id}).sort({_id:-1}).limit(20, function (err, docs) {
		res.json(docs)
	});
});

app.get('/getAllActivity/:id', function (req, res) {
	var id = req.params.id;
	dbActivity.activity.find({project_id: id}).sort({_id:-1}, function (err, docs) {
		res.json(docs)
	});
});

app.put('/activity/:id', function (req, res) {
	var project_id = req.params.id;
	var body = req.body.body;
	dbActivity.activity.findOne({id: project_id}, function (err, docs) {
		if(docs==null){
			dbActivity.activity.insert({project_id: project_id, body: body}, function (err, doc) {
				res.json(doc);
			})
		}else{
			dbActivity.activity.findAndModify({ query: {project_id: project_id},
			update: {$set: {body: body}}
			}, function (err, doc) {
				res.json(doc);
			});
		}
	})
	
});

// SOCKET.IO

var projects = [];

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('connect_to_board', function (obj) {
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	if(projects[project_id]==null){
  		projects[project_id] = [];
  	}
  	projects[project_id].push({
		user_id: user_id,
		socket: socket
	});
	//console.log(projects[project_id]);
  });

  socket.on('create_card', function (obj) {
  	console.log("create_card");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('create_card', {msg: 'Somebody create_card...'});
  		}
  	}
  });

  socket.on('delete_card', function (obj) {
  	console.log("delete_card");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('delete_card', {msg: 'Somebody delete_card...'});
  		}
  	}
  });

  socket.on('delete_list', function (obj) {
  	console.log("delete_list");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('delete_list', {msg: 'Somebody delete_list...'});
  		}
  	}
  });

  socket.on('create_list', function (obj) {
  	console.log("create_list");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('create_list', {msg: 'Somebody create_list...'});
  		}
  	}
  });

  socket.on('reranged', function (obj) {
  	console.log("reranged");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('reranged', {msg: 'Somebody reranged...'});
  		}
  	}
  });

  socket.on('comments', function (obj) {
  	console.log("comments");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	var card_id = obj.card_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('comments', {msg: 'Somebody comments...', card_id: card_id});
  		}
  	}
  });

  socket.on('project_color', function (obj) {
  	console.log("project_color");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	var color = obj.color;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('project_color', {msg: 'Somebody project_color...', color: color});
  		}
  	}
  });

  socket.on('project_members', function (obj) {
  	console.log("project_members");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('project_members', {msg: 'Somebody project_members...'});
  		}
  	}
  });

  socket.on('card_members', function (obj) {
  	console.log("card_members");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('card_members', {msg: 'Somebody card_members...'});
  		}
  	}
  });
  
  socket.on('new_desc', function (obj) {
  	console.log("new_desc");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	var card_id = obj.card_id;
  	var desc = obj.desc;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('new_desc', {msg: 'Somebody new_desc...', card_id: card_id, desc: desc});
  		}
  	}
  });

  socket.on('checkboxes', function (obj) {
  	console.log("checkboxes");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('checkboxes', {msg: 'Somebody checkboxes...'});
  		}
  	}
  });
  
  socket.on('checkboxes_delete', function (obj) {
  	console.log("checkboxes_delete");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('checkboxes_delete', {msg: 'Somebody checkboxes_delete...'});
  		}
  	}
  });

  socket.on('card_date', function (obj) {
  	console.log("card_date");
  	var project_id = obj.project_id;
  	var user_id = obj.user_id;
  	var card_id = obj.card_id;
  	var date = obj.date;
  	for(var i in projects[project_id]){
  		var user = projects[project_id][i];
  		if(user.user_id != user_id) {
  			user.socket.emit('card_date', {msg: 'Somebody card_date...', card_id: card_id, date: date});
  		}
  	}
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
//app.listen(3000);
//console.log("Server started and listening port 3000");