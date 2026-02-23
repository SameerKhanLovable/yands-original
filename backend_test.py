#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Car Rental Management System
FastAPI + MongoDB backend tests
"""

import requests
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, List
import uuid

# Configuration
BACKEND_URL = "https://pdf-export-hub-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_result(self, test_name: str, status: str, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if status == "PASS":
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: {status}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}: {status}")
            if details:
                print(f"   Details: {details}")
                
    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_result("Basic Connectivity", "PASS", 
                                  f"Root endpoint returned expected message", data)
                else:
                    self.log_result("Basic Connectivity", "FAIL", 
                                  f"Unexpected response: {data}")
            else:
                self.log_result("Basic Connectivity", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Basic Connectivity", "FAIL", f"Connection error: {str(e)}")
    
    def test_status_get_endpoint(self):
        """Test GET /api/status endpoint"""
        try:
            response = requests.get(f"{API_BASE}/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET Status Endpoint", "PASS", 
                                  f"Returned {len(data)} status checks", 
                                  {"count": len(data), "sample": data[:2] if data else []})
                else:
                    self.log_result("GET Status Endpoint", "FAIL", 
                                  f"Expected list, got: {type(data)}")
            else:
                self.log_result("GET Status Endpoint", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("GET Status Endpoint", "FAIL", f"Request error: {str(e)}")
    
    def test_status_post_endpoint(self):
        """Test POST /api/status endpoint"""
        try:
            test_data = {
                "client_name": f"Test Client {uuid.uuid4().hex[:8]}"
            }
            
            response = requests.post(
                f"{API_BASE}/status", 
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "client_name", "timestamp"]
                
                if all(field in data for field in required_fields):
                    if data["client_name"] == test_data["client_name"]:
                        self.log_result("POST Status Endpoint", "PASS", 
                                      f"Successfully created status check", data)
                    else:
                        self.log_result("POST Status Endpoint", "FAIL", 
                                      f"Client name mismatch: sent {test_data['client_name']}, got {data.get('client_name')}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("POST Status Endpoint", "FAIL", 
                                  f"Missing required fields: {missing}")
            else:
                self.log_result("POST Status Endpoint", "FAIL", 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("POST Status Endpoint", "FAIL", f"Request error: {str(e)}")
    
    def test_status_post_validation(self):
        """Test POST /api/status validation"""
        try:
            # Test with missing client_name
            response = requests.post(
                f"{API_BASE}/status", 
                json={},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_result("POST Status Validation", "PASS", 
                              "Correctly validates missing client_name field")
            else:
                self.log_result("POST Status Validation", "FAIL", 
                              f"Expected 422 validation error, got HTTP {response.status_code}")
        except Exception as e:
            self.log_result("POST Status Validation", "FAIL", f"Request error: {str(e)}")
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            # Test preflight request
            headers = {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
            
            response = requests.options(f"{API_BASE}/status", headers=headers, timeout=10)
            
            # Check if CORS headers are present
            cors_headers = [
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Methods",
                "Access-Control-Allow-Headers"
            ]
            
            present_headers = [h for h in cors_headers if h in response.headers]
            
            if len(present_headers) >= 1:  # At least some CORS headers present
                self.log_result("CORS Configuration", "PASS", 
                              f"CORS headers present: {present_headers}")
            else:
                self.log_result("CORS Configuration", "FAIL", 
                              f"No CORS headers found in response")
        except Exception as e:
            self.log_result("CORS Configuration", "FAIL", f"Request error: {str(e)}")
    
    def test_database_operations_flow(self):
        """Test complete database operations flow"""
        try:
            # Step 1: Get initial count
            initial_response = requests.get(f"{API_BASE}/status", timeout=10)
            if initial_response.status_code != 200:
                self.log_result("Database Flow Test", "FAIL", 
                              f"Failed to get initial status: {initial_response.status_code}")
                return
                
            initial_count = len(initial_response.json())
            
            # Step 2: Create new entry
            test_client_name = f"DB_Flow_Test_{uuid.uuid4().hex[:8]}"
            create_response = requests.post(
                f"{API_BASE}/status",
                json={"client_name": test_client_name},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if create_response.status_code != 200:
                self.log_result("Database Flow Test", "FAIL", 
                              f"Failed to create entry: {create_response.status_code}")
                return
                
            created_entry = create_response.json()
            
            # Step 3: Verify count increased
            final_response = requests.get(f"{API_BASE}/status", timeout=10)
            if final_response.status_code != 200:
                self.log_result("Database Flow Test", "FAIL", 
                              f"Failed to get final status: {final_response.status_code}")
                return
                
            final_count = len(final_response.json())
            final_data = final_response.json()
            
            # Step 4: Verify the created entry exists
            created_entry_found = any(
                entry.get("id") == created_entry.get("id") 
                for entry in final_data
            )
            
            if final_count == initial_count + 1 and created_entry_found:
                self.log_result("Database Flow Test", "PASS", 
                              f"Successfully created and retrieved entry. Count: {initial_count} → {final_count}")
            else:
                self.log_result("Database Flow Test", "FAIL", 
                              f"Count mismatch or entry not found. Initial: {initial_count}, Final: {final_count}, Entry found: {created_entry_found}")
                
        except Exception as e:
            self.log_result("Database Flow Test", "FAIL", f"Flow test error: {str(e)}")
    
    def test_environment_variables(self):
        """Test environment variables accessibility (indirect)"""
        try:
            # We can't directly check env vars, but we can infer from behavior
            
            # Test 1: MongoDB connection (if endpoints work, MongoDB is connected)
            mongo_test = requests.get(f"{API_BASE}/status", timeout=10)
            mongo_working = mongo_test.status_code == 200
            
            # Test 2: CORS origins (if CORS works, it's configured)
            cors_test = requests.options(f"{API_BASE}/", timeout=10)
            cors_working = "Access-Control-Allow-Origin" in cors_test.headers
            
            if mongo_working and cors_working:
                self.log_result("Environment Configuration", "PASS", 
                              "MongoDB connection and CORS are properly configured")
            elif mongo_working:
                self.log_result("Environment Configuration", "PARTIAL", 
                              "MongoDB working, CORS configuration unclear")
            else:
                self.log_result("Environment Configuration", "FAIL", 
                              "MongoDB or basic configuration issues")
                
        except Exception as e:
            self.log_result("Environment Configuration", "FAIL", f"Config test error: {str(e)}")
    
    def test_api_response_formats(self):
        """Test API response formats and data types"""
        try:
            # Test status list format
            response = requests.get(f"{API_BASE}/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                format_issues = []
                
                if not isinstance(data, list):
                    format_issues.append("Status list is not an array")
                else:
                    # Check format of individual entries
                    for i, entry in enumerate(data[:3]):  # Check first 3 entries
                        required_fields = ["id", "client_name", "timestamp"]
                        missing_fields = [f for f in required_fields if f not in entry]
                        if missing_fields:
                            format_issues.append(f"Entry {i} missing fields: {missing_fields}")
                
                if not format_issues:
                    self.log_result("API Response Format", "PASS", 
                                  "All responses have correct format and required fields")
                else:
                    self.log_result("API Response Format", "FAIL", 
                                  f"Format issues: {'; '.join(format_issues)}")
            else:
                self.log_result("API Response Format", "FAIL", 
                              f"Could not test format, API returned: {response.status_code}")
                
        except Exception as e:
            self.log_result("API Response Format", "FAIL", f"Format test error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing")
        print(f"🔗 Testing API at: {API_BASE}")
        print("-" * 60)
        
        # Run all tests
        self.test_basic_connectivity()
        self.test_status_get_endpoint()
        self.test_status_post_endpoint()
        self.test_status_post_validation()
        self.test_cors_configuration()
        self.test_database_operations_flow()
        self.test_environment_variables()
        self.test_api_response_formats()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {len(self.passed_tests)} tests")
        print(f"❌ Failed: {len(self.failed_tests)} tests")
        
        if self.passed_tests:
            print(f"\n🟢 PASSED TESTS:")
            for test in self.passed_tests:
                print(f"   • {test}")
                
        if self.failed_tests:
            print(f"\n🔴 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        # Return success status
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    print(f"\n{'🎉 ALL TESTS PASSED' if success else '⚠️  SOME TESTS FAILED'}")
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total_tests": len(tester.test_results),
                "passed": len(tester.passed_tests),
                "failed": len(tester.failed_tests),
                "success": success
            },
            "results": tester.test_results
        }, f, indent=2, default=str)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())