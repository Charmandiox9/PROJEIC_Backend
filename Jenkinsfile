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
                // Dejamos que Compose gestione el ciclo de vida completo.
                // Actualizará el backend y reconectará Nginx automáticamente.
                sh '''
                docker run --rm \
                  -v /var/www/projeic:/var/www/projeic \
                  -v /run/user/1000/podman/podman.sock:/var/run/docker.sock \
                  -w /var/www/projeic \
                  docker.io/docker/compose:1.29.2 \
                  -f docker-compose.yml up -d
                '''
                
                // Limpieza de imágenes viejas para no llenar los 4GB de disco
                sh 'docker image prune -f || true'
            }
        }

        stage('Monitoreo Inteligente Post-Despliegue') {
            steps {
                echo 'Despliegue finalizado. Esperando 30 segundos para que NestJS levante y Prometheus recolecte datos...'
                sleep time: 30, unit: 'SECONDS'
                
                echo 'Consultando estado de salud en Prometheus...'
                sh '''
                    # Buscamos si Prometheus está vivo y respondiendo
                    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://prometheus:9090/-/ready)
                    
                    if [ "$HTTP_STATUS" -eq 200 ]; then
                        echo "✅ Stack de Monitoreo Operativo. Telemetría conectada."
                    else
                        echo "❌ Advertencia: Prometheus no está respondiendo (Status: $HTTP_STATUS)."
                        exit 1
                    fi
                '''
            }
        }
    }
}