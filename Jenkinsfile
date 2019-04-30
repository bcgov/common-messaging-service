#!groovy
import bcgov.GitHubHelper

// ------------------
// Pipeline Variables
// ------------------
// Enable pipeline verbose debug output
def DEBUG_OUTPUT = false

// --------------------
// Declarative Pipeline
// --------------------
pipeline {
  agent any

  environment {
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
    JOB_NAME = "${JOB_BASE_NAME}".toLowerCase()

    // SOURCE_REPO_* references git repository resources
    SOURCE_REPO_RAW = "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master"
    SOURCE_REPO_REF = 'master'
    SOURCE_REPO_URL = "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

    // HOST_ROUTE is the full domain route endpoint (ie. 'appname-pr-5-k8vopl-dev.pathfinder.gov.bc.ca')
    HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${DEV_PROJECT}.${APP_DOMAIN}"
  }

  stages {
    stage('Frontend') {
      steps {
        notifyStageStatus('Frontend', 'PENDING')

        // Cancel any running builds in progress
        timeout(10) {
          echo "Cancelling previous ${APP_NAME}-${JOB_NAME} builds in progress..."
          abortAllPreviousBuildInProgress(currentBuild)
        }

        script {
          if(DEBUG_OUTPUT) {
            // Force OpenShift Plugin directives to be verbose
            openshift.logLevel(1)

            // Print all environment variables
            echo 'DEBUG - All pipeline environment variables:'
            echo sh(returnStdout: true, script: 'env')
          }

          openshift.withCluster() {
            openshift.withProject(TOOLS_PROJECT) {
              if(DEBUG_OUTPUT) {
                echo "DEBUG - Using project: ${openshift.project()}"
              }

              echo "Processing BuildConfig ${REPO_NAME}-frontend..."
              def bcFrontend = openshift.process('-f',
                'openshift/frontend.bc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                "SOURCE_REPO_REF=${SOURCE_REPO_REF}"
              )

              echo "Building ImageStream ${REPO_NAME}-frontend..."
              openshift.apply(bcFrontend).narrow('bc').startBuild('-w').logs('-f')

              echo "Tagging Image ${REPO_NAME}-frontend:${JOB_NAME}..."
              openshift.tag("${REPO_NAME}-frontend:latest",
                "${REPO_NAME}-frontend:${JOB_NAME}"
              )
            }
          }
        }
      }
      post {
        success {
          echo 'Frontend build successful'
          notifyStageStatus('Frontend', 'SUCCESS')
        }
        unsuccessful {
          echo 'Frontend build failed'
          notifyStageStatus('Frontend', 'FAILURE')
        }
        cleanup {
          echo 'Cleanup Frontend BuildConfigs...'
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcFrontend = openshift.selector('bc', "${REPO_NAME}-frontend-${JOB_NAME}")

                  if(bcFrontend.exists()) {
                    echo "Removing BuildConfig ${REPO_NAME}-frontend-${JOB_NAME}..."
                    bcFrontend.delete()
                  }
                }
              }
            }
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        notifyStageStatus('Deploy', 'PENDING')

        script {
          openshift.withCluster() {
            openshift.withProject(DEV_PROJECT) {
              if(DEBUG_OUTPUT) {
                echo "DEBUG - Using project: ${openshift.project()}"
              }

              echo "Tagging Image ${REPO_NAME}-frontend:${JOB_NAME}..."
              openshift.tag("${TOOLS_PROJECT}/${REPO_NAME}-frontend:${JOB_NAME}", "${REPO_NAME}-frontend:${JOB_NAME}")

              echo "Processing DeploymentConfig ${REPO_NAME}-frontend..."
              def dcFrontend = openshift.process('-f',
                'openshift/frontend.dc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "NAMESPACE=${DEV_PROJECT}",
                "APP_NAME=${APP_NAME}",
                "HOST_ROUTE=${HOST_ROUTE}"
              )

              echo "Applying Deployment ${REPO_NAME}-frontend..."
              createDeploymentStatus('Dev', 'PENDING', HOST_ROUTE)
              openshift.apply(dcFrontend)
              // TODO - Add pod waiting
            }
          }
        }
      }
      post {
        success {
          createDeploymentStatus('Dev', 'SUCCESS', HOST_ROUTE)
          notifyStageStatus('Deploy', 'SUCCESS')
        }
        unsuccessful {
          echo 'Deploy failed'
          notifyStageStatus('Deploy', 'FAILURE')
        }
      }
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
def createDeploymentStatus (String environment, String status, String hostUrl) {
  def ghDeploymentId = new GitHubHelper().createDeployment(
    this,
    SOURCE_REPO_REF,
    [
      'environment': environment,
      'task': "deploy:pull:${CHANGE_ID}"
    ]
  )

  new GitHubHelper().createDeploymentStatus(
    this,
    ghDeploymentId,
    status,
    ['targetUrl': "https://${hostUrl}"]
  )

  if (status.equalsIgnoreCase('SUCCESS')) {
    echo "${environment} deployment successful at https://${hostUrl}"
  } else if (status.equalsIgnoreCase('PENDING')){
    echo "${environment} deployment pending..."
  }
}

// Creates a comment and pass to Jenkins-GitHub library
def commentOnPR(String comment) {
  if(JOB_BASE_NAME.startsWith('PR-')) {
    GitHubHelper.commentOnPullRequest(this, comment)
  }
}
