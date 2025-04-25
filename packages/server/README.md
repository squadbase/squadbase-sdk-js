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

```typescript
import { createServerClient } from "@squadbase/server";

const client = createServerClient({
  projectId: "your-project-id",
  cookieOptions: {
    getCookie: () => {
      // Implement your cookie retrieval logic here
      // This should return the session cookie string
    },
  },
});

// Get the current authenticated user
const user = await client.getUser();
console.log(user);
// {
//   username: string,
//   email: string,
//   firstName: string,
//   lastName: string,
//   iconUrl: string | null,
//   roles: string[]
// }
```

### Local Development

For local development, you can provide a mock user:

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

- `projectId` (string): Your Squadbase project ID
- `cookieOptions` (object):
  - `getCookie`: Function that returns the session cookie string
- `mockUser` (optional): Mock user object for local development

### `ServerClient`

#### Methods

- `getUser()`: Returns the current authenticated user
  - Returns: Promise<User>
  - Throws: Error if authentication fails

## License

MIT
