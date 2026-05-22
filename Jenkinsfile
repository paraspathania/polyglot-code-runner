pipeline {
    agent any

    environment {
        // Store as a Jenkins "Username with password" credential named dockerhub-credentials
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_PREFIX          = "${DOCKERHUB_CREDENTIALS_USR}/polyglot"
        SHORT_SHA             = ''
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ── 1. Checkout ─────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Use bat to get the git commit SHA on Windows
                    SHORT_SHA = bat(script: "@git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "Commit: ${SHORT_SHA}"
                    currentBuild.description = "sha=${SHORT_SHA}"
                }
            }
        }

        // ── 2. TypeScript compile ────────────────────────────────
        stage('Build TypeScript') {
            steps {
                dir('src') {
                    bat 'npm ci'
                    bat 'npm run build'
                }
            }
        }

        // ── 3. Docker builds (all runners in parallel) ───────────
        stage('Build Docker Images') {
            parallel {

                stage('API') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-api:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-api:latest ^
                              -f containers/api/Dockerfile .
                        """
                    }
                }

                stage('Python Runner') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-runner-python:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-runner-python:latest ^
                              -f containers/python/Dockerfile .
                        """
                    }
                }

                stage('Node.js Runner') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-runner-nodejs:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-runner-nodejs:latest ^
                              -f containers/nodejs/Dockerfile .
                        """
                    }
                }

                stage('C Runner') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-runner-c:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-runner-c:latest ^
                              -f containers/c/Dockerfile .
                        """
                    }
                }

                stage('C++ Runner') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-runner-cpp:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-runner-cpp:latest ^
                              -f containers/cpp/Dockerfile .
                        """
                    }
                }

                stage('Java Runner') {
                    steps {
                        bat """
                            docker build ^
                              -t ${IMAGE_PREFIX}-runner-java:${SHORT_SHA} ^
                              -t ${IMAGE_PREFIX}-runner-java:latest ^
                              -f containers/java/Dockerfile .
                        """
                    }
                }

            } // end parallel
        } // end Build Docker Images

        // ── 4. Push — only when building the main/master branch ──
        stage('Push to Docker Hub') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                bat "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"

                bat """
                    docker push ${IMAGE_PREFIX}-api:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-api:latest

                    docker push ${IMAGE_PREFIX}-runner-python:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-runner-python:latest

                    docker push ${IMAGE_PREFIX}-runner-nodejs:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-runner-nodejs:latest

                    docker push ${IMAGE_PREFIX}-runner-c:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-runner-c:latest

                    docker push ${IMAGE_PREFIX}-runner-cpp:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-runner-cpp:latest

                    docker push ${IMAGE_PREFIX}-runner-java:${SHORT_SHA}
                    docker push ${IMAGE_PREFIX}-runner-java:latest
                """
            }
        }

    } // end stages

    post {
        always {
            // Log out and remove locally-built images to keep the agent clean
            bat "docker logout || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-api:${SHORT_SHA} ${IMAGE_PREFIX}-api:latest || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-runner-python:${SHORT_SHA} ${IMAGE_PREFIX}-runner-python:latest || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-runner-nodejs:${SHORT_SHA} ${IMAGE_PREFIX}-runner-nodejs:latest || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-runner-c:${SHORT_SHA} ${IMAGE_PREFIX}-runner-c:latest || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-runner-cpp:${SHORT_SHA} ${IMAGE_PREFIX}-runner-cpp:latest || exit 0"
            bat "docker rmi ${IMAGE_PREFIX}-runner-java:${SHORT_SHA} ${IMAGE_PREFIX}-runner-java:latest || exit 0"
        }
        success {
            echo "✅ Pipeline passed — images pushed as :latest and :${SHORT_SHA}"
        }
        failure {
            echo "❌ Pipeline failed — check the stage logs above."
        }
    }
}
