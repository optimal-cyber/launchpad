# eMASS API Integration Guide

## Overview

The Optimal Platform includes an eMASS API integration to support DoD/DoW ATO (Authority to Operate) workflows. This integration allows systems and applications to communicate with an eMASS API server for managing authorization packages, POA&Ms, controls, and artifacts.

## Configuration

To use the eMASS integration, you need to configure the following environment variables:

```bash
# Required
EMASS_BASE_URL=https://emass.apps.mil  # Your eMASS instance URL
EMASS_API_KEY=your-api-key-here        # Your eMASS API key

# Optional
EMASS_USER_ID=your-user-id              # Your eMASS user ID
EMASS_USER_UID=your-user-uid            # Your eMASS user UID
```

For Next.js frontend access (if needed):
```bash
NEXT_PUBLIC_EMASS_BASE_URL=https://emass.apps.mil
```

## API Endpoints

### Systems

#### Get All Systems
```typescript
GET /api/emass/systems
```

Returns a list of all systems in eMASS.

#### Get System by ID
```typescript
GET /api/emass/systems/{systemId}
```

Returns details for a specific system.

#### Create System
```typescript
POST /api/emass/systems
Content-Type: application/json

{
  "systemName": "System Name",
  "systemAcronym": "SN",
  "systemOwnerName": "John Doe",
  "systemOwnerEmail": "john.doe@example.com",
  ...
}
```

#### Update System
```typescript
PUT /api/emass/systems/{systemId}
Content-Type: application/json

{
  "authorizationStatus": "Authorized",
  ...
}
```

### POA&Ms

#### Get POA&Ms for a System
```typescript
GET /api/emass/systems/{systemId}/poams
```

Returns all POA&M items for a system.

#### Create POA&M
```typescript
POST /api/emass/systems/{systemId}/poams
Content-Type: application/json

{
  "controlAcronym": "AC-2",
  "weaknessName": "Account Management Issue",
  "weaknessDescription": "Detailed description...",
  "severity": "high",
  "remediation": "Remediation plan...",
  "scheduledCompletionDate": "2025-12-31",
  "status": "open",
  "milestones": [
    {
      "description": "Milestone 1",
      "scheduledCompletionDate": "2025-11-30",
      "status": "pending"
    }
  ]
}
```

#### Update POA&M
```typescript
PUT /api/emass/systems/{systemId}/poams/{poamId}
Content-Type: application/json

{
  "status": "ongoing",
  ...
}
```

### Authorization

#### Get Authorization Status
```typescript
GET /api/emass/systems/{systemId}/authorization
```

Returns the current authorization status, dates, and next assessment date.

#### Submit for Authorization
```typescript
POST /api/emass/systems/{systemId}/authorization
```

Submits the system for authorization review.

## Usage Example

### In a React Component

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function EmassSystemsPage() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSystems() {
      try {
        const response = await fetch('/api/emass/systems');
        const data = await response.json();
        if (data.success) {
          setSystems(data.data);
        }
      } catch (error) {
        console.error('Error fetching systems:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSystems();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>eMASS Systems</h1>
      <ul>
        {systems.map((system) => (
          <li key={system.systemId}>
            {system.systemName} ({system.systemAcronym}) - {system.authorizationStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Syncing POA&Ms from Optimal to eMASS

```typescript
async function syncPOAMToEmass(poamItem: POAMItem, emassSystemId: number) {
  const response = await fetch(`/api/emass/systems/${emassSystemId}/poams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      controlAcronym: poamItem.controlId,
      weaknessName: poamItem.weakness,
      weaknessDescription: poamItem.weakness,
      severity: poamItem.severity,
      remediation: poamItem.remediation,
      scheduledCompletionDate: poamItem.scheduledCompletionDate,
      status: poamItem.status,
      milestones: poamItem.milestones.map(m => ({
        description: m.description,
        scheduledCompletionDate: m.scheduledDate,
        status: m.status,
      })),
    }),
  });
  
  return await response.json();
}
```

## Integration with Optimal Platform Features

### From POA&M Page

The POA&M page can sync items to eMASS:

1. Select POA&M items
2. Click "Sync to eMASS"
3. Select the target eMASS system
4. Items are created/updated in eMASS

### From Vulnerabilities

Vulnerabilities can be automatically converted to POA&Ms and synced:

1. Select vulnerabilities
2. Click "Create POA&M"
3. Optionally select "Sync to eMASS"
4. POA&Ms are created in both Optimal and eMASS

### From OSCAL SSP

The OSCAL SSP can be exported and uploaded to eMASS as an artifact:

1. Navigate to OSCAL SSP page
2. Click "Export"
3. Use the eMASS integration to upload as an artifact

## Error Handling

All API endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common errors:
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: System or resource not found
- `500 Internal Server Error`: eMASS server error

## Security Considerations

1. **API Keys**: Never commit API keys to version control. Use environment variables or a secrets management system.

2. **HTTPS**: Always use HTTPS when connecting to eMASS instances.

3. **User Context**: Include user ID/UID headers when available for audit trails.

4. **Rate Limiting**: Be aware of eMASS API rate limits and implement appropriate throttling.

## Additional Resources

- eMASS API Documentation: See `apps/portal/(U)eMASS_API_Documentation_November 2024.pdf`
- eMASS Official Documentation: https://emass.apps.mil

