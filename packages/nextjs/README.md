# @squadbase/nextjs

Next.js SDK for Squadbase - A package for handling server-side operations in Squadbase applications with Next.js.

## Installation

```bash
npm install @squadbase/nextjs
# or
yarn add @squadbase/nextjs
# or
pnpm add @squadbase/nextjs
```

## Features

### User Session

```typescript
import { createNextjsServerClient } from "@squadbase/nextjs";

// In your Next.js server component or API route
const client = createNextjsServerClient({
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
const client = createNextjsServerClient({
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

### `createNextjsServerClient(options: NextjsServerClientOptions)`

Creates a new Next.js server client instance. This is a wrapper around `createServerClient` that automatically handles cookie management using Next.js's `cookies()` API.

#### Options

- `projectId` (string): Your Squadbase project ID
- `mockUser` (optional): Mock user object for local development

### `ServerClient`

This package re-exports all types and interfaces from `@squadbase/server`. See the [@squadbase/server documentation](../server/README.md) for more details.

## License

MIT
