#!groovy
import bcgov.GitHubHelper

// --------------------
// Declarative Pipeline
// --------------------
pipeline {
  agent any

  environment {
    // Enable pipeline verbose debug output if greater than 0
    DEBUG_OUTPUT = 'false'

    // Enable this to rebuild everything
    REBUILD_BASE_IMAGES = 'false'

    // Get projects/namespaces from config maps
    DEV_PROJECT = new File('/var/run/configs/ns/project.dev').getText('UTF-8').trim()
    TEST_PROJECT = new File('/var/run/configs/ns/project.test').getText('UTF-8').trim()
    PROD_PROJECT = new File('/var/run/configs/ns/project.prod').getText('UTF-8').trim()
    TOOLS_PROJECT = new File('/var/run/configs/ns/project.tools').getText('UTF-8').trim()

    // Get application config from config maps
    REPO_OWNER = new File('/var/run/configs/jobs/repo.owner').getText('UTF-8').trim()
    REPO_NAME = new File('/var/run/configs/jobs/repo.name').getText('UTF-8').trim()
    APP_NAME = new File('/var/run/configs/jobs/app.name').getText('UTF-8').trim()
    APP_DOMAIN = new File('/var/run/configs/jobs/app.domain').getText('UTF-8').trim()

    // JOB_NAME should be the pull request/branch identifier (i.e. 'pr-5')
    JOB_NAME = JOB_BASE_NAME.toLowerCase()


    // SOURCE_REPO_* references git repository resources
    SOURCE_REPO_RAW = "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master"
    SOURCE_REPO_REF = 'master'
    SOURCE_REPO_URL = "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

    // HOST_ROUTE is the full domain route, without a path (ie. 'appname-dev.pathfinder.gov.bc.ca')
    DEV_HOST = "${APP_NAME}-dev.${APP_DOMAIN}"
    TEST_HOST = "${APP_NAME}-test.${APP_DOMAIN}"
    PROD_HOST = "${APP_NAME}.${APP_DOMAIN}"
    // will be added to the HOST_ROUTE
    PATH_ROOT = "/${APP_NAME}"

    // for the email microservice backend
    EMAIL_MICROSRV_REF = '1.1.0'
    EMAIL_MICROSRV_BC = "https://raw.githubusercontent.com/bcgov/nr-email-microservice/${EMAIL_MICROSRV_REF}/openshift/api.bc.yaml"
    EMAIL_MICROSRV_DC = "https://raw.githubusercontent.com/bcgov/nr-email-microservice/${EMAIL_MICROSRV_REF}/openshift/api.dc.user-auth.yaml"


    EMAIL_MICROSRV_APP_LABEL = "${APP_NAME}-${JOB_NAME}"
    EMAIL_MICROSRV_IMAGE_NAME = "${APP_NAME}-${JOB_NAME}-backend"
  }


  stages {
    stage('Init') {
      steps {
        notifyStageStatus('Init', 'PENDING')

        // Cancel any running builds in progress
        timeout(5) {
          echo "Cancelling previous ${APP_NAME}-${JOB_NAME} builds in progress..."
          abortAllPreviousBuildInProgress(currentBuild)
        }

        script {
          if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
            // Force OpenShift Plugin directives to be verbose
            openshift.logLevel(1)

            // Print all environment variables
            echo 'DEBUG - All pipeline environment variables:'
            echo sh(returnStdout: true, script: 'env')
          }

        }
      }
      post {
        success {
          echo 'Init successful'
          notifyStageStatus('Init', 'SUCCESS')
        }
        unsuccessful {
          echo 'Init failed'
          notifyStageStatus('Init', 'FAILURE')
        }
      }
    }

    stage('NpmImages') {
      steps {
          notifyStageStatus('NpmImages', 'PENDING')
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                }

                if (rebuildFrontendNpm()) {
                  echo "Changes to frontend NPM, update and build..."
                  echo "Processing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend-npm..."
                  def bcFrontendNpmTemplate = openshift.process('-f',
                    'openshift/frontend-npm.bc.yaml',
                    "REPO_NAME=${REPO_NAME}",
                    "JOB_NAME=${JOB_NAME}",
                    "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                    "SOURCE_REPO_REF=${SOURCE_REPO_REF}",
                    "APP_NAME=${APP_NAME}"
                  )

                  echo "Building ImageStream ${APP_NAME}-${JOB_NAME}-frontend-npm..."
                  openshift.apply(bcFrontendNpmTemplate).narrow('bc').startBuild('-w').logs('-f')

                } else {
                  echo "frontend npm up to date."
                }

              }
            }
          }
      }
      post {
        success {
          echo 'NpmImages successful'
          notifyStageStatus('NpmImages', 'SUCCESS')
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcFrontendNpmConfig = openshift.selector('bc', "${APP_NAME}-${JOB_NAME}-frontend-npm")

                  if(bcFrontendNpmConfig.exists()) {
                    echo "Removing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend-npm..."
                    bcFrontendNpmConfig.delete()
                  }
                }
              }
            }
          }
        }
        unsuccessful {
          echo 'NpmImages failed'
          notifyStageStatus('NpmImages', 'FAILURE')
        }
      }
    }

    stage('BuilderImages') {
      steps {
          notifyStageStatus('BuilderImages', 'PENDING')
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                }

                if (rebuildFrontendBuilder()) {
                  echo "Changes to frontend builder, update and build..."
                  echo "Processing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend-builder..."
                  def bcFrontendBuilderTemplate = openshift.process('-f',
                    'openshift/frontend-builder.bc.yaml',
                    "REPO_NAME=${REPO_NAME}",
                    "JOB_NAME=${JOB_NAME}",
                    "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                    "SOURCE_REPO_REF=${SOURCE_REPO_REF}",
                    "APP_NAME=${APP_NAME}",
                    "PATH_ROOT=${PATH_ROOT}",
                    "NAMESPACE=${TOOLS_PROJECT}"
                  )

                  echo "Building ImageStream ${APP_NAME}-${JOB_NAME}-frontend-builder..."
                  openshift.apply(bcFrontendBuilderTemplate).narrow('bc').startBuild('-w').logs('-f')

                } else {
                  echo "frontend/* and builder image up to date."
                }
              }
            }
          }
      }
      post {
        success {
          echo 'BuilderImages successful'
          notifyStageStatus('BuilderImages', 'SUCCESS')
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcFrontendBuilderConfig = openshift.selector('bc', "${APP_NAME}-${JOB_NAME}-frontend-builder")

                  if(bcFrontendBuilderConfig.exists()) {
                    echo "Removing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend-builder..."
                    bcFrontendBuilderConfig.delete()
                  }
                }
              }
            }
          }
        }
        unsuccessful {
          echo 'BuilderImages'
          notifyStageStatus('BuilderImages', 'FAILURE')
        }
      }
    }

    stage('RuntimeImages') {
      steps {
        notifyStageStatus('RuntimeImages', 'PENDING')
        script {
          openshift.withCluster() {
            openshift.withProject(TOOLS_PROJECT) {
              if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                echo "DEBUG - Using project: ${openshift.project()}"
              }

              // for whatever reason, watching related builds is not reliable.
              // the watches don't always close even when build is complete.
              //  openshift.selector("bc", "${APP_NAME}-${JOB_NAME}-backend").related('builds').untilEach(1) {
              //    echo "build: ${it.name()}, status.phase: ${it.object().status.phase}"
              //    return (it.object().status.phase == "Complete")
              //  }
              //
              // so build out in parallel with explicit wait
              echo "Processing BuildConfig ${APP_NAME}-${JOB_NAME}-backend..."
              def bcBackendTemplate = openshift.process('-f',
                "${EMAIL_MICROSRV_BC}",
                "SOURCE_REPO_REF=${EMAIL_MICROSRV_REF}",
                "APP_LABEL=${EMAIL_MICROSRV_APP_LABEL}",
                "IMAGE_NAME=${EMAIL_MICROSRV_IMAGE_NAME}"
              )

              echo "Processing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend..."
              def bcFrontendTemplate = openshift.process('-f',
                'openshift/frontend.bc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                "SOURCE_REPO_REF=${SOURCE_REPO_REF}",
                "APP_NAME=${APP_NAME}",
                "NAMESPACE=${TOOLS_PROJECT}"
              )

              echo "Processing BuildConfig ${APP_NAME}-${JOB_NAME}-reverse-proxy..."
              def bcReverseProxyTemplate = openshift.process('-f',
                'openshift/reverse-proxy.bc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                "SOURCE_REPO_REF=${SOURCE_REPO_REF}",
                "APP_NAME=${APP_NAME}"
              )

              timeout(10) {
                parallel(
                  Backend: {
                    try {
                      notifyStageStatus('Backend', 'PENDING')

                      echo "Building ImageStream ${APP_NAME}-${JOB_NAME}-backend..."
                      openshift.apply(bcBackendTemplate).narrow('bc').startBuild('-w').logs('-f')

                      echo 'Backend build successful'
                      notifyStageStatus('Backend', 'SUCCESS')
                    } catch (e) {
                      echo 'Backend build failed'
                      notifyStageStatus('Backend', 'FAILURE')
                      throw e
                    }
                  },

                  Frontend: {
                    try {
                      notifyStageStatus('Frontend', 'PENDING')

                      echo "Building ImageStream ${APP_NAME}-${JOB_NAME}-frontend..."
                      openshift.apply(bcFrontendTemplate).narrow('bc').startBuild('-w').logs('-f')

                      echo 'Frontend build successful'
                      notifyStageStatus('Frontend', 'SUCCESS')
                    } catch (e) {
                      echo 'Frontend build failed'
                      notifyStageStatus('Frontend', 'FAILURE')
                      throw e
                    }
                  },

                  ReverseProxy: {
                    try {
                      notifyStageStatus('ReverseProxy', 'PENDING')

                      echo "Building ImageStream ${APP_NAME}-${JOB_NAME}-reverse-proxy..."
                      openshift.apply(bcReverseProxyTemplate).narrow('bc').startBuild('-w').logs('-f')

                      echo 'ReverseProxy build successful'
                      notifyStageStatus('ReverseProxy', 'SUCCESS')
                    } catch (e) {
                      echo 'ReverseProxy build failed'
                      notifyStageStatus('ReverseProxy', 'FAILURE')
                      throw e
                    }
                  }
                )
              }
            }
          }
        }
      }
      post {
        success {
          echo 'RuntimeImages Success'
          notifyStageStatus('RuntimeImages', 'SUCCESS')
          echo 'Cleanup BuildConfigs...'
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcBackendConfig = openshift.selector('bc', "${APP_NAME}-${JOB_NAME}-backend")
                  def bcFrontendConfig = openshift.selector('bc', "${APP_NAME}-${JOB_NAME}-frontend")
                  def bcReverseProxyConfig = openshift.selector('bc', "${APP_NAME}-${JOB_NAME}-reverse-proxy")

                  if(bcBackendConfig.exists()) {
                    echo "Removing BuildConfig ${APP_NAME}-${JOB_NAME}-backend..."
                    bcBackendConfig.delete()
                  }
                  if(bcFrontendConfig.exists()) {
                    echo "Removing BuildConfig ${APP_NAME}-${JOB_NAME}-frontend..."
                    bcFrontendConfig.delete()
                  }
                  if(bcReverseProxyConfig.exists()) {
                    echo "Removing BuildConfig ${APP_NAME}-${JOB_NAME}-reverse-proxy..."
                    bcReverseProxyConfig.delete()
                  }
                }
              }
            }
          }
        }
        unsuccessful {
          echo 'RuntimeImages failed'
          notifyStageStatus('RuntimeImages', 'FAILURE')
        }
      }
    }

    stage('Deploy - Dev') {
      steps {
        script {
          deployStage('Dev', DEV_PROJECT, DEV_HOST, PATH_ROOT)
        }
      }
      post {
        success {
          createDeploymentStatus(DEV_PROJECT, 'SUCCESS', DEV_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Dev', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(DEV_PROJECT, 'FAILURE', DEV_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Dev', 'FAILURE')
        }
      }
    }

    stage('Deploy - Test') {
      steps {
        script {
          deployStage('Test', TEST_PROJECT, TEST_HOST, PATH_ROOT)
        }
      }
      post {
        success {
          createDeploymentStatus(TEST_PROJECT, 'SUCCESS', TEST_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Test', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(TEST_PROJECT, 'FAILURE', TEST_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Test', 'FAILURE')
        }
      }
    }

    stage('Deploy - Prod') {
      steps {
        script {
          deployStage('Prod', PROD_PROJECT, PROD_HOST, PATH_ROOT)
        }
      }
      post {
        success {
          createDeploymentStatus(PROD_PROJECT, 'SUCCESS', PROD_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Prod', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(PROD_PROJECT, 'FAILURE', PROD_HOST, PATH_ROOT)
          notifyStageStatus('Deploy - Prod', 'FAILURE')
        }
      }
    }
  }
}


// ------------------
// Pipeline Functions
// ------------------

// Parameterized deploy stage
def deployStage(String stageEnv, String projectEnv, String hostEnv, String pathEnv) {
  if (!stageEnv.equalsIgnoreCase('Dev')) {
    input("Deploy to ${projectEnv}?")
  }

  notifyStageStatus("Deploy - ${stageEnv}", 'PENDING')

  openshift.withCluster() {
    openshift.withProject(projectEnv) {
      if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
        echo "DEBUG - Using project: ${openshift.project()}"
      }

      echo "Checking for ConfigMaps and Secrets in project ${openshift.project()}..."
      if(!(openshift.selector('cm', 'cmsg-config').exists() &&
          openshift.selector('secret', 'cmsg-client').exists() &&
          openshift.selector('cm', 'email-microsrv-oidc').exists() &&
          openshift.selector('secret', 'email-microsrv-oidc-client').exists())) {
        echo 'Some ConfigMaps and/or Secrets are missing. Please consult the openshift readme for details.'
        throw e
      }

      // "move" images from tools project to our target environment and deploy from there...
      echo "Tagging Image ${APP_NAME}-${JOB_NAME}-backend:latest..."
      openshift.tag("${TOOLS_PROJECT}/${APP_NAME}-${JOB_NAME}-backend:latest", "${APP_NAME}-${JOB_NAME}-backend:latest")

      echo "Tagging Image ${APP_NAME}-${JOB_NAME}-frontend:latest..."
      openshift.tag("${TOOLS_PROJECT}/${APP_NAME}-${JOB_NAME}-frontend:latest", "${APP_NAME}-${JOB_NAME}-frontend:latest")

      echo "Tagging Image ${APP_NAME}-${JOB_NAME}-reverse-proxy:latest..."
      openshift.tag("${TOOLS_PROJECT}/${APP_NAME}-${JOB_NAME}-reverse-proxy:latest", "${APP_NAME}-${JOB_NAME}-reverse-proxy:latest")

      parallel(
        Backend: {
          echo "Processing DeploymentConfig ${APP_NAME}-${JOB_NAME}-backend..."
          def dcBackendTemplate = openshift.process('-f',
            "${EMAIL_MICROSRV_DC}",
            "APP_LABEL=${EMAIL_MICROSRV_APP_LABEL}",
            "IMAGE_NAME=${EMAIL_MICROSRV_IMAGE_NAME}",
            "NAMESPACE=${projectEnv}",
            'SECRET_NAME=cmsg-client',
            'CONFIG_MAP_NAME=cmsg-config',
            'OIDC_SECRET_NAME=email-microsrv-oidc-client',
            'OIDC_CONFIG_MAP_NAME=email-microsrv-oidc',
            'CMSG_SENDER=NR.CommonServiceShowcase@gov.bc.ca',
            "HOST_URL=https://${hostEnv}${pathEnv}",
            'CPU_REQUEST=100m',
            'MEMORY_REQUEST=256Mi',
            'CPU_LIMIT=500m',
            'MEMORY_LIMIT=1Gi'
          )
          echo "Applying Deployment ${APP_NAME}-${JOB_NAME}-backend..."
          createDeploymentStatus(projectEnv, 'PENDING', hostEnv, pathEnv)
          def dcBackend = openshift.apply(dcBackendTemplate).narrow('dc')
          timeout (time: 10, unit: 'MINUTES') {
           try {
              def bmf = dcBackend.rollout()
              bmf.latest()
              bmf.status()
            } catch (e) {
              // deployments are unreliable to track when rolling and multiple pods...
              // infrequently throw an error that deploy is already happening.
              // when you process a deployconfig without triggers, openshift will still create a Config change trigger, so timing is everything
              echo "Backend error on rollout: ${e}"
            }
          }
        },

        Frontend: {
          echo "Processing DeploymentConfig ${APP_NAME}-${JOB_NAME}-frontend..."
          def dcFrontendTemplate = openshift.process('-f',
            'openshift/frontend.dc.yaml',
            "REPO_NAME=${REPO_NAME}",
            "JOB_NAME=${JOB_NAME}",
            "NAMESPACE=${projectEnv}",
            "APP_NAME=${APP_NAME}",
            "PATH_ROOT=${pathEnv}",
            "HOST_URL=https://${hostEnv}${pathEnv}",
            'OIDC_SECRET_NAME=email-microsrv-oidc-client',
            'OIDC_CONFIG_MAP_NAME=email-microsrv-oidc'
          )
          echo "Applying Deployment ${APP_NAME}-${JOB_NAME}-frontend..."
          createDeploymentStatus(projectEnv, 'PENDING', hostEnv, pathEnv)
          def dcFrontend = openshift.apply(dcFrontendTemplate).narrow('dc')
          timeout (time: 10, unit: 'MINUTES') {
           try {
              def rmf = dcFrontend.rollout()
              rmf.latest()
              rmf.status()
            } catch (e) {
              // deployments are unreliable to track when rolling and multiple pods...
              // infrequently throw an error that deploy is already happening.
              // when you process a deployconfig without triggers, openshift will still create a Config change trigger, so timing is everything
              echo "Frontend error on rollout: ${e}"
            }
          }
        },

        ReverseProxy: {
          echo "Processing DeploymentConfig ${APP_NAME}-${JOB_NAME}-reverse-proxy..."
          def dcProxyTemplate = openshift.process('-f',
            'openshift/reverse-proxy.dc.yaml',
            "REPO_NAME=${REPO_NAME}",
            "JOB_NAME=${JOB_NAME}",
            "NAMESPACE=${projectEnv}",
            "APP_NAME=${APP_NAME}",
            "HOST_ROUTE=${hostEnv}",
            "PATH_ROOT=${pathEnv}"
          )
          echo "Applying Deployment ${APP_NAME}-${JOB_NAME}-reverse-proxy..."
          createDeploymentStatus(projectEnv, 'PENDING', hostEnv, pathEnv)
          def dcProxy = openshift.apply(dcProxyTemplate).narrow('dc')
          timeout (time: 10, unit: 'MINUTES') {
            try {
              def pmf = dcProxy.rollout()
              pmf.latest()
              pmf.status()
            } catch (e) {
              // deployments are unreliable to track when rolling and multiple pods...
              // infrequently throw an error that deploy is already happening.
              // when you process a deployconfig without triggers, openshift will still create a Config change trigger, so timing is everything
             echo "Proxy error on rollout: ${e}"
            }

          }
        }
      )
    }
  }
}

// --------------------
// Supporting Functions
// --------------------

// Notify stage status and pass to Jenkins-GitHub library
def notifyStageStatus(String name, String status) {
  def sha1 = GIT_COMMIT
  if(JOB_BASE_NAME.startsWith('PR-')) {
    sha1 = GitHubHelper.getPullRequestLastCommitId(this)
  }

  GitHubHelper.createCommitStatus(
    this, sha1, status, BUILD_URL, '', "Stage: ${name}"
  )
}

// Create deployment status and pass to Jenkins-GitHub library
def createDeploymentStatus (String environment, String status, String hostEnv, String pathEnv) {
  def ghDeploymentId = new GitHubHelper().createDeployment(
    this,
    SOURCE_REPO_REF,
    [
      'environment': environment,
      'task': "deploy:master"
    ]
  )

  new GitHubHelper().createDeploymentStatus(
    this,
    ghDeploymentId,
    status,
    ['targetUrl': "https://${hostEnv}${pathEnv}"]
  )

  if (status.equalsIgnoreCase('SUCCESS')) {
    echo "${environment} deployment successful at https://${hostEnv}${pathEnv}"
  } else if (status.equalsIgnoreCase('PENDING')) {
    echo "${environment} deployment pending..."
  } else if (status.equalsIgnoreCase('FAILURE')) {
    echo "${environment} deployment failed"
  }
}

// Creates a comment and pass to Jenkins-GitHub library
def commentOnPR(String comment) {
  if(JOB_BASE_NAME.startsWith('PR-')) {
    GitHubHelper.commentOnPullRequest(this, comment)
  }
}

def inChangeSet(path) {
  def commitFiles = sh(script:"git diff --name-only HEAD~1..HEAD | grep '^${path}' || echo -n ''", returnStatus: false, returnStdout: true).trim()
  return commitFiles.length() > 0
}

def jenkinsFileUpdated() {
  return inChangeSet('Jenkinsfile.cicd')
}

def frontendPackagesUpdated() {
  return inChangeSet('frontend/package.json')
}

def frontendNpmTemplateUpdated() {
  return inChangeSet('openshift/frontend-npm.bc.yaml')
}

def frontendBuilderTemplateUpdated() {
  return inChangeSet('openshift/frontend-builder.bc.yaml')
}

def frontendUpdated() {
  return inChangeSet('frontend/')
}

def rebuildFrontendNpm() {
  if (REBUILD_BASE_IMAGES.equalsIgnoreCase('true')) {
    return true
  }

  def pipelineUpdated = jenkinsFileUpdated();
  echo "Jenkinsfile.cicd updated: ${pipelineUpdated}"

  def packagesFrontendUpdate = frontendPackagesUpdated();
  echo "frontend/package.json updated: ${packagesFrontendUpdate}"
  def frontendNpmImageExists = openshift.selector('is', "${APP_NAME}-${JOB_NAME}-frontend-npm").exists()
  echo "frontend npm image exists: ${frontendNpmImageExists}"
  def frontendNpmTemplateChanged = frontendNpmTemplateUpdated()
  echo "frontend npm template updated: ${frontendNpmTemplateChanged}"

  return (pipelineUpdated || packagesFrontendUpdate || frontendNpmTemplateChanged || !frontendNpmImageExists)
}

def rebuildFrontendBuilder() {
  if (REBUILD_BASE_IMAGES.equalsIgnoreCase('true')) {
    return true
  }
  def frontendChanged = frontendUpdated();
  echo "frontend/* updated: ${frontendChanged}"
  def frontendBuilderImageExists = openshift.selector('is', "${APP_NAME}-${JOB_NAME}-frontend-builder").exists()
  echo "frontend builder image exists: ${frontendBuilderImageExists}"
  def frontendBuilderTemplateChanged = frontendBuilderTemplateUpdated()
  echo "frontend builder template updated: ${frontendBuilderTemplateChanged}"

  return (jenkinsFileUpdated() || frontendChanged || frontendBuilderTemplateChanged || !frontendBuilderImageExists)
}

