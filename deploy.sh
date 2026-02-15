#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting Production Deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Copy .env.production to .env and configure it:"
    echo "   cp .env.production .env"
    exit 1
fi

# Check if required env vars are set
if grep -q "your_.*_here" .env; then
    echo "⚠️  Warning: Found placeholder values in .env"
    echo "Please update the following in .env:"
    grep "your_.*_here" .env
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker-compose ps

# Show logs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "   API: http://localhost:3000"
echo "   RabbitMQ: http://localhost:15672"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🔍 Check status:"
echo "   docker-compose ps"
