import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Todo } from "@/lib/models";
import { emitChange } from "@/lib/events";

export function registerTodoTools(server: McpServer, userId: string) {
  server.tool(
    "list_todos",
    "List all todos for the current user with optional filters",
    {
      status: z
        .enum(["TODO", "IN_PROGRESS", "DONE"])
        .optional()
        .describe("Filter by status"),
      priority: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .optional()
        .describe("Filter by priority"),
      search: z.string().optional().describe("Search in todo titles"),
    },
    async ({ status, priority, search }) => {
      try {
        const filter: Record<string, unknown> = { userId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) filter.title = { $regex: search, $options: "i" };

        const todos = await Todo.find(filter).sort({ order: 1 }).lean();
        const result = todos.map((t) => ({
          _id: t._id.toString(),
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          order: t.order,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_todo",
    "Create a new todo in the TODO column",
    {
      title: z.string().describe("The todo title"),
      priority: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .default("MEDIUM")
        .describe("Priority level"),
      dueDate: z.string().optional().describe("Due date in ISO format"),
    },
    async ({ title, priority, dueDate }) => {
      try {
        const count = await Todo.countDocuments({ userId, status: "TODO" });
        const todo = await Todo.create({
          title,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status: "TODO",
          order: count,
          userId,
        });

        emitChange(userId);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                _id: todo._id.toString(),
                title: todo.title,
                status: todo.status,
                priority: todo.priority,
                dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "move_todo",
    "Move a todo to a different kanban column",
    {
      id: z.string().describe("The todo ID"),
      status: z
        .enum(["TODO", "IN_PROGRESS", "DONE"])
        .describe("The target status/column"),
    },
    async ({ id, status }) => {
      try {
        const todo = await Todo.findById(id);
        if (!todo || todo.userId.toString() !== userId) {
          return {
            content: [{ type: "text" as const, text: "Error: Todo not found" }],
            isError: true,
          };
        }

        const count = await Todo.countDocuments({ userId, status });
        todo.status = status;
        todo.order = count;
        await todo.save();

        emitChange(userId);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                _id: todo._id.toString(),
                title: todo.title,
                status: todo.status,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_todo",
    "Update a todo's title, priority, or due date",
    {
      id: z.string().describe("The todo ID"),
      title: z.string().optional().describe("New title"),
      priority: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .optional()
        .describe("New priority"),
      dueDate: z.string().optional().describe("New due date in ISO format"),
    },
    async ({ id, title, priority, dueDate }) => {
      try {
        const todo = await Todo.findById(id);
        if (!todo || todo.userId.toString() !== userId) {
          return {
            content: [{ type: "text" as const, text: "Error: Todo not found" }],
            isError: true,
          };
        }

        if (title !== undefined) todo.title = title;
        if (priority !== undefined) todo.priority = priority;
        if (dueDate !== undefined) todo.dueDate = new Date(dueDate);
        await todo.save();

        emitChange(userId);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                _id: todo._id.toString(),
                title: todo.title,
                status: todo.status,
                priority: todo.priority,
                dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_todo",
    "Delete a todo permanently",
    {
      id: z.string().describe("The todo ID to delete"),
    },
    async ({ id }) => {
      try {
        const todo = await Todo.findById(id);
        if (!todo || todo.userId.toString() !== userId) {
          return {
            content: [{ type: "text" as const, text: "Error: Todo not found" }],
            isError: true,
          };
        }

        await Todo.findByIdAndDelete(id);
        emitChange(userId);

        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ deleted: true, id }) },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
          isError: true,
        };
      }
    }
  );
}
