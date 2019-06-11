# The Messaging Service ShowCase (MSSC) Application
The Messaging Service Showcase application is quite simple.  It is a [node.js](https://nodejs.org/) API (see [backend](../backend/README.md)) and a [React.js](https://reactjs.org) UI (see [frontend](./README.md)).  In production, both the backend and frontend are placed behind a reverse proxy (see [reverse-proxy](../reverse-proxy/README.md)).

## Frontend
The frontend is a React.js application which provides an example UI for calling the Common Messaging Service. At this time, the only messaging transport is email.  This application demonstrates how to send both plain text emails and html emails to multiple recipients and includes support for attachments.

Frontend is a React.js application that was created using [create-react-app](https://facebook.github.io/create-react-app/docs/getting-started).

### Reverse Proxy and Caddy
In production, the frontend is behind a [reverse proxy](../reverse-proxy/README.md).  This allows us to easily serve the application under any path structure we choose.  To acheive this portability, we set the homepage to "." in [package.json](package.json).  The frontend itself (once it has been built and minified for production), is served in it's own container on [Caddy](https://caddyserver.com).  See [Caddyfile](Caddyfile).

In our Caddyfile, we expect certain environment variables:
* UI_SERVICE_PORT   - exposed port to access caddy server ex. 2015
* PATH_ROOT         - url path  ex. localhost:2015/mypath
* STATIC_FILES_PATH - physical path to the files ex. build

### Application Environment Variables
Environment variables that we need can be set for developers in a root file .env.development.local - this should be ignored for our git commits.  Or they can be set at the command line.
We need to tell the build what path we expect to be served at (ex. /pr-5 for pull requests, /mssc for production), and that will be used to hit our relative backend api path.

* REACT_APP_PATH_ROOT


### Notes
Upon startup, we immediately call the mssc api healthcheck at /api/v1/health.  This will check to see if the service client is configured correctly and has the expected permissions.  It will also check to see if the Common Messaging Service is up and available.  As part of the health check, we consume configuration for attachments and sender.  If the health check fails, or if the underlying service client does not have permissions to send, then the email form is disabled.

When sending an email, we first upload attachments (if provided) at /api/v1/uploads, then call to send the mail (passing along the uploaded file information) at /api/v1/email.

The form will be validated before we send.  We do not verify that email addresses are valid and reachable.

If the message is delivered to CMSG api, we will consider that a success.  This does not mean that CMSG has successfully delivered the email to the recipients, only that CMSG has received the request to deliver email, and that the request is valid.

#### tinymce
We have used [tinymce](https://www.tiny.cloud/features) to provide a rich text editor for our html emails.  We use the installed features from node_modules, we do not use tinymce cloud, nor do we explicitly host the tinymce javascript, css, themes etc.  See [src/htmlText](/src/htmlText) for more.

#### attachments (react-dropzone)
We use [react-dropzone](https://react-dropzone.netlify.com) for handling attachments.  This allows drag-and-drop or file dialog selection.  We have arbitrarily limited the number of attachments (3) and their size (5MiB).  We have also limited the type to pdf as this is currently the only supported file type in Common Message Service.  These are configured in the backend and we receive the configuration during our health check.

Only valid files will be accepted, and the UI does provide a means to remove attachments.  A warning will appear if all the files dropped or selected fail to meet the configured criteria.



## Project scripts

Assumption is you have installed node 10.15.3 and npm 6.4.1.

``` sh
cd frontend
npm install
```

### Run the application locally
Note that by default, we are running on localhost:3000.  By default, a local instance of the [backend](../backend) will run on localhost:3001.  In our package.json, we set a proxy to localhost:3001.  This means that we can run frontend and backend locally in development mode to debug both sides. All http calls that would go to our application root will proxy to the backend running on localhost:3001.

``` sh
npm run start
```

### Build the application
For production releases, we need to build the application.  Build will use react-scripts and produce a production ready distribution at frontend/build.
It is very important that we include the environment variable **REACT_APP_PATH_ROOT** before building.  This will set the path we expect to be hosted at. (ex. /pr-5 or /mssc).

``` sh
export REACT_APP_PATH_ROOT=/pr-5
npm run build
```

### Build and run in Caddy locally
The following will show how one can build the production code and run it locally in Caddy.
Generally, REACT_APP_PATH_ROOT is the same as PATH_ROOT, but for serving locally, the api is hosted elsewhere.  This example still won't fully work, as the frontend is production and the backend is on another server and not CORS enabled.  However, you should see the app come up with and make a request to the api as specified in the REACT_APP_PATH_ROOT.  See [reverse-proxy](../reverse-proxy) for a better example.

``` sh
cd frontend

export REACT_APP_PATH_ROOT=http://localhost:3001
npm run build

export PATH_ROOT=/pr-5
export UI_SERVICE_PORT=2016
export STATIC_FILES_PATH=./build

caddy -quic
```



