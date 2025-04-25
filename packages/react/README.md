# @squadbase/react

React SDK for Squadbase - A package for handling client-side operations in Squadbase applications with React.

## Installation

```bash
npm install @squadbase/react
# or
yarn add @squadbase/react
# or
pnpm add @squadbase/react
```

## Features

### User Session

```typescript
import { SquadbaseProvider, useUser } from "@squadbase/react";

// Wrap your app with SquadbaseProvider
function App() {
  return (
    <SquadbaseProvider projectId="your-project-id">
      <UserProfile />
    </SquadbaseProvider>
  );
}

// Use the useUser hook in your components
function UserProfile() {
  const user = useUser();

  if (user.status === "pending") {
    return <div>Loading...</div>;
  }

  if (user.status === "error") {
    return <div>Error: {user.error}</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.data.firstName}!</h1>
      <p>Email: {user.data.email}</p>
    </div>
  );
}
```

### Local Development

For local development, you can provide a mock user:

```typescript
<SquadbaseProvider
  projectId="your-project-id"
  mockUser={{
    username: "test-user",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    iconUrl: null,
    roles: ["user"],
  }}
>
  <App />
</SquadbaseProvider>
```

## API Reference

### `SquadbaseProvider`

A React context provider that wraps your application and provides access to the Squadbase client.

#### Props

- `projectId` (string): Your Squadbase project ID
- `mockUser` (optional): Mock user object for local development

### `useUser()`

A React hook that returns the current authenticated user.

#### Returns

```typescript
type QueryResult<User, string> = {
  status: "pending" | "success" | "error";
  data?: User;
  error?: string;
};
```

## License

MIT
