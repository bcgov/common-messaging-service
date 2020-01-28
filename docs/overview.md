---
description: MSSC demonstrates the capabilities of the Common Hosted Email Service, which provides applications with email messaging functionality. To learn more see [API Usage](https://github.com/bcgov/common-hosted-email-service/blob/master/app/README.md#api-usage) documentation.
title: About the Messaging Common Service
tags:
- nr
- nrm
- common components
---


## About the Messaging Common Service  

### Common Service Elements  

1. **Showcase Application**: Provides a demonstration of the capabilities of a common service. In this case MSSC demonstrates how an application can have messaging functionality by calling an API.
2. **Self-Service Documentation**: Provide access to documentation that enables a software developer or end user to determine it is fit for their needs, have a step by step set of instructions for implementing it, and be able to complete the implementation without direct interaction with the team that built the service the API.
3. **Example Code**: Quite often will be told to go check out the code repository of another team who may be doing something similar.  Digging through someone else's code looking for the parts that are applicable to the feature that you want to implement is a challenge to say the least.  In the same way even though we may have built a showcase application, telling a development team to look at the code of the showcase application would leave them wading through a lot of unecessary code.   So example code is the slimmed down bare minimum required to implement a feature, and if done right the code examples will be written in a few different language that team may likely use for that type of feature.

## Common Service Showcase Applications

Showcase applications are intended to be very simple in how they are designed. The aim is to build valuable features into API endpoints called on by the showcase application.

## Capabilities

### Common Hosted Email Service (CHES)

- Check Status of the API health api endpoint
- Email Sending api end point
- Template mail merge and email sending api end point
- Template mail merge validation & preview api endpoint

### Messaging Service ShowCase (MSSC)

- Converts xlsx or csv into a valid JSON format for CHES template endpoints
- Converts email attachments to base64 encoded
- Email form with field validation (for CHES and CMSG)
- Mail merge form with field validation
- HTML editor
- Attachment Dropzone
- Mail merge preview
- Template creation assistance with a list variables
- Keycloak login and roles

## Source Code & Related Projects

GitHub: <https://github.com/topics/nr-showcase>

- [bcgov](https://github.com/bcgov) / [common-hosted-email-service](https://github.com/bcgov/common-hosted-email-service)
- [bcgov](https://github.com/bcgov) / [nr-messaging-service-showcase](https://github.com/bcgov/nr-messaging-service-showcase)
- [bcgov](https://github.com/bcgov) / [nr-email-microservice](https://github.com/bcgov/nr-email-microservice)

## Usage

### Sample Email Submission

#### Latest release (BETA)

<https://mssc.pathfinder.gov.bc.ca/mssc/app/ches>

- Common Hosted Email Service (CHES)

**Previous implementation using WSO2, WebADE, and CMSG-Messaging-API **

<https://mssc.pathfinder.gov.bc.ca/mssc/app/cmsg>

### Sample Email Merge

#### Latest Release (BETA)

<https://mssc.pathfinder.gov.bc.ca/mssc/app/merge>

- Common Hosted Email Service (CHES) Email Merge

### Request API Access

A software development team can request access to use an application called GETOK ([see Readme](https://github.com/bcgov/nr-get-token)) to create and update the required Keycloak Client for the Common Hosted Hosted Email Service by emailing   to [NR.CommonServiceShowcase@gov.bc.ca](mailto:NR.CommonServiceShowcase@gov.bc.ca?subject=CHES%20Access%20Request).

### API Specifications

- [CHES API v1.0.0](https://ches-master-9f0fbe-prod.pathfinder.gov.bc.ca/api/v1/docs)
- [nr-email-microservice API Spec](https://github.com/bcgov/nr-email-microservice/blob/master/api/msgService/v1.api-spec.yaml): This API is a wrapper over Common Messaging Services API (CMSG) v1 published at <https://apistore.nrs.gov.bc.ca/store/apis/info?name=cmsg-messaging-api&version=v1>

## Development

### Example Implementation

1. For an opinionated implementation calling a hosted api using NodeJS, Axios, Async & Await

   > [MSSC CHES-Backend](https://raw.githubusercontent.com/bcgov/nr-messaging-service-showcase/master/ches-backend/chesService/chesService.js): CHES (Common Hosted Email Service) Backend is a simple node.js wrapper around the [Common Hosted Email Service](https://github.com/bcgov/common-hosted-email-service.git). The wrapper is a simple pass through to the service, its main purpose is to hide the service client credentials from the frontend.

2. For a microservice example

   > Any application can use CMSG by installing and running an instance of the [nr-email-microservice](https://github.com/bcgov/nr-email-microservice) which calls the API for Common Messaging Service's (CMSG). The *nr-email-microservice* illustrates how to call the CMSG API, and shows how a team can easily stand up their own CMSG service in OpenShift.
   >
   > Your instance of nr-email-microservice will require a WebADE Service Client with appropriate CMSG scopes
   >
   > A software development team can request access to use an application called GETOK ([see Readme](https://github.com/bcgov/nr-get-token)) to create and update the required WebADE Service Client for CMSG by emailing NR.CommonServiceShowcase@gov.bc.ca.

### Developer Guide

One way of using the messaging service is to run an instance of it in your own project. This documentation describes how to set it up and run it:  <https://bcgov.github.io/common-hosted-email-service/app/>
