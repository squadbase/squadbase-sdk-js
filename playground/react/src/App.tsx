import { SquadbaseProvider, User, useUser } from "@squadbase/react";

const PROJECT_ID = "538dc658-de19-4d33-86cc-77de72fd22e4";

const mockUser: User = {
  username: "johndoe",
  email: "john_doe@example.com",
  firstName: "John",
  lastName: "Doe",
  iconUrl: null,
  roles: ["admin", "user"],
};

function App() {
  return (
    <SquadbaseProvider projectId={PROJECT_ID} mockUser={mockUser}>
      <UserCard />
    </SquadbaseProvider>
  );
}

function UserCard() {
  const { data, status } = useUser();

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error") {
    return <p>Error</p>;
  }

  return <p>{`Hello, ${data.username}`}</p>;
}

export default App;
