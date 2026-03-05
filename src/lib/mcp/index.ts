import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTodoTools } from "./tools/todos";

export function createMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "todo-mcp",
    version: "1.0.0",
  });

  registerTodoTools(server, userId);

  return server;
}
