import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodos } from "@/app/actions/todos";
import KanbanBoard from "@/components/KanbanBoard";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const todos = await getTodos(session.user.id);

  return (
    <KanbanBoard
      initialTodos={todos}
      userId={session.user.id}
      userName={session.user.name || "User"}
    />
  );
}
