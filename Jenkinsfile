pipeline {
    agent any
    
    environment {
        GITHUB_CREDENTIAL_ID = 'github-token'
        IMAGE_NAME = 'projeic_backend'
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
                sh 'docker build -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Desplegar') {
            steps {
                sh 'podman-compose up -d --no-deps backend'
            }
        }
    }
}
