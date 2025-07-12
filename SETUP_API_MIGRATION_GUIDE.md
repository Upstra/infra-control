# Setup API Migration Guide

## Overview

This document outlines the backend changes for the new multi-resource setup wizard. The backend now supports bulk operations for creating multiple resources in a single transaction, improving performance and ensuring data consistency.

## What's New

### 1. Enhanced SetupStep Enum

The `SetupStep` enum has been updated with new steps while maintaining backward compatibility:

```typescript
export enum SetupStep {
  // New steps
  WELCOME = 'welcome',
  RESOURCE_PLANNING = 'planning',      // NEW
  ROOMS_CONFIG = 'rooms',              // NEW
  UPS_CONFIG = 'ups',                  // NEW
  SERVERS_CONFIG = 'servers',          // NEW
  RELATIONSHIPS = 'relationships',     // NEW
  REVIEW = 'review',                   // NEW
  COMPLETE = 'complete',
  
  // Deprecated - Still supported for backward compatibility
  CREATE_ROOM = 'create-room',         // DEPRECATED
  CREATE_UPS = 'create-ups',           // DEPRECATED
  CREATE_SERVER = 'create-server',     // DEPRECATED
  VM_DISCOVERY = 'vm-discovery',       // DEPRECATED
}
```

### 2. New Endpoints

#### Bulk Create Resources
**Endpoint:** `POST /api/setup/bulk`  
**Guards:** JwtAuthGuard, AdminGuard  
**Purpose:** Create multiple rooms, UPS, and servers in a single transaction

```typescript
// Request
{
  rooms: [
    { name: string; tempId?: string }
  ],
  upsList: [
    { 
      name: string; 
      ip?: string;
      roomId?: string;  // Can be temp ID
      tempId?: string 
    }
  ],
  servers: [
    {
      name: string;
      state: string;
      grace_period_on: number;
      grace_period_off: number;
      adminUrl: string;
      ip: string;
      login: string;
      password: string;
      type: string;
      priority: number;
      roomId?: string;     // Can be temp ID
      upsId?: string;      // Can be temp ID
      groupId?: string;
      ilo_name?: string;
      ilo_ip?: string;
      ilo_login?: string;
      ilo_password?: string;
      tempId?: string;
    }
  ],
  idMapping?: {
    rooms: { [tempId: string]: string };
    ups: { [tempId: string]: string };
  }
}

// Response
{
  success: boolean;
  created: {
    rooms: Array<{ id: string; name: string; tempId?: string }>;
    upsList: Array<{ id: string; name: string; tempId?: string }>;
    servers: Array<{ id: string; name: string; tempId?: string }>;
  };
  errors?: Array<{
    resource: 'room' | 'ups' | 'server';
    name: string;
    error: string;
  }>;
  idMapping: {
    rooms: { [tempId: string]: string };    // Temp ID -> Real ID
    ups: { [tempId: string]: string };      // Temp ID -> Real ID
  };
}
```

#### Validate Resources
**Endpoint:** `POST /api/setup/validate`  
**Guards:** JwtAuthGuard, AdminGuard  
**Purpose:** Validate resources before creation and optionally test connectivity

```typescript
// Request
{
  resources: {
    rooms: Array<BulkRoomDto>;
    upsList: Array<BulkUpsDto>;
    servers: Array<BulkServerDto>;
  };
  checkConnectivity?: boolean;
}

// Response
{
  valid: boolean;
  errors: Array<{
    resource: 'room' | 'ups' | 'server';
    index: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    resource: 'room' | 'ups' | 'server';
    index: number;
    message: string;
  }>;
  connectivityResults?: {
    ups: Array<{ index: number; ip: string; accessible: boolean }>;
    servers: Array<{ 
      index: number; 
      ip: string; 
      accessible: boolean;
      iloIp?: string;
      iloAccessible?: boolean;
    }>;
  };
}
```

#### Get Templates
**Endpoint:** `GET /api/setup/templates`  
**Guards:** JwtAuthGuard  
**Purpose:** Retrieve available setup templates

```typescript
// Response
{
  templates: Array<{
    id: string;
    name: string;
    description: string;
    type: 'predefined' | 'custom' | 'shared';
    configuration: {
      rooms: Array<Partial<BulkRoomDto>>;
      upsList: Array<Partial<BulkUpsDto>>;
      servers: Array<Partial<BulkServerDto>>;
    };
    createdAt: Date;
    createdBy?: string;
  }>;
}
```

#### Create Template
**Endpoint:** `POST /api/setup/templates`  
**Guards:** JwtAuthGuard, AdminGuard  
**Purpose:** Save current configuration as a reusable template

```typescript
// Request
{
  name: string;
  description: string;
  configuration: {
    rooms: Array<Partial<BulkRoomDto>>;
    upsList: Array<Partial<BulkUpsDto>>;
    servers: Array<Partial<BulkServerDto>>;
  };
}

// Response: Same as template object in GET /api/setup/templates
```

#### Enhanced Progress
**Endpoint:** `GET /api/setup/progress/enhanced`  
**Guards:** JwtAuthGuard  
**Purpose:** Get detailed progress with resource counts

```typescript
// Response
{
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  totalSteps: number;
  percentComplete: number;
  resourceCounts: {
    rooms: number;
    ups: number;
    servers: number;
  };
  lastModified: Date;
  canSkipToReview: boolean;  // true if resources exist
  isCompleted: boolean;
}
```

## Important Changes for Frontend

### 1. DTO Structure Changes

**BulkRoomDto** only contains:
- `name: string` (required)
- `tempId?: string` (optional)

**BulkUpsDto** only contains:
- `name: string` (required)
- `ip?: string` (optional)
- `roomId?: string` (optional, can be temp ID)
- `tempId?: string` (optional)

**Note:** Fields like location, capacity, coolingType, brand, model, login, password, gracePeriod were removed from bulk DTOs.

### 2. Using Temporary IDs

The frontend can use temporary IDs (e.g., `temp_room_1`, `temp_ups_1`) to establish relationships before resources are created:

```javascript
// Frontend example
const resources = {
  rooms: [
    { name: "Server Room 1", tempId: "temp_room_1" }
  ],
  upsList: [
    { name: "UPS-01", ip: "192.168.1.100", roomId: "temp_room_1", tempId: "temp_ups_1" }
  ],
  servers: [
    { 
      name: "WEB-01", 
      roomId: "temp_room_1",  // References temp room
      upsId: "temp_ups_1",    // References temp UPS
      // ... other fields
    }
  ]
};
```

### 3. Recommended Flow

1. **Validation First**: Always call `/api/setup/validate` before bulk creation
2. **Check Connectivity**: Include `checkConnectivity: true` to test network access
3. **Handle Errors**: The validation endpoint provides detailed field-level errors
4. **Use ID Mapping**: The response includes mapping from temp IDs to real IDs

```javascript
// 1. Validate
const validation = await api.post('/setup/validate', { 
  resources, 
  checkConnectivity: true 
});

if (!validation.data.valid) {
  // Show errors to user
  return;
}

// 2. Create resources
const result = await api.post('/setup/bulk', resources);

// 3. Use ID mapping if needed
console.log('Room temp_room_1 created with ID:', result.data.idMapping.rooms['temp_room_1']);
```

## Deprecated Features

### Endpoints (Still functional but deprecated)

The following endpoints are deprecated and will be removed in 6 months:

1. Individual resource creation endpoints:
   - `POST /api/rooms` (for setup)
   - `POST /api/ups` (for setup)  
   - `POST /api/servers` (for setup)

2. Old setup flow endpoints:
   - `POST /api/setup/rooms/create`
   - `POST /api/setup/ups/create`
   - `POST /api/setup/servers/create`

### Migration Timeline

- **Phase 1** (Current): New endpoints available, old endpoints still work
- **Phase 2** (3 months): Deprecation warnings added to old endpoints
- **Phase 3** (6 months): Old endpoints removed

### Why Use Bulk Operations?

1. **Atomicity**: All resources created in single transaction
2. **Performance**: One API call instead of many
3. **Consistency**: No partial states if something fails
4. **Relationships**: Automatic ID resolution for dependencies

## Error Handling

The bulk operations use transactions. If any error occurs:
- Entire operation is rolled back
- No resources are created
- Detailed error information is returned

## Templates

Three predefined templates are available:
- **Small Data Center**: 1 room, 2 UPS, 2 servers
- **Medium Data Center**: 2 rooms, 4 UPS, no servers
- **Enterprise Data Center**: 3 rooms, 5 UPS, no servers

Custom templates can be created and will be stored (currently in memory, database storage coming soon).

## Contact

For questions or issues with the migration, please contact the backend team.