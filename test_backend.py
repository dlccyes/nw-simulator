#!/usr/bin/env python3
"""
Simple test runner for the backend tests.
Run this from the root directory to test the backend.
"""

import subprocess
import sys
import os

def main():
    """Run backend tests and report results."""
    print("🧪 Running Backend Tests...")
    print("=" * 50)
    
    # Change to backend/api directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend', 'api')
    
    if not os.path.exists(backend_dir):
        print(f"❌ Backend directory not found: {backend_dir}")
        sys.exit(1)
    
    try:
        # Run tests with pytest
        print("📊 Running tests with pytest...")
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 'test_calculator.py', '-v'
        ], cwd=backend_dir, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All tests passed!")
            print("\n📈 Test Summary:")
            print(result.stdout)
        else:
            print("❌ Some tests failed!")
            print("\n📋 Test Output:")
            print(result.stdout)
            print("\n❌ Errors:")
            print(result.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 