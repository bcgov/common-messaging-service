# configure each environment

For *every* environment/namespace, you will need to set some configuration values and secrets.  These will be picked up in the deployments as environment variables for the application.

You will need to have your Common Messaging Service Client ID and secret, and the OAuth Url for that client/environment (basically who, where, how we authenticate).

You will also need the urls for the Common Messaging API - the top level (root or base url) and the create/send message url.

```sh
oc create secret -n <namespace> generic cmsg-client --from-literal=username=<client id> --from-literal=password=<client secret> --type=kubernetes.io/basic-auth

oc create configmap -n <namespace> cmsg-config --from-literal=OAUTH_TOKEN_URL=<oauth token url> --from-literal=CMSG_TOP_LEVEL_URL=<common messaging api top level url>
```

# Generating Build Configuration Templates

You will likely not need to run the new template generation sections as that the base templates should already be in git. You should be able to skip those steps.

## New Node Builder Template

*If you are creating a new build configuration template, you will likely use the following commands:*

```sh
oc new-build -n z208i4-tools registry.access.redhat.com/rhscl/nodejs-8-rhel7:latest~https://github.com/bcgov/nr-messaging-service-showcase.git#master --context-dir=frontend --name=nr-messaging-service-showcase-frontend --dry-run -o yaml > openshift/frontend.bc.yaml
sed -i '' -e 's/kind: List/kind: Template/g' openshift/frontend.bc.yaml
sed -i '' -e 's/items:/objects:/g' openshift/frontend.bc.yaml
```

*Note: You need to remove any secrets and credentials that are auto-inserted into the frontend.bc.yaml file.*

## Process and Apply Builder Template

```sh
oc process -n z208i4-tools -f openshift/frontend.bc.yaml -o yaml | oc create -n z208i4-tools -f -
```

## Tag the latest build and migrate it to the correct project namespace

```sh
oc tag -n z208i4-dev z208i4-tools/frontend:latest frontend:dev --reference-policy=local
```

## Create new Application Deployment

*If you are creating a new application deployment template, you will likely use the following commands:*

```sh
oc new-app -n z208i4-dev --image-stream=frontend:dev --name=get-token-frontend --dry-run -o yaml > openshift/frontend.dc.yaml
```

## Process and Apply the Application Deployment

```sh
oc process -n z208i4-dev -f openshift/frontend.dc.yaml -o yaml | oc create -n z208i4-dev -f -
oc create -n z208i4-dev route edge frontend --service=frontend --port=2015-tcp
```

## Templating Work in Progress

The above commands will need to be templated. We can expect something like the following in part of the commands:

```sh
'--name=${NAME}${SUFFIX}' '--context-dir=${GIT_DIR}'
```
