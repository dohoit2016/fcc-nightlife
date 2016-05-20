module.exports = function (mongoose) {
	var barSchema = mongoose.Schema({
		yelpId: String,
		usersGoing: [String]
	});
	var Bar = mongoose.model("Bar", barSchema);
	return Bar;
}