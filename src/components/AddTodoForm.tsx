"use client";

import { useState } from "react";
import { createTodo } from "@/app/actions/todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTodoFormProps {
  userId: string;
  onTodoCreated?: () => void;
}

export default function AddTodoForm({ userId, onTodoCreated }: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createTodo(userId, {
        title: title.trim(),
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setDueDate("");
      onTodoCreated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo..."
        />
      </div>
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-[160px]"
      />
      <Button type="submit" disabled={loading || !title.trim()}>
        {loading ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}
