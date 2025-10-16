#!/bin/bash

echo "🔧 Optimal Platform - GitLab Integration Setup"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.development .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Check if GitLab token is set
if grep -q "GITLAB_TOKEN=your_gitlab_personal_access_token_here" .env; then
    echo ""
    echo "⚠️  GitLab token not configured yet!"
    echo ""
    echo "To set up GitLab integration:"
    echo "1. Go to https://gitlab.com/-/profile/personal_access_tokens"
    echo "2. Create a new token with 'read_api' scope"
    echo "3. Copy the token and run:"
    echo "   export GITLAB_TOKEN='your_token_here'"
    echo "   echo 'GITLAB_TOKEN=your_token_here' >> .env"
    echo ""
    echo "Or edit .env file directly and replace:"
    echo "   GITLAB_TOKEN=your_gitlab_personal_access_token_here"
    echo "   with your actual token"
    echo ""
else
    echo "✅ GitLab token appears to be configured"
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install httpx aiohttp fastapi uvicorn

# Make scripts executable
chmod +x real-gitlab-integration.py
chmod +x enhanced-gitlab-api.py
chmod +x test-gitlab-integration.py

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To test the GitLab integration:"
echo "1. Set your GitLab token: export GITLAB_TOKEN='your_token_here'"
echo "2. Run the test: python test-gitlab-integration.py"
echo "3. Start the enhanced API: python enhanced-gitlab-api.py"
echo ""
echo "This will demonstrate how Optimal Platform can pull real data"
echo "from your GitLab projects and provide environment visibility!"
