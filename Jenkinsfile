pipeline {
    agent any
    
    environment {
        GITHUB_CREDENTIAL_ID = 'github-token'
        IMAGE_NAME = 'projeic_backend'
        DOCKER_BUILDKIT = '0'
    }

    stages {
        stage('Limpieza de Código') {
            steps {
                deleteDir()
            }
        }

        stage('Clonar Repositorio') {
            steps {
                checkout scm
            }
        }

        stage('Construir Imagen Podman') {
            steps {
                sh 'docker rm -f buildx_buildkit_default || true'
                sh 'docker build -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Desplegar') {
            steps {
                sh '''
                docker run --rm \
                  -v /home/adminc/projeic:/home/adminc/projeic \
                  -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                  -w /home/adminc/projeic \
                  docker.io/docker/compose:1.29.2 \
                  -f docker-compose.yml up -d --no-deps backend
                '''
            }
        }
    }
}
