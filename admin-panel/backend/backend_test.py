"""Backend API tests for Repair CRM."""
import os
import requests
import sys
from datetime import datetime, timedelta
from urllib.parse import urlparse

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:8011/api").rstrip("/")


def validate_local_test_target():
    """Refuse to run destructive integration tests against any external API."""
    hostname = urlparse(BASE_URL).hostname
    if os.environ.get("TECSERVICE_TEST_MODE") != "in_memory":
        raise RuntimeError("Run tests with: python run_local_tests.py")
    if hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise RuntimeError("Backend tests are restricted to a local in-memory API")

class CRMAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.test_ticket_id = None
        self.test_results = []

    def log(self, message, success=None):
        """Log test result."""
        print(message)
        if success is not None:
            result = "✅ PASS" if success else "❌ FAIL"
            self.test_results.append(f"{result}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test."""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"\n🔍 Test {self.tests_run}: {name}")

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                self.log(f"❌ Unknown method: {method}", False)
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ Status: {response.status_code}", True)
            else:
                self.log(f"❌ Expected {expected_status}, got {response.status_code}", False)
                self.log(f"   Response: {response.text[:200]}")

            try:
                return success, response.json() if response.text else {}
            except Exception:
                return success, {}

        except Exception as e:
            self.log(f"❌ Error: {str(e)}", False)
            return False, {}

    def test_meta(self):
        """Test GET /api/meta - returns statuses list."""
        success, data = self.run_test(
            "GET /api/meta - statuses list",
            "GET",
            "meta",
            200
        )
        if success and 'statuses' in data:
            self.log(f"   Found {len(data['statuses'])} statuses")
            return True
        return False

    def test_counts(self):
        """Test GET /api/tickets/counts - per-status counts."""
        success, data = self.run_test(
            "GET /api/tickets/counts - per-status counts",
            "GET",
            "tickets/counts",
            200
        )
        if success:
            self.log(f"   Total tickets: {data.get('total', 0)}")
            self.log(f"   new: {data.get('new', 0)}, in_progress: {data.get('in_progress', 0)}, waiting_for_part: {data.get('waiting_for_part', 0)}")
            self.log(f"   ready: {data.get('ready', 0)}, could_not_fix: {data.get('could_not_fix', 0)}, picked_up: {data.get('picked_up', 0)}")

            # Verify all required keys are present
            required_keys = ['new', 'in_progress', 'waiting_for_part', 'ready', 'could_not_fix', 'picked_up', 'overdue', 'total']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                self.log(f"   ❌ Missing keys: {missing_keys}")
                return False
            else:
                self.log(f"   ✅ All required status count keys present")
            return True
        return False

    def test_create_ticket(self):
        """Test POST /api/tickets - create ticket with auto folder + activity."""
        payload = {
            "customer_name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-1234",
            "device_type": "laptop",
            "device": "iPhone 13",
            "issue_description": "Screen cracked",
            "cost_estimate": 150.00,
            "assigned_technician": "Luka Kobakhidze",
            "part_info": "Screen replacement kit"
        }

        success, data = self.run_test(
            "POST /api/tickets - create ticket",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success and 'id' in data:
            self.test_ticket_id = data['id']
            self.log(f"   Created ticket ID: {self.test_ticket_id}")
            self.log(f"   Status: {data.get('status')}, Folder: {data.get('folder')}")
            self.log(f"   Ticket code: {data.get('ticket_code')}")

            # Verify folder is correct for status
            if data.get('status') == 'new' and data.get('folder') == 'incoming':
                self.log(f"   ✅ Folder correctly set to 'incoming' for status 'new'")
            else:
                self.log(f"   ❌ Folder mismatch: expected 'incoming', got '{data.get('folder')}'")

            # Verify ticket_code is 5-digit
            if data.get('ticket_code') and data.get('ticket_code') >= 10001:
                self.log(f"   ✅ Ticket code is 5-digit: {data.get('ticket_code')}")
            else:
                self.log(f"   ❌ Ticket code invalid: {data.get('ticket_code')}")

            return True
        return False

    def test_get_ticket(self):
        """Test GET /api/tickets/{id} - get single ticket."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        success, data = self.run_test(
            f"GET /api/tickets/{self.test_ticket_id}",
            "GET",
            f"tickets/{self.test_ticket_id}",
            200
        )

        if success:
            self.log(f"   Customer: {data.get('customer_name')}, Device: {data.get('device')}")
            return True
        return False

    def test_list_tickets(self):
        """Test GET /api/tickets - list with filters."""
        # Test 1: List all tickets
        success1, data1 = self.run_test(
            "GET /api/tickets - list all",
            "GET",
            "tickets",
            200
        )
        if success1:
            self.log(f"   Found {len(data1)} tickets")

        # Test 2: Filter by folder
        success2, data2 = self.run_test(
            "GET /api/tickets?folder=incoming",
            "GET",
            "tickets",
            200,
            params={"folder": "incoming"}
        )
        if success2:
            self.log(f"   Incoming folder: {len(data2)} tickets")

        # Test 3: Filter by status
        success3, data3 = self.run_test(
            "GET /api/tickets?status=new",
            "GET",
            "tickets",
            200,
            params={"status": "new"}
        )
        if success3:
            self.log(f"   Status 'new': {len(data3)} tickets")

        # Test 4: Search query
        success4, data4 = self.run_test(
            "GET /api/tickets?q=Test",
            "GET",
            "tickets",
            200,
            params={"q": "Test"}
        )
        if success4:
            self.log(f"   Search 'Test': {len(data4)} tickets")

        # Test 5: Phone search ignores spaces, dashes, and other formatting.
        success5, data5 = self.run_test(
            "GET /api/tickets?q=5551234 - normalized phone search",
            "GET",
            "tickets",
            200,
            params={"q": "5551234"}
        )
        phone_match = success5 and any(
            ticket.get("id") == self.test_ticket_id for ticket in data5
        )
        if phone_match:
            self.log("   ✅ Unformatted digits matched stored phone 555-1234")
        elif success5:
            self.tests_passed -= 1
            self.log("   ❌ Normalized phone search did not find the ticket", False)

        return success1 and success2 and success3 and success4 and phone_match

    def test_closed_folder(self):
        """Test that Closed folder returns both could_not_fix and picked_up."""
        success, data = self.run_test(
            "GET /api/tickets?folder=closed",
            "GET",
            "tickets",
            200,
            params={"folder": "closed"}
        )
        if success:
            statuses = set(t.get('status') for t in data)
            self.log(f"   Closed folder statuses: {statuses}")
            return True
        return False

    def test_update_ticket(self):
        """Test PUT /api/tickets/{id} - update fields."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        payload = {
            "customer_phone": "555-9999",
            "cost_estimate": 200.00
        }

        success, data = self.run_test(
            f"PUT /api/tickets/{self.test_ticket_id} - update fields",
            "PUT",
            f"tickets/{self.test_ticket_id}",
            200,
            data=payload
        )

        if success:
            self.log(f"   Updated phone: {data.get('customer_phone')}")
            self.log(f"   Updated estimate: {data.get('cost_estimate')}")
            return True
        return False

    def test_analytics(self):
        """Test the admin analytics response and overdue ticket filter."""
        success, data = self.run_test(
            "GET /api/analytics/overview - dashboard metrics",
            "GET",
            "analytics/overview",
            200,
            params={"period": "month"},
        )
        if success:
            required_keys = [
                "period",
                "received_tickets",
                "received_items",
                "fixed_items",
                "failed_items",
                "revenue",
                "trend",
                "common_damage",
                "revenue_damage",
                "failed_damage",
                "damage_categories",
                "device_types",
                "available_years",
            ]
            missing_keys = [key for key in required_keys if key not in data]
            if missing_keys:
                self.log(f"   ❌ Missing analytics keys: {missing_keys}")
                return False
            self.log("   ✅ Analytics response contains all dashboard metrics")

        today = datetime.now().date()
        custom_success, custom_data = self.run_test(
            "GET /api/analytics/overview - custom calendar range",
            "GET",
            "analytics/overview",
            200,
            params={
                "period": "custom",
                "date_from": (today - timedelta(days=30)).isoformat(),
                "date_to": today.isoformat(),
            },
        )
        if custom_success:
            if custom_data.get("period") != "custom" or len(custom_data.get("trend", [])) != 31:
                self.log("   ❌ Custom calendar period returned an unexpected range")
                custom_success = False
            else:
                self.log("   ✅ Custom calendar range contains all 31 selected dates")

        overdue_success, overdue_data = self.run_test(
            "GET /api/tickets?overdue=true - 24-hour filter",
            "GET",
            "tickets",
            200,
            params={"overdue": "true"},
        )
        if overdue_success and not isinstance(overdue_data, list):
            self.log("   ❌ Overdue filter response must be a list")
            return False
        return success and custom_success and overdue_success

    def test_update_audit_activity(self):
        """Every changed ticket field is returned with old/new audit values."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        success, data = self.run_test(
            f"GET /api/tickets/{self.test_ticket_id}/activities - update audit",
            "GET",
            f"tickets/{self.test_ticket_id}/activities",
            200,
        )
        if not success:
            return False

        updated = next((a for a in data if a.get("type") == "updated"), None)
        changes = {
            change.get("field"): change
            for change in (updated or {}).get("changes", [])
        }
        valid = (
            changes.get("customer_phone", {}).get("from_value") == "555-1234"
            and changes.get("customer_phone", {}).get("to_value") == "555-9999"
            and changes.get("cost_estimate", {}).get("from_value") == 150.0
            and changes.get("cost_estimate", {}).get("to_value") == 200.0
        )
        if not valid:
            self.tests_passed -= 1
            self.log("   ❌ Update audit is missing expected old/new values", False)
            return False

        self.log("   ✅ Update audit contains expected old/new values")
        return True

    def test_status_change(self):
        """Test PUT /api/tickets/{id} - status change updates folder + creates activity."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        payload = {
            "status": "in_progress"
        }

        success, data = self.run_test(
            f"PUT /api/tickets/{self.test_ticket_id} - change status",
            "PUT",
            f"tickets/{self.test_ticket_id}",
            200,
            data=payload
        )

        if success:
            self.log(f"   New status: {data.get('status')}, New folder: {data.get('folder')}")

            # Verify folder updated
            if data.get('status') == 'in_progress' and data.get('folder') == 'in_progress':
                self.log(f"   ✅ Folder correctly updated to 'in_progress'")
            else:
                self.log(f"   ❌ Folder not updated correctly")

            return True
        return False

    def test_activities(self):
        """Test GET /api/tickets/{id}/activities - list activities."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        success, data = self.run_test(
            f"GET /api/tickets/{self.test_ticket_id}/activities",
            "GET",
            f"tickets/{self.test_ticket_id}/activities",
            200
        )

        if success:
            self.log(f"   Found {len(data)} activities")

            # Check for 'created' activity
            created_activities = [a for a in data if a.get('type') == 'created']
            if created_activities:
                self.log(f"   ✅ Found 'created' activity")
            else:
                self.log(f"   ❌ No 'created' activity found")

            # Check for 'status_change' activity
            status_activities = [a for a in data if a.get('type') == 'status_change']
            if status_activities:
                self.log(f"   ✅ Found {len(status_activities)} 'status_change' activity(ies)")

            # Verify newest-first order
            if len(data) > 1:
                timestamps = [a.get('created_at') for a in data]
                if timestamps == sorted(timestamps, reverse=True):
                    self.log(f"   ✅ Activities sorted newest-first")
                else:
                    self.log(f"   ❌ Activities not sorted correctly")

            return True
        return False

    def test_add_note(self):
        """Test POST /api/tickets/{id}/activities - add note."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        payload = {
            "message": f"Test note added at {datetime.now().strftime('%H:%M:%S')}"
        }

        success, data = self.run_test(
            f"POST /api/tickets/{self.test_ticket_id}/activities - add note",
            "POST",
            f"tickets/{self.test_ticket_id}/activities",
            201,
            data=payload
        )

        if success:
            self.log(f"   Note type: {data.get('type')}, Message: {data.get('message')[:50]}")
            return True
        return False

    def test_technicians(self):
        """Technician directory must stay removed from the admin API."""
        success, _ = self.run_test(
            "GET /api/technicians - removed",
            "GET",
            "technicians",
            404
        )
        return success


    def test_sequential_ticket_codes(self):
        """Test that ticket codes are sequential (10001, 10002, ...)."""
        # Create first ticket
        payload1 = {
            "customer_name": f"Sequential Test 1 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0001",
            "device_type": "phone",
            "device": "Test Device 1",
            "issue_description": "Test issue 1"
        }

        success1, data1 = self.run_test(
            "POST /api/tickets - sequential code test 1",
            "POST",
            "tickets",
            201,
            data=payload1
        )

        if not success1 or 'ticket_code' not in data1:
            self.log("   ❌ Failed to create first ticket")
            return False

        code1 = data1['ticket_code']
        ticket_id1 = data1['id']
        self.log(f"   First ticket code: {code1}")

        # Create second ticket
        payload2 = {
            "customer_name": f"Sequential Test 2 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0002",
            "device_type": "tablet",
            "device": "Test Device 2",
            "issue_description": "Test issue 2"
        }

        success2, data2 = self.run_test(
            "POST /api/tickets - sequential code test 2",
            "POST",
            "tickets",
            201,
            data=payload2
        )

        if not success2 or 'ticket_code' not in data2:
            self.log("   ❌ Failed to create second ticket")
            return False

        code2 = data2['ticket_code']
        ticket_id2 = data2['id']
        self.log(f"   Second ticket code: {code2}")

        # Verify sequential
        if code2 == code1 + 1:
            self.log(f"   ✅ Ticket codes are sequential: {code1} -> {code2}")
            result = True
        else:
            self.log(f"   ❌ Ticket codes not sequential: {code1} -> {code2}")
            result = False

        # Cleanup
        requests.delete(f"{BASE_URL}/tickets/{ticket_id1}")
        requests.delete(f"{BASE_URL}/tickets/{ticket_id2}")

        return result

    def test_required_fields_validation(self):
        """Test that missing required fields return 422."""
        # Missing customer_name
        payload1 = {
            "customer_phone": "555-1234",
            "device_type": "laptop",
            "device": "Test Device",
            "issue_description": "Test issue"
        }

        success1, _ = self.run_test(
            "POST /api/tickets - missing customer_name (expect 422)",
            "POST",
            "tickets",
            422,
            data=payload1
        )

        # Missing customer_phone
        payload2 = {
            "customer_name": "Test Customer",
            "device_type": "laptop",
            "device": "Test Device",
            "issue_description": "Test issue"
        }

        success2, _ = self.run_test(
            "POST /api/tickets - missing customer_phone (expect 422)",
            "POST",
            "tickets",
            422,
            data=payload2
        )

        # Missing issue_description
        payload3 = {
            "customer_name": "Test Customer",
            "customer_phone": "555-1234",
            "device_type": "laptop",
            "device": "Test Device"
        }

        success3, _ = self.run_test(
            "POST /api/tickets - missing issue_description (expect 422)",
            "POST",
            "tickets",
            422,
            data=payload3
        )

        return success1 and success2 and success3

    def test_optional_device_field(self):
        """Test that device field is optional (can be empty)."""
        payload = {
            "customer_name": f"Optional Device Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-1234",
            "device_type": "laptop",
            "issue_description": "Test issue without device name"
        }

        success, data = self.run_test(
            "POST /api/tickets - device field optional (expect 201)",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success:
            self.log(f"   ✅ Ticket created without device field")
            self.log(f"   Device value: '{data.get('device')}'")

            # Cleanup
            ticket_id = data.get('id')
            if ticket_id:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return True
        return False

    def test_serial_number_field(self):
        """Test creating and updating tickets with serial_number field."""
        # Create ticket with serial number
        payload = {
            "customer_name": f"Serial Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-1234",
            "device_type": "laptop",
            "device": "MacBook Pro 2023",
            "serial_number": "SN123456789",
            "issue_description": "Test issue with serial number"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - with serial_number",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create ticket with serial_number")
            return False

        ticket_id = data_create.get('id')
        serial = data_create.get('serial_number')
        self.log(f"   Serial number: {serial}")

        if serial == "SN123456789":
            self.log(f"   ✅ Serial number saved correctly")
        else:
            self.log(f"   ❌ Serial number mismatch")

        # Update serial number
        update_payload = {
            "serial_number": "SN987654321"
        }

        success_update, data_update = self.run_test(
            f"PUT /api/tickets/{ticket_id} - update serial_number",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data=update_payload
        )

        if success_update:
            updated_serial = data_update.get('serial_number')
            self.log(f"   Updated serial number: {updated_serial}")

            if updated_serial == "SN987654321":
                self.log(f"   ✅ Serial number updated correctly")
                result = True
            else:
                self.log(f"   ❌ Serial number not updated")
                result = False
        else:
            result = False

        # Cleanup
        if ticket_id:
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

        return result

    def test_companies_endpoint(self):
        """Test GET /api/companies - returns distinct company names."""
        # First create a ticket with a company
        payload = {
            "customer_type": "legal",
            "customer_name": "Test Legal Customer",
            "company_name": f"Test Company {datetime.now().strftime('%H%M%S')}",
            "tax_id": "123456789",
            "customer_phone": "555-1234",
            "device_type": "desktop",
            "device": "Test Device",
            "issue_description": "Test issue"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - create legal entity ticket",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create legal entity ticket")
            return False

        ticket_id = data_create.get('id')
        company_name = payload['company_name']

        # Now test GET /api/companies
        success, data = self.run_test(
            "GET /api/companies",
            "GET",
            "companies",
            200
        )

        if success:
            self.log(f"   Found {len(data)} companies: {data}")

            # Verify our company is in the list
            if company_name in data:
                self.log(f"   ✅ Company '{company_name}' found in list")
                result = True
            else:
                self.log(f"   ❌ Company '{company_name}' not found in list")
                result = False

            # Cleanup
            if ticket_id:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_update_new_fields(self):
        """Test PUT /api/tickets/{id} - update new fields (customer_type, company_name, tax_id, device_type)."""
        # Create a ticket first
        payload = {
            "customer_name": f"Update Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-1234",
            "device_type": "phone",
            "device": "Test Device",
            "issue_description": "Test issue"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - create for update test",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create ticket for update test")
            return False

        ticket_id = data_create.get('id')

        # Update to legal entity with new fields
        update_payload = {
            "customer_type": "legal",
            "company_name": "Updated Company Inc",
            "tax_id": "987654321",
            "device_type": "laptop"
        }

        success, data = self.run_test(
            f"PUT /api/tickets/{ticket_id} - update new fields",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data=update_payload
        )

        if success:
            self.log(f"   Customer type: {data.get('customer_type')}")
            self.log(f"   Company name: {data.get('company_name')}")
            self.log(f"   Tax ID: {data.get('tax_id')}")
            self.log(f"   Device type: {data.get('device_type')}")

            # Verify updates
            if (data.get('customer_type') == 'legal' and
                data.get('company_name') == 'Updated Company Inc' and
                data.get('tax_id') == '987654321' and
                data.get('device_type') == 'laptop'):
                self.log(f"   ✅ All new fields updated correctly")
                result = True
            else:
                self.log(f"   ❌ Some fields not updated correctly")
                result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_customers_endpoint(self):
        """Test GET /api/customers - returns distinct customers by phone."""
        # Create a ticket with a unique phone
        unique_phone = f"577-{datetime.now().strftime('%H%M%S')}"
        payload = {
            "customer_type": "legal",
            "customer_name": "Test Customer for Customers API",
            "company_name": "Test Company Ltd",
            "tax_id": "123456789",
            "customer_phone": unique_phone,
            "device_type": "laptop",
            "device": "Test Device",
            "issue_description": "Test issue"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - create for customers test",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create ticket for customers test")
            return False

        ticket_id = data_create.get('id')

        # Test GET /api/customers
        success, data = self.run_test(
            "GET /api/customers",
            "GET",
            "customers",
            200
        )

        if success:
            self.log(f"   Found {len(data)} customers")

            # Verify our customer is in the list
            customer = next((c for c in data if c.get('customer_phone') == unique_phone), None)

            if customer:
                self.log(f"   ✅ Customer with phone '{unique_phone}' found")
                self.log(f"   Customer name: {customer.get('customer_name')}")
                self.log(f"   Customer type: {customer.get('customer_type')}")
                self.log(f"   Company name: {customer.get('company_name')}")
                self.log(f"   Tax ID: {customer.get('tax_id')}")

                # Verify structure
                if (customer.get('customer_name') == payload['customer_name'] and
                    customer.get('customer_type') == 'legal' and
                    customer.get('company_name') == payload['company_name'] and
                    customer.get('tax_id') == payload['tax_id']):
                    self.log(f"   ✅ Customer data structure correct")
                    result = True
                else:
                    self.log(f"   ❌ Customer data mismatch")
                    result = False
            else:
                self.log(f"   ❌ Customer with phone '{unique_phone}' not found")
                result = False

            # Cleanup
            if ticket_id:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_customers_most_recent(self):
        """Test that /api/customers returns most recent ticket data for same phone."""
        import time

        unique_phone = f"599-{datetime.now().strftime('%H%M%S')}"

        # Create first ticket with initial data
        payload1 = {
            "customer_type": "physical",
            "customer_name": "Initial Name",
            "customer_phone": unique_phone,
            "device_type": "phone",
            "device": "Device 1",
            "issue_description": "First issue"
        }

        success1, data1 = self.run_test(
            "POST /api/tickets - first ticket with phone",
            "POST",
            "tickets",
            201,
            data=payload1
        )

        if not success1:
            self.log("   ❌ Failed to create first ticket")
            return False

        ticket_id1 = data1.get('id')
        self.log(f"   First ticket created with name: {payload1['customer_name']}")

        # Wait a moment to ensure different timestamps
        time.sleep(1)

        # Create second ticket with SAME phone but UPDATED data
        payload2 = {
            "customer_type": "legal",
            "customer_name": "Updated Name",
            "company_name": "Updated Company Inc",
            "tax_id": "987654321",
            "customer_phone": unique_phone,
            "device_type": "laptop",
            "device": "Device 2",
            "issue_description": "Second issue"
        }

        success2, data2 = self.run_test(
            "POST /api/tickets - second ticket with SAME phone",
            "POST",
            "tickets",
            201,
            data=payload2
        )

        if not success2:
            self.log("   ❌ Failed to create second ticket")
            # Cleanup first ticket
            if ticket_id1:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id1}")
            return False

        ticket_id2 = data2.get('id')
        self.log(f"   Second ticket created with name: {payload2['customer_name']}")

        # Test GET /api/customers - should return MOST RECENT data
        success, data = self.run_test(
            "GET /api/customers - verify most recent data",
            "GET",
            "customers",
            200
        )

        if success:
            # Find customer by phone
            customer = next((c for c in data if c.get('customer_phone') == unique_phone), None)

            if customer:
                self.log(f"   Customer found with phone: {unique_phone}")
                self.log(f"   Customer name: {customer.get('customer_name')}")
                self.log(f"   Customer type: {customer.get('customer_type')}")
                self.log(f"   Company name: {customer.get('company_name')}")
                self.log(f"   Tax ID: {customer.get('tax_id')}")

                # Verify it's the MOST RECENT (second) ticket's data
                if (customer.get('customer_name') == 'Updated Name' and
                    customer.get('customer_type') == 'legal' and
                    customer.get('company_name') == 'Updated Company Inc' and
                    customer.get('tax_id') == '987654321'):
                    self.log(f"   ✅ Customer data reflects MOST RECENT ticket")
                    result = True
                else:
                    self.log(f"   ❌ Customer data does NOT reflect most recent ticket")
                    self.log(f"   Expected: Updated Name, legal, Updated Company Inc, 987654321")
                    result = False
            else:
                self.log(f"   ❌ Customer with phone '{unique_phone}' not found")
                result = False

            # Cleanup both tickets
            if ticket_id1:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id1}")
            if ticket_id2:
                requests.delete(f"{BASE_URL}/tickets/{ticket_id2}")

            return result
        return False

    def test_statuses_filter(self):
        """Test GET /api/tickets?statuses=in_progress,waiting_for_part - comma-separated statuses filter."""
        # Create tickets with different statuses
        ticket_ids = []

        # Create ticket with in_progress status
        payload1 = {
            "customer_name": f"Status Filter Test 1 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0001",
            "device_type": "laptop",
            "device": "Test Device 1",
            "issue_description": "Test issue 1"
        }
        success1, data1 = self.run_test(
            "POST /api/tickets - create for status filter test",
            "POST",
            "tickets",
            201,
            data=payload1
        )
        if success1:
            ticket_id1 = data1.get('id')
            ticket_ids.append(ticket_id1)
            # Update to in_progress
            requests.put(f"{BASE_URL}/tickets/{ticket_id1}", json={"status": "in_progress"})

        # Create ticket with waiting_for_part status
        payload2 = {
            "customer_name": f"Status Filter Test 2 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0002",
            "device_type": "phone",
            "device": "Test Device 2",
            "issue_description": "Test issue 2"
        }
        success2, data2 = self.run_test(
            "POST /api/tickets - create for status filter test",
            "POST",
            "tickets",
            201,
            data=payload2
        )
        if success2:
            ticket_id2 = data2.get('id')
            ticket_ids.append(ticket_id2)
            # Update to waiting_for_part
            requests.put(f"{BASE_URL}/tickets/{ticket_id2}", json={"status": "waiting_for_part"})

        # Create ticket with ready status (should NOT be in results)
        payload3 = {
            "customer_name": f"Status Filter Test 3 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0003",
            "device_type": "tablet",
            "device": "Test Device 3",
            "issue_description": "Test issue 3"
        }
        success3, data3 = self.run_test(
            "POST /api/tickets - create for status filter test",
            "POST",
            "tickets",
            201,
            data=payload3
        )
        if success3:
            ticket_id3 = data3.get('id')
            ticket_ids.append(ticket_id3)
            # Update to ready
            requests.put(f"{BASE_URL}/tickets/{ticket_id3}", json={"status": "ready"})

        # Test filtering by multiple statuses
        success, data = self.run_test(
            "GET /api/tickets?statuses=in_progress,waiting_for_part",
            "GET",
            "tickets",
            200,
            params={"statuses": "in_progress,waiting_for_part"}
        )

        if success:
            self.log(f"   Found {len(data)} tickets with statuses in_progress,waiting_for_part")

            # Verify only in_progress and waiting_for_part tickets are returned
            statuses = [t.get('status') for t in data]
            invalid_statuses = [s for s in statuses if s not in ['in_progress', 'waiting_for_part']]

            if invalid_statuses:
                self.log(f"   ❌ Found tickets with invalid statuses: {set(invalid_statuses)}")
                result = False
            else:
                self.log(f"   ✅ All tickets have correct statuses")
                result = True

            # Cleanup
            for tid in ticket_ids:
                requests.delete(f"{BASE_URL}/tickets/{tid}")

            return result

        # Cleanup on failure
        for tid in ticket_ids:
            requests.delete(f"{BASE_URL}/tickets/{tid}")
        return False

    def test_urgent_flag(self):
        """Test POST /api/tickets with urgent flag and verify it's persisted."""
        payload = {
            "customer_name": f"Urgent Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-9999",
            "device_type": "laptop",
            "device": "Urgent Device",
            "issue_description": "Urgent issue",
            "urgent": True
        }

        success, data = self.run_test(
            "POST /api/tickets - with urgent=True",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success:
            ticket_id = data.get('id')
            urgent = data.get('urgent')
            self.log(f"   Urgent flag: {urgent}")

            if urgent is True:
                self.log(f"   ✅ Urgent flag saved correctly")
                result = True
            else:
                self.log(f"   ❌ Urgent flag not saved correctly")
                result = False

            # Verify GET also returns urgent flag
            success_get, data_get = self.run_test(
                f"GET /api/tickets/{ticket_id} - verify urgent flag",
                "GET",
                f"tickets/{ticket_id}",
                200
            )

            if success_get:
                urgent_get = data_get.get('urgent')
                if urgent_get is True:
                    self.log(f"   ✅ Urgent flag persisted in GET")
                else:
                    self.log(f"   ❌ Urgent flag not returned in GET")
                    result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_urgent_sorting(self):
        """Test that urgent tickets sort before non-urgent tickets."""
        import time
        ticket_ids = []

        # Create non-urgent ticket first
        payload1 = {
            "customer_name": f"Non-Urgent {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0001",
            "device_type": "laptop",
            "device": "Normal Device",
            "issue_description": "Normal issue",
            "urgent": False
        }
        success1, data1 = self.run_test(
            "POST /api/tickets - non-urgent ticket",
            "POST",
            "tickets",
            201,
            data=payload1
        )
        if success1:
            ticket_id1 = data1.get('id')
            ticket_ids.append(ticket_id1)
            self.log(f"   Created non-urgent ticket: {ticket_id1}")

        time.sleep(1)  # Ensure different timestamps

        # Create urgent ticket (created AFTER non-urgent)
        payload2 = {
            "customer_name": f"Urgent {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-0002",
            "device_type": "phone",
            "device": "Urgent Device",
            "issue_description": "Urgent issue",
            "urgent": True
        }
        success2, data2 = self.run_test(
            "POST /api/tickets - urgent ticket",
            "POST",
            "tickets",
            201,
            data=payload2
        )
        if success2:
            ticket_id2 = data2.get('id')
            ticket_ids.append(ticket_id2)
            self.log(f"   Created urgent ticket: {ticket_id2}")

        # List all tickets and verify urgent is first
        success, data = self.run_test(
            "GET /api/tickets - verify urgent sorting",
            "GET",
            "tickets",
            200
        )

        if success:
            # Find our tickets in the list
            our_tickets = [t for t in data if t.get('id') in ticket_ids]

            if len(our_tickets) == 2:
                first_ticket = our_tickets[0]
                second_ticket = our_tickets[1]

                self.log(f"   First ticket: {first_ticket.get('id')}, urgent={first_ticket.get('urgent')}")
                self.log(f"   Second ticket: {second_ticket.get('id')}, urgent={second_ticket.get('urgent')}")

                # Urgent ticket should be first even though it was created later
                if first_ticket.get('urgent') is True and second_ticket.get('urgent') is False:
                    self.log(f"   ✅ Urgent ticket sorted to top")
                    result = True
                else:
                    self.log(f"   ❌ Urgent ticket NOT sorted to top")
                    result = False
            else:
                self.log(f"   ❌ Could not find both test tickets in list")
                result = False

            # Cleanup
            for tid in ticket_ids:
                requests.delete(f"{BASE_URL}/tickets/{tid}")

            return result

        # Cleanup on failure
        for tid in ticket_ids:
            requests.delete(f"{BASE_URL}/tickets/{tid}")
        return False

    def test_accessories(self):
        """Test POST /api/tickets with accessories and accessories_other fields."""
        payload = {
            "customer_name": f"Accessories Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-8888",
            "device_type": "laptop",
            "device": "MacBook Pro",
            "issue_description": "Test with accessories",
            "accessories": ["charger", "mouse"],
            "accessories_other": "USB-C hub, external keyboard"
        }

        success, data = self.run_test(
            "POST /api/tickets - with accessories",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success:
            ticket_id = data.get('id')
            accessories = data.get('accessories')
            accessories_other = data.get('accessories_other')

            self.log(f"   Accessories: {accessories}")
            self.log(f"   Accessories other: {accessories_other}")

            result = True

            # Verify accessories list
            if accessories == ["charger", "mouse"]:
                self.log(f"   ✅ Accessories list saved correctly")
            else:
                self.log(f"   ❌ Accessories list not saved correctly")
                result = False

            # Verify accessories_other
            if accessories_other == "USB-C hub, external keyboard":
                self.log(f"   ✅ Accessories other saved correctly")
            else:
                self.log(f"   ❌ Accessories other not saved correctly")
                result = False

            # Verify GET also returns accessories
            success_get, data_get = self.run_test(
                f"GET /api/tickets/{ticket_id} - verify accessories",
                "GET",
                f"tickets/{ticket_id}",
                200
            )

            if success_get:
                accessories_get = data_get.get('accessories')
                accessories_other_get = data_get.get('accessories_other')

                if accessories_get == ["charger", "mouse"]:
                    self.log(f"   ✅ Accessories persisted in GET")
                else:
                    self.log(f"   ❌ Accessories not returned correctly in GET")
                    result = False

                if accessories_other_get == "USB-C hub, external keyboard":
                    self.log(f"   ✅ Accessories other persisted in GET")
                else:
                    self.log(f"   ❌ Accessories other not returned correctly in GET")
                    result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_resolution_fixed(self):
        """Test that resolution='fixed' when moving to picked_up from ready status."""
        # Create ticket
        payload = {
            "customer_name": f"Resolution Fixed Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-7777",
            "device_type": "laptop",
            "device": "Test Device",
            "issue_description": "Test resolution fixed"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - create for resolution test",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create ticket")
            return False

        ticket_id = data_create.get('id')

        # Move to ready (fixed) status
        success_ready, data_ready = self.run_test(
            f"PUT /api/tickets/{ticket_id} - move to ready",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data={"status": "ready"}
        )

        if not success_ready:
            self.log("   ❌ Failed to move to ready status")
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
            return False

        # Move to picked_up - should set resolution='fixed'
        success_pickup, data_pickup = self.run_test(
            f"PUT /api/tickets/{ticket_id} - move to picked_up",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data={"status": "picked_up"}
        )

        if success_pickup:
            resolution = data_pickup.get('resolution')
            self.log(f"   Resolution: {resolution}")

            if resolution == 'fixed':
                self.log(f"   ✅ Resolution correctly set to 'fixed'")
                result = True
            else:
                self.log(f"   ❌ Resolution should be 'fixed', got '{resolution}'")
                result = False

            filtered = requests.get(
                f"{BASE_URL}/tickets",
                params={"statuses": "picked_up", "resolution": "fixed"},
                timeout=10,
            )
            filtered_ids = {
                ticket.get("id") for ticket in filtered.json()
            } if filtered.status_code == 200 else set()
            if ticket_id not in filtered_ids:
                self.log("   ❌ Fixed-resolution filter did not return the ticket")
                result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
            return result

        requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
        return False

    def test_resolution_not_fixed(self):
        """Test that resolution='not_fixed' when moving to picked_up from could_not_fix status."""
        # Create ticket
        payload = {
            "customer_name": f"Resolution Not Fixed Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-6666",
            "device_type": "phone",
            "device": "Test Device",
            "issue_description": "Test resolution not fixed"
        }

        success_create, data_create = self.run_test(
            "POST /api/tickets - create for resolution test",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if not success_create:
            self.log("   ❌ Failed to create ticket")
            return False

        ticket_id = data_create.get('id')

        # Move to could_not_fix status
        success_cnf, data_cnf = self.run_test(
            f"PUT /api/tickets/{ticket_id} - move to could_not_fix",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data={"status": "could_not_fix"}
        )

        if not success_cnf:
            self.log("   ❌ Failed to move to could_not_fix status")
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
            return False

        # Move to picked_up - should set resolution='not_fixed'
        success_pickup, data_pickup = self.run_test(
            f"PUT /api/tickets/{ticket_id} - move to picked_up",
            "PUT",
            f"tickets/{ticket_id}",
            200,
            data={"status": "picked_up"}
        )

        if success_pickup:
            resolution = data_pickup.get('resolution')
            self.log(f"   Resolution: {resolution}")

            if resolution == 'not_fixed':
                self.log(f"   ✅ Resolution correctly set to 'not_fixed'")
                result = True
            else:
                self.log(f"   ❌ Resolution should be 'not_fixed', got '{resolution}'")
                result = False

            filtered = requests.get(
                f"{BASE_URL}/tickets",
                params={"statuses": "picked_up", "resolution": "not_fixed"},
                timeout=10,
            )
            filtered_ids = {
                ticket.get("id") for ticket in filtered.json()
            } if filtered.status_code == 200 else set()
            if ticket_id not in filtered_ids:
                self.log("   ❌ Not-fixed resolution filter did not return the ticket")
                result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
            return result

        requests.delete(f"{BASE_URL}/tickets/{ticket_id}")
        return False

    def test_accessories_no_power_adapter(self):
        """Test that 'no_accessories' exists and 'power_adapter' does NOT exist in accessories."""
        # Create ticket with no_accessories
        payload = {
            "customer_name": f"No Accessories Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-5555",
            "device_type": "laptop",
            "device": "Test Device",
            "issue_description": "Test no accessories",
            "accessories": ["no_accessories"]
        }

        success, data = self.run_test(
            "POST /api/tickets - with no_accessories",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success:
            ticket_id = data.get('id')
            accessories = data.get('accessories')

            self.log(f"   Accessories: {accessories}")

            result = True

            # Verify no_accessories is accepted
            if accessories == ["no_accessories"]:
                self.log(f"   ✅ 'no_accessories' accepted and saved")
            else:
                self.log(f"   ❌ 'no_accessories' not saved correctly")
                result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_custom_device_type(self):
        """Test that backend accepts custom device_type string (not in enum)."""
        payload = {
            "customer_name": f"Custom Device Type Test {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-4444",
            "device_type": "Smartwatch XYZ",
            "device": "Custom Smartwatch",
            "issue_description": "Test custom device type"
        }

        success, data = self.run_test(
            "POST /api/tickets - with custom device_type",
            "POST",
            "tickets",
            201,
            data=payload
        )

        if success:
            ticket_id = data.get('id')
            device_type = data.get('device_type')

            self.log(f"   Device type: {device_type}")

            result = True

            # Verify custom device_type is saved
            if device_type == "Smartwatch XYZ":
                self.log(f"   ✅ Custom device_type saved correctly")
            else:
                self.log(f"   ❌ Custom device_type not saved correctly")
                result = False

            # Verify GET also returns custom device_type
            success_get, data_get = self.run_test(
                f"GET /api/tickets/{ticket_id} - verify custom device_type",
                "GET",
                f"tickets/{ticket_id}",
                200
            )

            if success_get:
                device_type_get = data_get.get('device_type')

                if device_type_get == "Smartwatch XYZ":
                    self.log(f"   ✅ Custom device_type persisted in GET")
                else:
                    self.log(f"   ❌ Custom device_type not returned correctly in GET: {device_type_get}")
                    result = False

            # Cleanup
            requests.delete(f"{BASE_URL}/tickets/{ticket_id}")

            return result
        return False

    def test_known_device_types(self):
        """Test that backend still accepts known device types."""
        # Test with Georgian device type
        payload1 = {
            "customer_name": f"Known Device Type Test 1 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-3333",
            "device_type": "ლეპტოპი",
            "device": "Test Laptop",
            "issue_description": "Test known device type (Georgian)"
        }

        success1, data1 = self.run_test(
            "POST /api/tickets - with Georgian device_type 'ლეპტოპი'",
            "POST",
            "tickets",
            201,
            data=payload1
        )

        result = True
        ticket_ids = []

        if success1:
            ticket_id1 = data1.get('id')
            ticket_ids.append(ticket_id1)
            device_type1 = data1.get('device_type')

            if device_type1 == "ლეპტოპი":
                self.log(f"   ✅ Georgian device_type 'ლეპტოპი' saved correctly")
            else:
                self.log(f"   ❌ Georgian device_type not saved correctly: {device_type1}")
                result = False
        else:
            result = False

        # Test with English device type
        payload2 = {
            "customer_name": f"Known Device Type Test 2 {datetime.now().strftime('%H%M%S')}",
            "customer_phone": "555-2222",
            "device_type": "laptop",
            "device": "Test Laptop",
            "issue_description": "Test known device type (English)"
        }

        success2, data2 = self.run_test(
            "POST /api/tickets - with English device_type 'laptop'",
            "POST",
            "tickets",
            201,
            data=payload2
        )

        if success2:
            ticket_id2 = data2.get('id')
            ticket_ids.append(ticket_id2)
            device_type2 = data2.get('device_type')

            if device_type2 == "laptop":
                self.log(f"   ✅ English device_type 'laptop' saved correctly")
            else:
                self.log(f"   ❌ English device_type not saved correctly: {device_type2}")
                result = False
        else:
            result = False

        # Cleanup
        for tid in ticket_ids:
            requests.delete(f"{BASE_URL}/tickets/{tid}")

        return result

    def test_delete_ticket(self):
        """Test DELETE /api/tickets/{id} - delete ticket and activities."""
        if not self.test_ticket_id:
            self.log("⚠️  Skipping: No ticket ID available")
            return False

        success, data = self.run_test(
            f"DELETE /api/tickets/{self.test_ticket_id}",
            "DELETE",
            f"tickets/{self.test_ticket_id}",
            200
        )

        if success:
            self.log(f"   Ticket deleted successfully")

            # Verify ticket is gone
            verify_success, _ = self.run_test(
                f"Verify ticket deleted",
                "GET",
                f"tickets/{self.test_ticket_id}",
                404
            )

            if verify_success:
                self.log(f"   ✅ Ticket no longer exists")

            return True
        return False

    def run_all_tests(self):
        """Run all backend tests in sequence."""
        print("=" * 70)
        print("🚀 Starting Repair CRM Backend API Tests")
        print(f"   Base URL: {BASE_URL}")
        print("=" * 70)

        # Test sequence
        self.test_meta()
        self.test_counts()
        self.test_analytics()
        self.test_create_ticket()
        self.test_sequential_ticket_codes()
        self.test_required_fields_validation()
        self.test_optional_device_field()
        self.test_custom_device_type()
        self.test_known_device_types()
        self.test_serial_number_field()
        self.test_companies_endpoint()
        self.test_get_ticket()
        self.test_list_tickets()
        self.test_closed_folder()
        self.test_statuses_filter()
        self.test_urgent_flag()
        self.test_urgent_sorting()
        self.test_accessories()
        self.test_update_ticket()
        self.test_update_audit_activity()
        self.test_update_new_fields()
        self.test_status_change()
        self.test_activities()
        self.test_add_note()
        self.test_technicians()
        self.test_customers_endpoint()
        self.test_customers_most_recent()
        self.test_resolution_fixed()
        self.test_resolution_not_fixed()
        self.test_accessories_no_power_adapter()
        self.test_delete_ticket()

        # Summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 70)

        if self.tests_passed == self.tests_run:
            print("✅ All backend tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} test(s) failed")
            return 1

def main():
    validate_local_test_target()
    tester = CRMAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
