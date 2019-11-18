const express = require('express');
const bodyParser = require('body-parser');

const port = 4284;

const app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:4284/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/superrez', function(req, res) {
	const url = req.query.url;
	console.log("/superrez an image:", url);
	res.json({ message: `TODO: superrez ${url}` });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// nice to have something at the root (accessed at GET http://localhost:4284/)
app.get('/', function(req, res) {
	res.json({ message: 'API is at /api' });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

