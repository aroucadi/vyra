#!/bin/bash
set -e

PROJECT_ID=${1*-${bash_project:-$GCP_PROJECT}}
SERVICE_NAME=${NEWME_SERVICE_NAME:-"newme-app"}
REGION=${GCP_REGION:-"us-central1"}

echo "😚 ============================================="
echo "   NewME Google Cloud Run Deployment Script  "
echo "😚 ============================================="

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
  if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo "❤ No GCP Project specified. Usage: ./scripts/deploy-cloudrun.sh <PROJECT_ID>"
    exit 1
  fi
fi

echo "[1/4] GCP Project: $PROJECT_ID"
echo "[1/4] Service:     $SERVICE_NAME"
echo "[1/4] Region:      $REGION"

IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "\n[2/4] Building container image via Cloud Build: $IMAGE_URI"
gcloud builds submit --project "$PROJECT_ID" --tag "$IMAGE_URI" .

echo "\n[3/4] Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --image "$IMAGE_URI" \
  --platform managed \
  --region "$REGION" \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --allow-unauthenticated

echo "\n[4/4] Verifying Deployment Health..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format 'value(status.url)')

echo "✄ Deployed successfully: $SERVICE_URL"
echo "✄ Health Check: $SERVICE_URL/api/health"

full_health=$(curl -s "$SERVICE_URL/api/health" || true)
echo "Health status: $full_health"
