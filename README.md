# Natural Resources Messaging Service Showcase

This repository contains code to showcase the Common Messaging Service (CMSG).  It demonstrates how to authenticate use the CMSG API.  We will also provide a simple UI to integrate the CMSG capabilities into an application. The technologies we use for this example are: [Node.js](https://nodejs.org/) for the backend server (calls to CMSG) and [React.js](https://reactjs.org) for the frontend UI.

### About Common Messaging Service (CMSG)

The Common Messaging Service (CMSG) is used to electronically notify a user about an event. The CMSG service is a REST web service that may be integrated into applications by developers. The Messaging service is not a user accessible service. The CMSG may only be invoked through an application.

#### Additional Resources for CMSG

[Open API definition for the CMSG in the WS02 API Store](https://apistore.nrs.gov.bc.ca/store/apis/info?provider=admin&version=v1&name=cmsg-messaging-api)

[Documentation for the CMSG API on Confluence (Login Required)](https://apps.nrs.gov.bc.ca/int/confluence/display/DO/cmsg-api)

[CMSG source code on Stash (Login Required)](https://apps.nrs.gov.bc.ca/int/stash/projects/cmsg)


## Directory Structure

    .github/                   - PR and Issue templates
    backend/                   - Node.js Application Server codebase
    frontend/                  - ReactJS Client Application codebase
    openshift/                 - OpenShift-deployment specific files
    tools/                     - Devops utilities
    └── jenkins                - Jenkins standup
    CODE-OF-CONDUCT.md         - Code of Conduct
    CONTRIBUTING.md            - Contributing Guidelines
    Jenkinsfile                - Top-level Pipeline
    Jenkinsfile.cicd           - Pull-Request Pipeline
    LICENSE                    - License

## Documentation

* [Tools Readme](tools/README.md)
* [Backend Readme](backend/README.md)
* [Front Readme](frontend/README.md)
* [Openshift Readme](openshift/README.md)


## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an [issue](https://github.com/bcgov/nr-messaging-service-showcase/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

    Copyright 2019 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
