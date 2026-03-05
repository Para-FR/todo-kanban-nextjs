"use client";

import { useState, useEffect } from "react";
import { createApiKey, listApiKeys, revokeApiKey } from "@/app/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Copy, Key, Terminal } from "lucide-react";

interface ApiKeyInfo {
  _id: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"key" | "cmd" | false>(false);

  async function loadKeys() {
    const data = await listApiKeys();
    setKeys(data);
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const result = await createApiKey(name.trim());
      setNewKey(result.key);
      setName("");
      setCopied(false);
      await loadKeys();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(keyId: string) {
    await revokeApiKey(keyId);
    await loadKeys();
  }

  function getClaudeCommand() {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `claude mcp add --scope user --transport http todo-mcp ${baseUrl}/api/mcp --header "x-api-key: ${newKey}"`;
  }

  function handleCopy(target: "key" | "cmd") {
    const text = target === "cmd" ? getClaudeCommand() : newKey;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(target);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      {/* Create new key */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g., My App)"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Creating..." : "Generate Key"}
        </Button>
      </form>

      {/* Show newly created key */}
      {newKey && (
        <Alert className="mb-6 border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription>
            <p className="text-sm font-medium text-emerald-400 mb-3">
              Key created! Copy it now — it won&apos;t be shown again.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">API Key</p>
                <code className="block bg-background rounded p-2 text-sm break-all">
                  {newKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("key")}
                  className="mt-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied === "key" ? "Copied!" : "Copy key"}
                </Button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Terminal className="h-3 w-3" />
                  Add to Claude Code
                </p>
                <code className="block bg-background rounded p-2 text-sm break-all">
                  {getClaudeCommand()}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("cmd")}
                  className="mt-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied === "cmd" ? "Copied!" : "Copy command"}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 && (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        )}
        {keys.map((key) => (
          <Card key={key._id}>
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {key.keyPrefix}... &middot; Created{" "}
                    {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {key.revokedAt ? (
                  <Badge variant="destructive">Revoked</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(key._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
