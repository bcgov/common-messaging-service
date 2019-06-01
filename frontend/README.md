# The Messaging Service ShowCase (MSSC) Application
The Messaging Service Showcase application is quite simple.  It is a [node.js](https://nodejs.org/) API (see [backend](./README.md)) self hosting a [React.js](https://reactjs.org) UI (see [frontend](../frontend)). 

## Frontend
The frontend is a React.js application which provides an example UI for calling the Common Messaging Service. At this time, the only messaging transport is email.  This application demonstrates how to send both plain text emails and html emails to multiple recipients and includes support for attachments.  

Frontend is a React.js application that was created using [create-react-app](https://facebook.github.io/create-react-app/docs/getting-started).  

### Notes
Upon startup, we immediately call the mssc api healthcheck at /mssc/v1/health.  This will check to see if the service client is configured correctly and has the expected permissions.  It will also check to see if the Common Messaging Service is up and available.  As part of the health check, we consume configuration for attachments and sender.  If the health check fails, or if the underlying service client does not have permissions to send, then the email form is disabled.

When sending an email, we first upload attachments (if provided) at /mssc/v1/uploads, then call to send the mail (passing along the uploaded file information) at /mssc/v1/email.  

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

``` sh
npm run build
```
