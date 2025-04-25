# @squadbase/browser

Browser JavaScript SDK for Squadbase - A package for handling client-side operations in Squadbase applications.

## Installation

```bash
npm install @squadbase/browser
# or
yarn add @squadbase/browser
# or
pnpm add @squadbase/browser
```

## Features

### User Session

```typescript
import { createBrowserClient } from "@squadbase/browser";

const client = createBrowserClient({
  projectId: "your-project-id",
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
const client = createBrowserClient({
  projectId: "your-project-id",
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

### `createBrowserClient(options: BrowserClientOptions)`

Creates a new browser client instance.

#### Options

- `projectId` (string): Your Squadbase project ID
- `mockUser` (optional): Mock user object for local development

### `BrowserClient`

#### Methods

- `getUser()`: Returns the current authenticated user
  - Returns: Promise<User>
  - Throws: Error if authentication fails or if no mock user is provided in local development

## License

MIT
