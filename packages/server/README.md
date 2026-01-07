# @squadbase/server

Server Side JavaScript SDK for Squadbase - A package for handling server-side operations in Squadbase applications.

## Installation

```bash
npm install @squadbase/server
# or
yarn add @squadbase/server
# or
pnpm add @squadbase/server
```

## Features

### User Session

User info is automatically available in apps deployed to Squadbase or running in Squadbase Editor.

```typescript
import { createServerClient } from "@squadbase/server";

const client = createServerClient({
  cookieOptions: {
    getCookie: () => {
      // Implement your cookie retrieval logic here
      // This should return the session cookie string
    },
  },
});

// Get the current authenticated user
const user = await client.getUser();
// {
//   username: string,
//   email: string,
//   firstName: string,
//   lastName: string,
//   iconUrl: string | null,
//   roles: string[]
// }
```

### Outside Squadbase Environments

For use outside Squadbase environments (e.g., local development), you must set the `projectId` and `mockUser` options. These settings are not needed in Squadbase Editor or deployed environments.

```typescript
const client = createServerClient({
  projectId: "your-project-id",
  cookieOptions: {
    getCookie: () => undefined,
  },
  mockUser: {
    username: "test-user",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    iconUrl: null,
    roles: ["user"],
  },
});
```

## API Reference

### `createServerClient(options: ServerClientOptions)`

Creates a new server client instance.

#### Options

- `projectId` (optional): Your Squadbase project ID. Required outside Squadbase environments.
- `cookieOptions` (object):
  - `getCookie`: Function that returns the session cookie string
- `mockUser` (optional): Mock user object for use outside Squadbase environments

### `ServerClient`

#### Methods

- `getUser()`: Returns the current authenticated user
  - Returns: Promise<User>
  - Throws: Error if authentication fails

## License

MIT
