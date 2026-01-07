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

User info is automatically available in apps deployed to Squadbase or running in Squadbase Editor.

```typescript
// app/api/user/route.ts
import { createNextjsServerClient } from "@squadbase/nextjs";

export async function GET() {
  const client = createNextjsServerClient();
  const user = await client.getUser();
  // {
  //   username: string,
  //   email: string,
  //   firstName: string,
  //   lastName: string,
  //   iconUrl: string | null,
  //   roles: string[]
  // }
  return Response.json(user);
}
```

### Outside Squadbase Environments

For use outside Squadbase environments (e.g., local development), you must set the `projectId` and `mockUser` options. These settings are not needed in Squadbase Editor or deployed environments.

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

### `createNextjsServerClient(options?: NextjsServerClientOptions)`

Creates a new Next.js server client instance. This is a wrapper around `createServerClient` that automatically handles cookie management using Next.js's `cookies()` API.

#### Options

- `projectId` (optional): Your Squadbase project ID. Required outside Squadbase environments.
- `mockUser` (optional): Mock user object for use outside Squadbase environments

### `ServerClient`

This package re-exports all types and interfaces from `@squadbase/server`. See the [@squadbase/server documentation](../server/README.md) for more details.

## License

MIT
