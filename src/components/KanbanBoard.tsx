"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { signOut } from "next-auth/react";
import Link from "next/link";
import TodoCard from "./TodoCard";
import AddTodoForm from "./AddTodoForm";
import { getTodos, moveTodo } from "@/app/actions/todos";
import { useEventSource } from "@/hooks/useEventSource";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, LogOut } from "lucide-react";

interface Todo {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface KanbanBoardProps {
  initialTodos: Todo[];
  userId: string;
  userName: string;
}

const columns = [
  { id: "TODO", title: "To Do", color: "border-t-zinc-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-t-blue-500" },
  { id: "DONE", title: "Done", color: "border-t-emerald-500" },
];

export default function KanbanBoard({ initialTodos, userId, userName }: KanbanBoardProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const refreshTodos = useCallback(async () => {
    const updated = await getTodos(userId);
    setTodos(updated);
  }, [userId]);

  useEventSource(refreshTodos);

  async function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    await moveTodo(draggableId, userId, newStatus);
    await refreshTodos();
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Todos</h1>
          <p className="text-sm text-muted-foreground">Hello, {userName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ redirectTo: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Add Todo Form */}
      <div className="mb-6">
        <AddTodoForm userId={userId} onTodoCreated={refreshTodos} />
      </div>

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const columnTodos = todos
              .filter((t) => t.status === col.id)
              .sort((a, b) => a.order - b.order);

            return (
              <Card key={col.id} className={`border-t-2 ${col.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{col.title}</CardTitle>
                    <Badge variant="secondary">{columnTodos.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-muted/50" : ""
                        }`}
                      >
                        {columnTodos.map((todo, index) => (
                          <TodoCard
                            key={todo._id}
                            todo={todo}
                            index={index}
                            userId={userId}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
