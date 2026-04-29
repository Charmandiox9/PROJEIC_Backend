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
                -v /var/www/projeic:/var/www/projeic \
                -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                -w /var/www/projeic \
                docker.io/docker/compose:1.29.2 \
                -f docker-compose.yml stop nginx backend || true
                '''

                sh '''
                docker run --rm \
                -v /var/www/projeic:/var/www/projeic \
                -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                -w /var/www/projeic \
                docker.io/docker/compose:1.29.2 \
                -f docker-compose.yml rm -f nginx backend || true
                '''

                // --no-deps evita que compose intente recrear "db"
                sh '''
                docker run --rm \
                -v /var/www/projeic:/var/www/projeic \
                -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                -w /var/www/projeic \
                docker.io/docker/compose:1.29.2 \
                -f docker-compose.yml up -d --no-deps backend nginx
                '''

                sh 'docker image prune -f || true'
            }
        }
    }
}