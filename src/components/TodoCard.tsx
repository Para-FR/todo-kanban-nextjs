"use client";

import { Draggable } from "@hello-pangea/dnd";
import { deleteTodo } from "@/app/actions/todos";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Calendar } from "lucide-react";

interface TodoCardProps {
  todo: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    order: number;
  };
  index: number;
  userId: string;
}

const priorityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function TodoCard({ todo, index, userId }: TodoCardProps) {
  async function handleDelete() {
    await deleteTodo(todo._id, userId);
  }

  return (
    <Draggable draggableId={todo._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-colors ${
            snapshot.isDragging ? "ring-2 ring-primary" : ""
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm flex-1">{todo.title}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={priorityVariant[todo.priority]}>
                {todo.priority}
              </Badge>
              {todo.dueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(todo.dueDate)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
