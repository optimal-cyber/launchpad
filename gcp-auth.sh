#!/bin/bash
# Quick GCP Authentication Script

export PATH="$HOME/google-cloud-sdk/bin:$PATH"

echo "=== GCP Authentication ==="
echo ""

# Run authentication
gcloud auth login

# Verify
echo ""
echo "=== Verifying Authentication ==="
gcloud auth list

# List projects
echo ""
echo "=== Your GCP Projects ==="
gcloud projects list 2>/dev/null || echo "No projects found or no permission to list"

echo ""
echo "=== Done! ==="
echo "Now run: ./deploy-to-gke.sh"
