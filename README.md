authenticate
============

Access token authentication middleware for Express, NodeJS.  Makes it easy to add access token authentication to any API. 

## Installing it with npm

Add to `dependencies`:

    "authenticate": "*"

## Installing via npm

    npm install authenticate

## Usage

    var authenticate = require("authenticate");
    
    // Inside of app.configure
    app.use(authenticate.middleware({
        encrypt_key: "", // Add any key for encrypting data
        validate_key: "" // Add any key for signing data
    }));

## And then...

The access token can be passed to a frontend client after the client is authenticated via some form of login.  For example, making a POST to /login with email and password, verifying email and password are correct, and then passing the access token to the client.  Here is some javascript for passing an access token to the client in JSON.

client_id is mainly for ownership of access.  

	var authenticate = require("authenticate");
	
	app.get('/login', function(req, res) {
		// Insert user auth logic here
		res.writeHead(200, {
		    "Content-Type": "application/json"
		});
		res.write(JSON.stringify({
		    "access_token": authenticate.serializeToken(client_id, user_id, extra_data) // extra data is optional
		}));
		res.end();
	});

An access token embeds data into the request.  You can then check whether the user and client have access to a resource or not.

Your API can then take a request with the access token as a query string parameter, part of the request body, or headers.  In the request body and the query string parameters, access_token is passed (e.g. http://localhost?access_token=123).  However, for headers you want to pass "x-access-token".

In calls with an access token, the middleware auths against the token automatically. An example of using this would be:
	
	app.get("/restricted", function(req, res) {
		if(!req.data.user_id) {
			// No auth, redirect or show error page
			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.write('{error:"Authentication Error"}');
			res.end();
			return;
		}
		req.data.user_id // user id
		req.data.client_id // A client id
		req.data.date // date access token was created
		req.data.extra_data // extra data passed in when serialized
		req.data.access_token // Access token being passed in
		// etc.
	});
