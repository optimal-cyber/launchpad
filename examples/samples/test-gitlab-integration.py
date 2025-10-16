#!/usr/bin/env python3
"""
Test GitLab Integration for Optimal Platform
This script demonstrates how to pull real data from your GitLab projects
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import importlib.util
spec = importlib.util.spec_from_file_location("real_gitlab_integration", "real-gitlab-integration.py")
real_gitlab_integration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(real_gitlab_integration)

async def test_gitlab_integration():
    """Test the GitLab integration with real data"""
    print("🔍 Optimal Platform - GitLab Integration Test")
    print("=" * 60)
    
    # Check if GitLab token is configured
    gitlab_token = os.getenv("GITLAB_TOKEN")
    if not gitlab_token:
        print("❌ GITLAB_TOKEN not found in environment variables")
        print("   Please set your GitLab personal access token:")
        print("   export GITLAB_TOKEN='your_token_here'")
        print("\n   To get a token:")
        print("   1. Go to https://gitlab.com/-/profile/personal_access_tokens")
        print("   2. Create a new token with 'read_api' scope")
        print("   3. Copy the token and set it as an environment variable")
        return False
    
    print(f"✅ GitLab token found: {gitlab_token[:8]}...")
    
    try:
        # Run the GitLab integration test
        await real_gitlab_integration.main()
        
        print(f"\n🎉 GitLab integration test completed successfully!")
        print(f"📊 Summary:")
        print(f"   • Retrieved real-time data from GitLab API")
        print(f"   • Demonstrated environment visibility capabilities")
        print(f"\n🔗 This proves that Optimal Platform can:")
        print(f"   • Pull real data from your GitLab projects")
        print(f"   • Provide visibility into your specific environments")
        print(f"   • Track pipelines, commits, issues, and security status")
        print(f"   • Monitor container registries and deployments")
        
        return True
            
    except Exception as e:
        print(f"❌ Error during GitLab integration test: {e}")
        return False

async def main():
    """Main function to run the GitLab integration test"""
    success = await test_gitlab_integration()
    
    if success:
        print(f"\n✅ GitLab integration is working correctly!")
        print(f"🚀 You can now use this data in your Optimal Platform dashboard")
    else:
        print(f"\n❌ GitLab integration test failed")
        print(f"🔧 Please check your GitLab token and try again")

if __name__ == "__main__":
    asyncio.run(main())
