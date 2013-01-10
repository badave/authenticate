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

All paths not contained in publicPaths will require an access token.  The access token can be passed to a frontend client after the client is authenticated via some form of login.  For example, making a POST to /login with email and password, verifying email and password are correct, and then passing the access token to the client.  Here is the JSON for an access token being passed to the client.

    var authenticate = require("authenticate");
    {
        "access_token": authenticate.serializeToken(client_id, user_id)
    }
