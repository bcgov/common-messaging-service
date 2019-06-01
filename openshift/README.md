# The Messaging Service ShowCase (MSSC) Application
The Messaging Service Showcase application is quite simple.  It is a [node.js](https://nodejs.org/) API (see [backend](../backend)) self hosting a [React.js](https://reactjs.org) UI (see [frontend](../frontend)).  So, we deploy a single container that runs a node server, that will host the production React package.  We do need to prepare the React source code into a production distribution, then add it to our node release.  

For both the frontend and backend, we provide a set of npm scripts in their respective package.json files.  The most importand of which are: backend npm run start, and frontend is "npm run build".  For our CI/CD pipeline, we create a [package.json](../package.json) at the root of our repository that we can use to call any backend or frontend scripts and get our environment going.

The base image we are using will call our root package.json scripts: install, build, and start. 

`"install": "cd backend && npm install && cd ../frontend && npm install"`  

First we will call backend and frontend npm installs, this will install the necessary libraries for running our node server and for building our react site.  

`"build": "cd frontend && npm run build && rm -rf ../backend/static && mv build ../backend/static"`  

Next, we call the frontend build.  Since we used [create-react-app](https://facebook.github.io/create-react-app/docs/getting-started), the build will use react-scripts.  It will create a production ready version of our application, which we will then copy to the backend/static directory for hosting in node.  

`"start": "cd backend && npm run start"`  

Finally, we start our backend node server.  Note in [app.js](../backend/app.js) the following code to serve up the static directory (our frontend build output).  

```
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('./static'));
}
```

# OpenShift

The showcase application is deployed to OpenShift.  Here you will find documentation about how this application is built and deployed. Since this application is ready for deployment, we will also give some pointers on how to transistion from nothing in OpenShift to having ready-to-go build and deploy configurations. It is assumed that you are familiar with OpenShift commands and resources (ex. buildconfigs, deployconfigs, imagestreams, secrets, configmaps).  

Our builds and deployments are performed via Jenkins (see [tools](../tools/README.md)).  And see [Jenkinsfile](../Jenkinsfile) or [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the templates are used for building and deploying in our CI/CD pipeline.  


### Prepare the namespace/environment

There are some requirements for each namespace/environment, that are **NOT** built and deployed by the CI/CD process.  For this project, we need to ensure each namespace has a secret (credentials to connect to the Common Messaging Service - CMSG), and we need a configmap that we can use to set environment variables. 

At a minimum, you will need to have your a Service Client ID and secret, and the OAuth Url for that client/environment (basically who, where, how we authenticate).  The service client id and password will be created through [Get Token](https://github.com/bcgov/nr-get-token).  You will need to get the Common Messaging Service (CMSG) api url and the OAuth url for whichever Common Services environment you are targetting.

#### Secrets/Environment variables
The following oc command creates a new secret, cmsg-client, that will be used to set environment variables in the application.  

cmsg-client.username sets enviornment variable CMSG_CLIENT_ID
cmsg-client.password sets enviornment variable CMSG_CLIENT_SECRET

```sh
oc create secret -n <namespace> generic cmsg-client --from-literal=username=<client id> --from-literal=password=<client secret> --type=kubernetes.io/basic-auth
```

#### ConfigMap/Enviornment variables
The following oc command creates a new configmap, cmsg-config, that will be used to set environment variables in the application.  At a minimum, OAUTH\_TOKEN\_URL and CMSG\_TOP\_LEVEL\_URL **must** be set.  These will be available as environment variables matching their name (hence the Uppercase underscore convention for their names).  

```sh
oc create configmap -n <namespace> cmsg-config --from-literal=OAUTH_TOKEN_URL=<oauth token url> --from-literal=CMSG_TOP_LEVEL_URL=<common messaging api top level url>
```

#### Other configurable environment variables
The above command can be expanded to include more configuration.  For the backend code, we use the npm library: [config](https://www.npmjs.com/package/config), which will pick up any of our environment variables that are set. The cmsg-config will be passed in its entirety to the application container, so any value set in the configmap will become an environment variable.  

See [backend/config/custom-environment-variables.json](../backend/config/custom-environment-variables.json) for the complete set of variables. [backend/config/default.json](../backend/config/default.json) contains all the default values to help clarify usage.   


## Templates
We have two templates: one for the build and one for the deployment.  The deployment (app.dc.yaml) will add the secret (cmsg-client) and configmap (cmsg-config) into the container as environment variables.  See [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the templates are used for building and deploying in our CI/CD pipeline.  

### Build Template - app.bc.yaml
The build template will produce 2 imagestreams (a base image and our application image) and buildconfig.  We then start a new build using the buildconfig.   

The template expects 4 parameters:  

* REPO\_NAME - name of the repository  
* JOB\_NAME - this will be master or a pull request (ex. pr-3)  
* SOURCE\_REPO\_URL - complete url to the repo (including .git)  
* SOURCE\_REPO\_REF - master or pull request ref (ex. pull/3/head)  

The following command will demonstrate how one could call the template.  

```sh
oc -n idcqvl-dev process -f openshift/app.bc.yaml -p REPO_NAME=nr-messaging-service-showcase -p JOB_NAME=master -p SOURCE_REPO_URL=https://github.com/bcgov/nr-messaging-service-showcase.git -p SOURCE_REPO_REF=master -o yaml | oc -n idcqvl-dev create -f - 
```

The followup to this would be to actually build the images.  The basic process is to get a node docker image, overlay the output of our build (frontend and backend) and output a new image.      

```sh
oc -n idcqvl-dev start-build nr-messaging-service-showcase-app-master --follow
```

And we need to tag this image, so that the deploymentconfig will know which one to use. Note that we tag it with the same value we used for JOB\_NAME.      

```sh
oc -n idcqvl-dev tag nr-messaging-service-showcase-app:latest nr-messaging-service-showcase-app:master
```

### Deployment Template - app.dc.yaml
The deployment template will create a deploymentconfig, service, and a route.  We take the build image and deploy it.  It will add the environment variables from our secret and configmap to the container, spin it up, create a service to access the container, then expose that service as a publicly accessible route.  

The template expects 4 parameters:  

* REPO\_NAME - name of the repository  
* JOB\_NAME - this will be master or a pull request (ex. pr-3)  
* NAMESPACE - which namespace/"environment" are we deploying to? dev, test, prod?  
* APP\_NAME - short name for the application  
* HOST\_ROUTE - used to set the publicly accessible url  

The following command will demonstrate how one could call the template.  This will use the image that has been tagged with the JOB\_NAME

```sh
oc -n idcqvl-dev process -f openshift/app.dc.yaml -p REPO_NAME=nr-messaging-service-showcase -p JOB_NAME=master -p NAMESPACE=idcqvl-dev -p APP_NAME=mssc -p HOST_ROUTE=mssc-master-idcqvl-dev.pathfinder.gov.bc.ca -o yaml | oc -n idcqvl-dev apply -f - 
```

Due to the triggers that are set in the deploymentconfig, the deployment will begin.  To deploy manually, use the following command.  

```sh
oc -n idcqvl-dev rollout latest dc/mssc-app-master
```

