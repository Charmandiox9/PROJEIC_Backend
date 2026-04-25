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
                // 1. Apagamos el frontend temporalmente para que no bloquee al backend
                sh 'docker stop frontend || true'
                
                // 2. Destruimos el contenedor viejo del backend sin piedad a nivel del daemon
                sh 'docker rm -f backend || true'
                
                // 3. El agente de Compose ahora tiene la vía libre para levantar el backend limpio
                sh '''
                docker run --rm \
                  -v /var/www/projeic:/var/www/projeic \
                  -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                  -w /var/www/projeic \
                  docker.io/docker/compose:1.29.2 \
                  -f docker-compose.yml up -d --force-recreate --no-deps backend
                '''
                
                // 4. Volvemos a encender el frontend
                sh 'docker start frontend || true'
                
                // 5. Reiniciamos el proxy Nginx para que enrute el tráfico correctamente
                sh 'docker restart projeic_nginx_1 || true'
                
                // 6. Limpieza suave
                sh 'docker image prune -f || true'
            }
        }
    }
}
