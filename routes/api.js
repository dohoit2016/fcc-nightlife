var express = require('express');
var router = express.Router();
var Yelp = require('yelp');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Bar = mongoose.model('Bar');

/* GET home page. */
router.get('/search', function(req, res, next) {
	var l = req.query.location;
	var a = req.query.api;

	var yelp = new Yelp({
		consumer_key: process.env.YELP_CONSUMER_KEY,
		consumer_secret: process.env.YELP_CONSUMER_SECRET,
		token: process.env.YELP_TOKEN,
		token_secret: process.env.YELP_TOKEN_SECRET,
	});

	yelp.search({ term: 'food', location: l })
		.then(function (data) {
			console.log(data.businesses.length);
			if (a == 1){
				res.json(data);
			}
			else {
				var businesses = data.businesses;
				var result = [];
				for (var i = 0; i < businesses.length; i++) {
					var r = {};
					r.name = businesses[i].name;
					r.id = businesses[i].id;
					r.snippet_text = businesses[i].snippet_text;
					r.rating_img = businesses[i].rating_img_url_large;
					r.review_count = businesses[i].review_count;
					r.image_url = businesses[i].image_url;
					result.push(r);
				};
				// res.render("index", {data: result, user: req.user});
				res.json(result);
				if (req.user){
					User.findById(req.user.id, function (err, user) {
						if (err){
							console.log(err);
							return;
						}
						if (user){
							user.lastLocation = l;
							user.save(function (err) {
								if (err){
									console.log(err);
								}
							})
						}
					})
				}
			}
		})
		.catch(function (err) {
			console.error(err);
		});
});

router.get("/get/getNumberGoing", function (req, res) {
	Bar.findOne({
		yelpId: req.query.yelpId
	}, function (err, bar) {
		if (err){
			res.json({
				count: 0,
				willGo: false
			});
			return;
		}
		if (!bar){
			// TODO:
			// check yelpId is correct or not

			var newBar = new Bar();
			newBar.usersGoing = [];
			newBar.yelpId = req.query.yelpId;
			newBar.save(function (err) {
				if (err){
					console.log(err);
				}
				console.log("save " + req.query.yelpId);
			});
			res.json({count: 0, willGo: false});
			return;
		}
		if (!req.user){
			res.json({
				count: bar.usersGoing.length,
				willGo: false
			});
		}
		else {
			res.json({
				count: bar.usersGoing.length,
				willGo: bar.usersGoing.indexOf(req.user.id) >= 0
			});
		}
	})
});

router.get('/markBar', function (req, res) {
	var yelpId = req.query.yelpId;
	if (!req.user){
		Bar.findOne({yelpId: yelpId}, function (err, bar) {
			if (err || !bar){
				res.json({
					count: 0,
					willGo: false
				});
				return;
			}
			res.json({
				count: bar.usersGoing.length,
				willGo: false
			});
		});
	}
	else{
		Bar.findOne({yelpId: yelpId}, function (err, bar) {
			if (err || !bar){
				res.json({
					count: 0,
					willGo: false
				});
				return;
			}
			if (bar.usersGoing.indexOf(req.user.id) < 0){
				bar.usersGoing.push(req.user.id);
				bar.save(function (err) {
					if (err){
						console.log(err);
					}
					res.json({
						count: bar.usersGoing.length,
						willGo: true
					})
				})
			}
			else {
				bar.usersGoing.splice(bar.usersGoing.indexOf(req.user.id), 1);
				bar.save(function (err) {
					if (err){
						console.log(err);
					}
					res.json({
						count: bar.usersGoing.length,
						willGo: false
					})
				})
			}
		});
	}
})

module.exports = router;
