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

    // HOST_ROUTE is the full domain route endpoint (ie. 'appname-pr-5-k8vopl-dev.pathfinder.gov.bc.ca')
    DEV_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${DEV_PROJECT}.${APP_DOMAIN}"
    TEST_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${TEST_PROJECT}.${APP_DOMAIN}"
    PROD_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${PROD_PROJECT}.${APP_DOMAIN}"
  }

  stages {
    stage('App') {
      steps {
        notifyStageStatus('App', 'PENDING')

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

          openshift.withCluster() {
            openshift.withProject(TOOLS_PROJECT) {
              if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                echo "DEBUG - Using project: ${openshift.project()}"
              }

              echo "Processing BuildConfig ${REPO_NAME}-app..."
              def bcApp = openshift.process('-f',
                'openshift/app.bc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                "SOURCE_REPO_REF=${SOURCE_REPO_REF}"
              )

              echo "Building ImageStream ${REPO_NAME}-app..."
              openshift.apply(bcApp).narrow('bc').startBuild('-w').logs('-f')

              echo "Tagging Image ${REPO_NAME}-app:${JOB_NAME}..."
              openshift.tag("${REPO_NAME}-app:latest",
                "${REPO_NAME}-app:${JOB_NAME}"
              )
            }
          }
        }
      }
      post {
        success {
          echo 'App build successful'
          notifyStageStatus('App', 'SUCCESS')
        }
        unsuccessful {
          echo 'App build failed'
          notifyStageStatus('App', 'FAILURE')
        }
        cleanup {
          echo 'Cleanup App BuildConfigs...'
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcApp = openshift.selector('bc', "${REPO_NAME}-app-${JOB_NAME}")

                  if(bcApp.exists()) {
                    echo "Removing BuildConfig ${REPO_NAME}-app-${JOB_NAME}..."
                    bcApp.delete()
                  }
                }
              }
            }
          }
        }
      }
    }

    stage('Deploy - Dev') {
      steps {
        script {
          deployStage('Dev', DEV_PROJECT, DEV_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(DEV_PROJECT, 'SUCCESS', DEV_HOST_ROUTE)
          notifyStageStatus('Deploy - Dev', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(DEV_PROJECT, 'FAILURE', DEV_HOST_ROUTE)
          notifyStageStatus('Deploy - Dev', 'FAILURE')
        }
      }
    }

    stage('Deploy - Test') {
      steps {
        script {
          deployStage('Test', TEST_PROJECT, TEST_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(TEST_PROJECT, 'SUCCESS', TEST_HOST_ROUTE)
          notifyStageStatus('Deploy - Test', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(TEST_PROJECT, 'FAILURE', TEST_HOST_ROUTE)
          notifyStageStatus('Deploy - Test', 'FAILURE')
        }
      }
    }

    stage('Deploy - Prod') {
      steps {
        script {
          deployStage('Prod', PROD_PROJECT, PROD_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(PROD_PROJECT, 'SUCCESS', PROD_HOST_ROUTE)
          notifyStageStatus('Deploy - Prod', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(PROD_PROJECT, 'FAILURE', PROD_HOST_ROUTE)
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
def deployStage(String stageEnv, String projectEnv, String hostRouteEnv) {
  if (!stageEnv.equalsIgnoreCase('Dev')) {
    input("Deploy to ${projectEnv}?")
  }

  notifyStageStatus("Deploy - ${stageEnv}", 'PENDING')

  openshift.withCluster() {
    openshift.withProject(projectEnv) {
      if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
        echo "DEBUG - Using project: ${openshift.project()}"
      }

      echo "Tagging Image ${REPO_NAME}-app:${JOB_NAME}..."
      openshift.tag("${TOOLS_PROJECT}/${REPO_NAME}-app:${JOB_NAME}", "${REPO_NAME}-app:${JOB_NAME}")

      echo "Processing DeploymentConfig ${REPO_NAME}-app..."
      def dcApp = openshift.process('-f',
        'openshift/app.dc.yaml',
        "REPO_NAME=${REPO_NAME}",
        "JOB_NAME=${JOB_NAME}",
        "NAMESPACE=${projectEnv}",
        "APP_NAME=${APP_NAME}",
        "HOST_ROUTE=${hostRouteEnv}"
      )

      echo "Applying Deployment ${REPO_NAME}-app..."
      createDeploymentStatus(projectEnv, 'PENDING', hostRouteEnv)
      def dc = openshift.apply(dcApp).narrow('dc')

      // Wait for new deployment to roll out
      timeout(5) {
        dc.rollout().status('--watch=true')
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
      'task': "deploy:master"
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
