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
                // 1. Apagamos el proxy (el escudo) temporalmente
                sh 'docker stop nginx || true'
                
                // 2. Destruimos y recreamos el backend
                sh 'docker rm -f backend || true'
                sh 'docker run -d --name backend --network projeic_default -p 4000:4000 projeic_backend:latest'
                
                // 3. Volvemos a encender el proxy
                sh 'docker start nginx || true'
            }
        }
    }
}
