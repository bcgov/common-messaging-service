# Natural Resources Messaging Service Showcase

This repository contains code to provide a simple UI for the [NR Email Microservice](https://github.com/bcgov/nr-email-microservice) and the Common Hosted Email Service ([CHES](https://github.com/bcgov/common-hosted-email-service.git)).  The Email Microservice provides an example implementation for use of the Common Messaging Service API (CMSG).  The [ches-backend](ches-backend/README.md) provides an example implementation for use of the CHES API.  We use [React.js](https://reactjs.org) for the frontend UI.

To learn more about **Common Services** available including [hosted email](https://github.com/bcgov/common-hosted-email-service), [messaging](https://github.com/bcgov/nr-messaging-service-showcase) and [document generation](https://github.com/bcgov/document-generation-showcase) and to see them in action, visit the [Common Services Showcase](https://bcgov.github.io/common-service-showcase/) page.

## Directory Structure

    .github/                   - PR and Issue templates
    ches-backend/              - Node JS backend for calling CHES API
    frontend/                  - ReactJS Client Application codebase
    openshift/                 - OpenShift-deployment specific files
    reverse-proxy/             - Reverse Proxy code
    CODE-OF-CONDUCT.md         - Code of Conduct
    CONTRIBUTING.md            - Contributing Guidelines
    Jenkinsfile                - Top-level Pipeline
    Jenkinsfile.cicd           - Pull-Request Pipeline
    LICENSE                    - License
    sonar-project.properties   - SonarQube configuration properties

## Documentation

* [Common Hosted Email Service (CHES)](https://github.com/bcgov/common-hosted-email-service/blob/master/README.md)
* [Email Microservice](https://github.com/bcgov/nr-email-microservice/blob/master/README.md)
* [CMSG Overview](https://github.com/bcgov/nr-email-microservice/blob/master/docs/overview.md)
* [CMSG Developer Guide](https://github.com/bcgov/nr-email-microservice/blob/master/docs/developer-guide.md)
* [Front Readme](frontend/README.md)
* [Reverse Proxy Readme](reverse-proxy/README.md)
* [Openshift Readme](openshift/README.md)
* [DevOps Tools Readme](https://github.com/bcgov/nr-showcase-devops-tools/blob/master/tools/README.md)
* [Get Token Wiki](https://github.com/bcgov/nr-get-token/wiki)
* [Showcase Team Roadmap](https://github.com/bcgov/nr-get-token/wiki/Product-Roadmap)


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
