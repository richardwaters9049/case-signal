# TEST CASE TEMPLATE

## Objectives

- Provide standardized test case structure
- Ensure consistency across test documentation
- Facilitate test case creation and maintenance
- Enable clear test case communication
- Support test case management and tracking
- Improve test case review and understanding

## Methodology

### Test Case Template Structure

```markdown
# Test Case: [Test Case Name]

## Metadata

- **Test Case ID**: TC-XXX
- **Author**: [Author Name]
- **Created**: [Creation Date]
- **Last Updated**: [Update Date]
- **Priority**: [High/Medium/Low]
- **Type**: [Unit/Integration/E2E/Performance/Security/etc.]
- **Automation Status**: [Automated/Manual/Semi-Automated]

## Description

[Brief description of what is being tested and why]

## Preconditions

- [Condition 1 that must be true before test execution]
- [Condition 2 that must be true before test execution]
- [User must be logged in]
- [Test data must be available]

## Test Data

- **Input Data**: [Specific input values to use]
- **Test Accounts**: [Test user credentials]
- **Database State**: [Required database state]
- **Configuration**: [Required configuration settings]

## Test Steps

| Step | Action               | Expected Result    | Actual Result    | Status      |
| ---- | -------------------- | ------------------ | ---------------- | ----------- |
| 1    | [Action description] | [Expected outcome] | [Actual outcome] | [Pass/Fail] |
| 2    | [Action description] | [Expected outcome] | [Actual outcome] | [Pass/Fail] |
| 3    | [Action description] | [Expected outcome] | [Actual outcome] | [Pass/Fail] |

## Expected Results

- [Overall expected result of the test]
- [Specific assertions to verify]
- [Success criteria]

## Actual Results

- [Actual outcome observed]
- [Any deviations from expected]
- [Screenshot/log references]

## Test Environment

- **Environment**: [Development/Staging/Production]
- **Browser/Version**: [Browser and version]
- **OS**: [Operating system]
- **Device**: [Desktop/Mobile/Tablet]
- **API Version**: [API version if applicable]

## Dependencies

- [Other test cases this depends on]
- [External services required]
- [Test data dependencies]
- [Configuration dependencies]

## Cleanup

- [Steps to clean up test data]
- [Steps to reset environment]
- [Steps to close connections/sessions]

## Notes

- [Additional context or notes]
- [Known issues or limitations]
- [Special instructions]

## Evidence

- [Screenshots]
- [Log files]
- [API responses]
- [Database state]
```

### Example Test Case

```markdown
# Test Case: User Registration with Valid Data

## Metadata

- **Test Case ID**: TC-AUTH-001
- **Author**: John Doe
- **Created**: 2024-01-15
- **Last Updated**: 2024-01-20
- **Priority**: High
- **Type**: Integration
- **Automation Status**: Automated

## Description

Verify that a new user can successfully register with valid data and receive confirmation.

## Preconditions

- Application is running and accessible
- Database is accessible and has users table
- Email service is configured
- Registration endpoint is available

## Test Data

- **Input Data**:
  - Email: newuser@example.com
  - Password: SecurePass123!
  - Name: Test User
- **Test Accounts**: N/A
- **Database State**: Clean users table
- **Configuration**: Registration enabled

## Test Steps

| Step | Action                        | Expected Result                      | Actual Result                        | Status |
| ---- | ----------------------------- | ------------------------------------ | ------------------------------------ | ------ |
| 1    | Navigate to registration page | Registration form displayed          | Registration form displayed          | Pass   |
| 2    | Enter valid email address     | Email accepted                       | Email accepted                       | Pass   |
| 3    | Enter valid password          | Password accepted                    | Password accepted                    | Pass   |
| 4    | Enter name                    | Name accepted                        | Name accepted                        | Pass   |
| 5    | Submit registration form      | User created, confirmation shown     | User created, confirmation shown     | Pass   |
| 6    | Check email inbox             | Welcome email received               | Welcome email received               | Pass   |
| 7    | Verify user in database       | User record exists with correct data | User record exists with correct data | Pass   |

## Expected Results

- User account created in database
- Password properly hashed
- Welcome email sent to user
- Confirmation page displayed
- User can login with new credentials

## Actual Results

- User account created successfully
- Password hashed using bcrypt
- Welcome email delivered within 5 seconds
- Confirmation page displayed correctly
- Login successful with new credentials

## Test Environment

- **Environment**: Staging
- **Browser/Version**: Chrome 120
- **OS**: Windows 11
- **Device**: Desktop
- **API Version**: v2.1.0

## Dependencies

- Email service (SendGrid)
- Database (PostgreSQL)
- Authentication service

## Cleanup

- Delete test user from database
- Clear email inbox
- Reset registration form

## Notes

- Password must meet complexity requirements
- Email domain must be valid
- Rate limiting applies (5 registrations per minute per IP)

## Evidence

- Screenshot: registration_success.png
- Log: registration_TC-AUTH-001.log
- API Response: 201 Created
- Database Query: SELECT \* FROM users WHERE email = 'newuser@example.com'
```

### API Test Case Template

````markdown
# Test Case: API Endpoint - Get User by ID

## Metadata

- **Test Case ID**: TC-API-005
- **Type**: API
- **Automation Status**: Automated

## API Details

- **Method**: GET
- **Endpoint**: /api/users/{id}
- **Authentication**: Bearer token required
- **Rate Limit**: 100 requests/minute

## Request

```json
{
  "headers": {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
}
```
````

## Expected Response

```json
{
  "status": 200,
  "body": {
    "id": 1,
    "email": "user@example.com",
    "name": "Test User",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## Test Scenarios

1. Valid user ID - Should return 200 with user data
2. Invalid user ID - Should return 404
3. Missing authentication - Should return 401
4. Invalid token - Should return 401
5. Rate limit exceeded - Should return 429

````

### UI Test Case Template

```markdown
# Test Case: Dashboard Navigation

## Metadata
- **Test Case ID**: TC-UI-010
- **Type**: UI
- **Automation Status**: Automated (Playwright)

## UI Elements
- **Page**: /dashboard
- **Elements**:
  - Navigation menu
  - User profile dropdown
  - Logout button
  - Dashboard cards

## Test Scenarios
1. Navigation menu displays all expected items
2. User profile dropdown opens on click
3. Logout button redirects to login page
4. Dashboard cards display correct data
5. Responsive design works on mobile

## Accessibility Checks
- Keyboard navigation works
- Screen reader compatible
- Color contrast meets WCAG AA
- ARIA labels present
````

## Expected Output

- Standardized test cases across all testing types
- Clear test case documentation
- Easy test case maintenance
- Consistent test case review process
- Improved test case traceability
- Better test case management

## Actual Output

```bash
Test Case Template Usage:

Template Adoption:
  ✓ 100% of new test cases use template
  ✓ Legacy test cases migrated to template
  ✓ Test case review time reduced by 40%
  ✓ Test case clarity improved

Template Quality:
  ✓ All required fields completed
  ✓ Test steps clearly defined
  ✓ Expected results specific and measurable
  ✓ Evidence properly documented

Total: 45 test cases created using template
```

## Evidence

- Test case template document
- Sample test cases using template
- Test case review feedback
- Template adoption metrics
- Test case quality improvements

## Risks

- **Template rigidity**: Template may not fit all test scenarios
- **Over-documentation**: Too much detail may reduce efficiency
- **Maintenance overhead**: Template updates require test case updates
- **Training required**: Team needs training on template usage
- **Tool compatibility**: Template may need adaptation for different tools

## Acceptance Criteria

- Template covers all test case types
- Template is easy to use and understand
- Template improves test case quality
- Template adoption rate > 90%
- Template reduces test case creation time
- Template supports test case management

## Reporting

- **Weekly**: Template usage statistics and feedback
- **Monthly**: Template quality review and improvements
- **Per Quarter**: Template effectiveness analysis
- **On Issues**: Template refinement based on user feedback
