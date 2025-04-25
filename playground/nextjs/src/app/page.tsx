import { createNextjsServerClient, User } from "@squadbase/nextjs";

const PROJECT_ID = "538dc658-de19-4d33-86cc-77de72fd22e4";

const mockUser: User = {
  username: "johndoe",
  email: "john_doe@example.com",
  firstName: "John",
  lastName: "Doe",
  iconUrl: null,
  roles: ["admin", "user"],
};

const squadbase = createNextjsServerClient({
  projectId: PROJECT_ID,
  mockUser,
});

export default async function Home() {
  const user = await squadbase.getUser();

  return (
    <dl>
      <dt>Username</dt>
      <dd>{user.username}</dd>
      <dt>Email</dt>
      <dd>{user.email}</dd>
    </dl>
  );
}
