import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateApiKey } from "@/lib/mcp/auth";
import { createMcpServer } from "@/lib/mcp";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";

function jsonRpcError(code: number, message: string, status: number) {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function handleMcpRequest(request: Request) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return jsonRpcError(-32001, "Unauthorized: invalid or missing API key", 401);
  }

  await dbConnect;

  const server = createMcpServer(userId);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  // Cleanup after response is consumed
  response
    .clone()
    .body?.pipeTo(
      new WritableStream({
        close() {
          transport.close();
          server.close();
        },
      })
    )
    .catch(() => {
      transport.close();
      server.close();
    });

  return response;
}

export async function POST(request: Request) {
  try {
    return await handleMcpRequest(request);
  } catch (err) {
    console.error("MCP POST error:", err);
    return jsonRpcError(
      -32603,
      `Internal error: ${err instanceof Error ? err.message : "Unknown"}`,
      500
    );
  }
}

export async function GET(request: Request) {
  try {
    return await handleMcpRequest(request);
  } catch (err) {
    console.error("MCP GET error:", err);
    return jsonRpcError(
      -32603,
      `Internal error: ${err instanceof Error ? err.message : "Unknown"}`,
      500
    );
  }
}

export async function DELETE(request: Request) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return jsonRpcError(-32001, "Unauthorized: invalid or missing API key", 401);
  }
  return new Response(null, { status: 200 });
}
