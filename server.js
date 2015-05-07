var express = require('express');
var app = express();
var mongojs = require('mongojs');
var path = require('path');
var bodyParser = require('body-parser');
//dbs
var dbBoards   = mongojs('boards', ['boards']),
	dbLists    = mongojs('lists', ['lists']),
	dbCards    = mongojs('cards', ['cards']),
	dbUsers    = mongojs('users', ['users']),
	dbComments = mongojs('comments', ['comments']);

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
})

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

//USERS

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
})

app.post('/comment', function (req, res) {
	dbComments.comments.insert(req.body, function (err, docs) {
		res.json(docs)
	});
})


app.listen(3000);
console.log("Server started and listening port 3000");