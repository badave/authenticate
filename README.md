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
        validate_key: "", // Add any key for signing data
        // Paths that are required to be public by the API
        publicPaths: {
          "POST": {
            loginPath: "/login",
            registrationPath: "/register",
            resetPasswordPath: "/resetpassword"
          },
          "PUT": {
            changePasswordPath: "/changepassword"
          }
        }
    }));

## And then...

All paths not contained in publicPaths will require an access token.  The access token can be passed to a frontend client after the client is authenticated via some form of login.  For example, making a POST to /login with email and password, verifying email and password are correct, and then passing the access token to the client.  Here is some javascript for passing an access token to the client in JSON.

	app.get('/login', function(req, res) {
		var authenticate = require("authenticate");
		// Insert user auth logic here
		res.writeHead(200, {
		    "Content-Type": "application/json"
		});
		res.write(JSON.stringify({
		    "access_token": authenticate.serializeToken(client_id, user_id, extra_data) // extra data is optional
		}));
		res.end();
	})

An access token embeds data into the request.  

    req.data.user_id // user id
    req.data.client_id // A client id
    req.data.date // date access token was created
    req.data.extra_data // extra data passed in when serialized
    req.data.access_token // Access token being passed in
