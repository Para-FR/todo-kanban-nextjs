import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApiKeysManager from "@/components/ApiKeysManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Board
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Generate API keys to access your todos programmatically.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <ApiKeysManager />
        </CardContent>
      </Card>
    </div>
  );
}
