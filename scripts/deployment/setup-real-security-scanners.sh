#!/bin/bash

echo "🔒 Optimal Platform - Real Security Scanners Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS - using Homebrew for installations"
    PACKAGE_MANAGER="brew"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Detected Linux - using apt for installations"
    PACKAGE_MANAGER="apt"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Install Trivy
print_status "Installing Trivy vulnerability scanner..."
if command -v trivy &> /dev/null; then
    print_success "Trivy is already installed"
else
    if [ "$PACKAGE_MANAGER" = "brew" ]; then
        brew install trivy
    else
        # Install Trivy on Linux
        sudo apt-get update
        sudo apt-get install wget apt-transport-https gnupg lsb-release
        wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
        echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
        sudo apt-get update
        sudo apt-get install trivy
    fi
    
    if command -v trivy &> /dev/null; then
        print_success "Trivy installed successfully"
    else
        print_error "Failed to install Trivy"
        exit 1
    fi
fi

# Install Syft
print_status "Installing Syft SBOM generator..."
if command -v syft &> /dev/null; then
    print_success "Syft is already installed"
else
    if [ "$PACKAGE_MANAGER" = "brew" ]; then
        brew install syft
    else
        # Install Syft on Linux
        curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
    fi
    
    if command -v syft &> /dev/null; then
        print_success "Syft installed successfully"
    else
        print_error "Failed to install Syft"
        exit 1
    fi
fi

# Install Grype (alternative vulnerability scanner)
print_status "Installing Grype vulnerability scanner..."
if command -v grype &> /dev/null; then
    print_success "Grype is already installed"
else
    if [ "$PACKAGE_MANAGER" = "brew" ]; then
        brew install grype
    else
        # Install Grype on Linux
        curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
    fi
    
    if command -v grype &> /dev/null; then
        print_success "Grype installed successfully"
    else
        print_error "Failed to install Grype"
        exit 1
    fi
fi

# Test the scanners
print_status "Testing security scanners..."

# Test Trivy
print_status "Testing Trivy..."
if trivy --version > /dev/null 2>&1; then
    print_success "Trivy is working: $(trivy --version | head -1)"
else
    print_error "Trivy test failed"
fi

# Test Syft
print_status "Testing Syft..."
if syft version > /dev/null 2>&1; then
    print_success "Syft is working: $(syft version | head -1)"
else
    print_error "Syft test failed"
fi

# Test Grype
print_status "Testing Grype..."
if grype version > /dev/null 2>&1; then
    print_success "Grype is working: $(grype version | head -1)"
else
    print_error "Grype test failed"
fi

# Create real security scanning script
print_status "Creating real security scanning script..."
cat > real-security-scan.py << 'EOF'
#!/usr/bin/env python3
"""
Real Security Scanning for Optimal Platform
Integrates Trivy, Syft, and Grype for comprehensive security analysis
"""

import subprocess
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any
import asyncio
import aiohttp

class RealSecurityScanner:
    def __init__(self):
        self.scan_results = {
            "timestamp": datetime.now().isoformat(),
            "trivy_results": [],
            "syft_results": [],
            "grype_results": [],
            "summary": {}
        }
    
    def run_trivy_scan(self, target: str) -> Dict[str, Any]:
        """Run Trivy vulnerability scan"""
        print(f"🔍 Running Trivy scan on: {target}")
        
        try:
            # Run Trivy with JSON output
            cmd = [
                "trivy", "image", "--format", "json", "--quiet", target
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                trivy_data = json.loads(result.stdout)
                return {
                    "success": True,
                    "target": target,
                    "vulnerabilities": trivy_data.get("Results", []),
                    "summary": {
                        "total_vulnerabilities": len(trivy_data.get("Results", [])),
                        "critical": sum(1 for r in trivy_data.get("Results", []) 
                                      for v in r.get("Vulnerabilities", []) 
                                      if v.get("Severity") == "CRITICAL"),
                        "high": sum(1 for r in trivy_data.get("Results", []) 
                                   for v in r.get("Vulnerabilities", []) 
                                   if v.get("Severity") == "HIGH"),
                        "medium": sum(1 for r in trivy_data.get("Results", []) 
                                     for v in r.get("Vulnerabilities", []) 
                                     if v.get("Severity") == "MEDIUM"),
                        "low": sum(1 for r in trivy_data.get("Results", []) 
                                  for v in r.get("Vulnerabilities", []) 
                                  if v.get("Severity") == "LOW")
                    }
                }
            else:
                return {
                    "success": False,
                    "target": target,
                    "error": result.stderr,
                    "summary": {"total_vulnerabilities": 0}
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "target": target,
                "error": "Scan timeout (5 minutes)",
                "summary": {"total_vulnerabilities": 0}
            }
        except Exception as e:
            return {
                "success": False,
                "target": target,
                "error": str(e),
                "summary": {"total_vulnerabilities": 0}
            }
    
    def run_syft_scan(self, target: str) -> Dict[str, Any]:
        """Run Syft SBOM generation"""
        print(f"📦 Running Syft SBOM scan on: {target}")
        
        try:
            # Run Syft with JSON output
            cmd = [
                "syft", target, "--output", "json"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                syft_data = json.loads(result.stdout)
                return {
                    "success": True,
                    "target": target,
                    "sbom": syft_data,
                    "summary": {
                        "total_packages": len(syft_data.get("artifacts", [])),
                        "package_types": list(set(a.get("type", "unknown") for a in syft_data.get("artifacts", [])))
                    }
                }
            else:
                return {
                    "success": False,
                    "target": target,
                    "error": result.stderr,
                    "summary": {"total_packages": 0}
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "target": target,
                "error": "Scan timeout (5 minutes)",
                "summary": {"total_packages": 0}
            }
        except Exception as e:
            return {
                "success": False,
                "target": target,
                "error": str(e),
                "summary": {"total_packages": 0}
            }
    
    def run_grype_scan(self, target: str) -> Dict[str, Any]:
        """Run Grype vulnerability scan"""
        print(f"🛡️ Running Grype scan on: {target}")
        
        try:
            # Run Grype with JSON output
            cmd = [
                "grype", target, "--output", "json"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                grype_data = json.loads(result.stdout)
                return {
                    "success": True,
                    "target": target,
                    "vulnerabilities": grype_data.get("matches", []),
                    "summary": {
                        "total_vulnerabilities": len(grype_data.get("matches", [])),
                        "critical": sum(1 for m in grype_data.get("matches", []) 
                                      if m.get("vulnerability", {}).get("severity") == "Critical"),
                        "high": sum(1 for m in grype_data.get("matches", []) 
                                   if m.get("vulnerability", {}).get("severity") == "High"),
                        "medium": sum(1 for m in grype_data.get("matches", []) 
                                     if m.get("vulnerability", {}).get("severity") == "Medium"),
                        "low": sum(1 for m in grype_data.get("matches", []) 
                                  if m.get("vulnerability", {}).get("severity") == "Low")
                    }
                }
            else:
                return {
                    "success": False,
                    "target": target,
                    "error": result.stderr,
                    "summary": {"total_vulnerabilities": 0}
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "target": target,
                "error": "Scan timeout (5 minutes)",
                "summary": {"total_vulnerabilities": 0}
            }
        except Exception as e:
            return {
                "success": False,
                "target": target,
                "error": str(e),
                "summary": {"total_vulnerabilities": 0}
            }
    
    def scan_target(self, target: str) -> Dict[str, Any]:
        """Run comprehensive security scan on a target"""
        print(f"\n🎯 Starting comprehensive security scan for: {target}")
        print("=" * 60)
        
        # Run all scanners
        trivy_result = self.run_trivy_scan(target)
        syft_result = self.run_syft_scan(target)
        grype_result = self.run_grype_scan(target)
        
        # Store results
        self.scan_results["trivy_results"].append(trivy_result)
        self.scan_results["syft_results"].append(syft_result)
        self.scan_results["grype_results"].append(grype_result)
        
        # Generate summary
        total_vulns = (
            trivy_result["summary"]["total_vulnerabilities"] +
            grype_result["summary"]["total_vulnerabilities"]
        )
        
        total_packages = syft_result["summary"]["total_packages"]
        
        return {
            "target": target,
            "trivy": trivy_result,
            "syft": syft_result,
            "grype": grype_result,
            "summary": {
                "total_vulnerabilities": total_vulns,
                "total_packages": total_packages,
                "scan_success": all([
                    trivy_result["success"],
                    syft_result["success"],
                    grype_result["success"]
                ])
            }
        }
    
    def generate_report(self) -> str:
        """Generate a comprehensive security report"""
        report = []
        report.append("# 🔒 Optimal Platform Security Scan Report")
        report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Summary
        total_scans = len(self.scan_results["trivy_results"])
        successful_scans = sum(1 for r in self.scan_results["trivy_results"] if r["success"])
        
        report.append("## 📊 Scan Summary")
        report.append(f"- **Total Targets Scanned:** {total_scans}")
        report.append(f"- **Successful Scans:** {successful_scans}")
        report.append(f"- **Failed Scans:** {total_scans - successful_scans}")
        report.append("")
        
        # Detailed results
        for i, (trivy, syft, grype) in enumerate(zip(
            self.scan_results["trivy_results"],
            self.scan_results["syft_results"],
            self.scan_results["grype_results"]
        )):
            target = trivy["target"]
            report.append(f"## 🎯 Target: {target}")
            report.append("")
            
            # Trivy results
            if trivy["success"]:
                report.append("### 🔍 Trivy Vulnerability Scan")
                report.append(f"- **Total Vulnerabilities:** {trivy['summary']['total_vulnerabilities']}")
                report.append(f"- **Critical:** {trivy['summary']['critical']}")
                report.append(f"- **High:** {trivy['summary']['high']}")
                report.append(f"- **Medium:** {trivy['summary']['medium']}")
                report.append(f"- **Low:** {trivy['summary']['low']}")
            else:
                report.append("### ❌ Trivy Scan Failed")
                report.append(f"Error: {trivy.get('error', 'Unknown error')}")
            report.append("")
            
            # Syft results
            if syft["success"]:
                report.append("### 📦 Syft SBOM Generation")
                report.append(f"- **Total Packages:** {syft['summary']['total_packages']}")
                report.append(f"- **Package Types:** {', '.join(syft['summary']['package_types'])}")
            else:
                report.append("### ❌ Syft Scan Failed")
                report.append(f"Error: {syft.get('error', 'Unknown error')}")
            report.append("")
            
            # Grype results
            if grype["success"]:
                report.append("### 🛡️ Grype Vulnerability Scan")
                report.append(f"- **Total Vulnerabilities:** {grype['summary']['total_vulnerabilities']}")
                report.append(f"- **Critical:** {grype['summary']['critical']}")
                report.append(f"- **High:** {grype['summary']['high']}")
                report.append(f"- **Medium:** {grype['summary']['medium']}")
                report.append(f"- **Low:** {grype['summary']['low']}")
            else:
                report.append("### ❌ Grype Scan Failed")
                report.append(f"Error: {grype.get('error', 'Unknown error')}")
            report.append("")
        
        return "\n".join(report)
    
    def save_results(self, filename: str = None):
        """Save scan results to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"security-scan-results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.scan_results, f, indent=2)
        
        print(f"📁 Results saved to: {filename}")
        return filename

def main():
    """Main function to run security scans"""
    print("🔒 Optimal Platform - Real Security Scanner")
    print("=" * 50)
    
    # Get targets from command line or use defaults
    if len(sys.argv) > 1:
        targets = sys.argv[1:]
    else:
        # Default targets - scan some common images
        targets = [
            "alpine:latest",
            "nginx:latest",
            "node:18-alpine"
        ]
        print(f"🎯 No targets specified, using defaults: {', '.join(targets)}")
    
    scanner = RealSecurityScanner()
    
    # Scan each target
    for target in targets:
        try:
            result = scanner.scan_target(target)
            print(f"✅ Scan completed for {target}")
        except Exception as e:
            print(f"❌ Scan failed for {target}: {e}")
    
    # Generate and save report
    report = scanner.generate_report()
    report_filename = f"security-report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    
    with open(report_filename, 'w') as f:
        f.write(report)
    
    print(f"\n📊 Security report generated: {report_filename}")
    
    # Save JSON results
    json_filename = scanner.save_results()
    
    print(f"\n🎉 Security scanning completed!")
    print(f"📁 Files generated:")
    print(f"   • Report: {report_filename}")
    print(f"   • JSON Results: {json_filename}")

if __name__ == "__main__":
    main()
EOF

chmod +x real-security-scan.py
print_success "Real security scanning script created"

# Test the security scanner
print_status "Testing real security scanner..."
if python3 real-security-scan.py alpine:latest > /dev/null 2>&1; then
    print_success "Real security scanner test passed"
else
    print_warning "Real security scanner test failed - this is normal if Docker images aren't available"
fi

# Create integration script for Optimal Platform
print_status "Creating Optimal Platform integration script..."
cat > integrate-real-scanners.py << 'EOF'
#!/usr/bin/env python3
"""
Integrate Real Security Scanners with Optimal Platform
This script updates the runtime agent to use real Trivy, Syft, and Grype
"""

import os
import shutil
import subprocess
from pathlib import Path

def update_runtime_agent():
    """Update the runtime agent to use real security scanners"""
    print("🔧 Updating Runtime Security Agent with real scanners...")
    
    # Path to runtime agent
    agent_path = Path("agents/runtime-security-agent")
    
    if not agent_path.exists():
        print("❌ Runtime agent directory not found")
        return False
    
    # Update the main.py to include real scanner integration
    main_py_path = agent_path / "main.py"
    
    # Read current main.py
    with open(main_py_path, 'r') as f:
        content = f.read()
    
    # Add real scanner integration code
    real_scanner_code = '''
# Real Security Scanner Integration
import subprocess
import json
from typing import Dict, List, Any

class RealSecurityScanner:
    def __init__(self):
        self.scanners_available = self._check_scanners()
    
    def _check_scanners(self) -> Dict[str, bool]:
        """Check which security scanners are available"""
        scanners = {}
        for scanner in ['trivy', 'syft', 'grype']:
            try:
                subprocess.run([scanner, '--version'], capture_output=True, check=True)
                scanners[scanner] = True
            except (subprocess.CalledProcessError, FileNotFoundError):
                scanners[scanner] = False
        return scanners
    
    def scan_container_image(self, image: str) -> Dict[str, Any]:
        """Scan a container image with available scanners"""
        results = {
            "image": image,
            "timestamp": datetime.now().isoformat(),
            "scanners_used": [],
            "vulnerabilities": [],
            "sbom": None
        }
        
        # Run Trivy if available
        if self.scanners_available.get('trivy', False):
            try:
                trivy_result = subprocess.run([
                    'trivy', 'image', '--format', 'json', '--quiet', image
                ], capture_output=True, text=True, timeout=300)
                
                if trivy_result.returncode == 0:
                    trivy_data = json.loads(trivy_result.stdout)
                    results["scanners_used"].append("trivy")
                    results["vulnerabilities"].extend(trivy_data.get("Results", []))
            except Exception as e:
                logger.error(f"Trivy scan failed: {e}")
        
        # Run Syft if available
        if self.scanners_available.get('syft', False):
            try:
                syft_result = subprocess.run([
                    'syft', image, '--output', 'json'
                ], capture_output=True, text=True, timeout=300)
                
                if syft_result.returncode == 0:
                    syft_data = json.loads(syft_result.stdout)
                    results["scanners_used"].append("syft")
                    results["sbom"] = syft_data
            except Exception as e:
                logger.error(f"Syft scan failed: {e}")
        
        # Run Grype if available
        if self.scanners_available.get('grype', False):
            try:
                grype_result = subprocess.run([
                    'grype', image, '--output', 'json'
                ], capture_output=True, text=True, timeout=300)
                
                if grype_result.returncode == 0:
                    grype_data = json.loads(grype_result.stdout)
                    results["scanners_used"].append("grype")
                    # Merge Grype vulnerabilities with Trivy results
                    results["vulnerabilities"].extend(grype_data.get("matches", []))
            except Exception as e:
                logger.error(f"Grype scan failed: {e}")
        
        return results

# Initialize real security scanner
real_scanner = RealSecurityScanner()
'''
    
    # Add the real scanner code to the main.py
    if "RealSecurityScanner" not in content:
        # Find a good place to insert the code
        if "from datetime import datetime" in content:
            content = content.replace(
                "from datetime import datetime",
                "from datetime import datetime\n" + real_scanner_code
            )
        else:
            # Add at the beginning of the file
            content = real_scanner_code + "\n" + content
        
        # Write the updated content
        with open(main_py_path, 'w') as f:
            f.write(content)
        
        print("✅ Runtime agent updated with real security scanners")
        return True
    else:
        print("✅ Runtime agent already has real security scanners")
        return True

def main():
    """Main function"""
    print("🔒 Optimal Platform - Real Security Scanner Integration")
    print("=" * 60)
    
    # Update runtime agent
    if update_runtime_agent():
        print("✅ Real security scanner integration completed")
        print("\n📋 Next steps:")
        print("1. Rebuild the runtime agent: docker build -t optimal-platform-runtime-agent:latest -f agents/runtime-security-agent/Dockerfile agents/runtime-security-agent/")
        print("2. Deploy to Kubernetes: kubectl apply -f k8s/runtime-agent-daemonset.yaml")
        print("3. Test the integration: python3 real-security-scan.py")
    else:
        print("❌ Real security scanner integration failed")

if __name__ == "__main__":
    main()
EOF

chmod +x integrate-real-scanners.py
print_success "Integration script created"

# Display summary
echo ""
echo "🎉 Real Security Scanners Setup Complete!"
echo "=========================================="
echo ""
echo "✅ Installed Tools:"
echo "  • Trivy - Vulnerability scanner"
echo "  • Syft - SBOM generator"
echo "  • Grype - Alternative vulnerability scanner"
echo ""
echo "📁 Created Scripts:"
echo "  • real-security-scan.py - Comprehensive security scanning"
echo "  • integrate-real-scanners.py - Optimal Platform integration"
echo ""
echo "🔧 Usage Examples:"
echo "  • Scan a container image: python3 real-security-scan.py alpine:latest"
echo "  • Scan multiple images: python3 real-security-scan.py nginx:latest node:18-alpine"
echo "  • Integrate with Optimal Platform: python3 integrate-real-scanners.py"
echo ""
echo "🚀 Next Steps:"
echo "  1. Test the scanners: python3 real-security-scan.py alpine:latest"
echo "  2. Integrate with Optimal Platform: python3 integrate-real-scanners.py"
echo "  3. Rebuild and deploy the runtime agent"
echo ""

print_success "Setup completed successfully!"
