"use client";

import { useState } from "react";
import { ApiKey } from "@/lib/api-types";
import { ApiKeysToolbar } from "./api-keys-toolbar";
import { ApiKeysTable } from "./api-keys-table";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";
import { useLocale } from "@/contexts/locale-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";

interface ApiKeysContentProps {
  initialApiKeys: ApiKey[];
}

export function ApiKeysContent({ initialApiKeys }: ApiKeysContentProps) {
  const { t } = useLocale();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);
  const [revokedOpen, setRevokedOpen] = useState(false);

  const filtered = apiKeys.filter((k) =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeKeys = filtered.filter((k) => !k.revokedAt);
  const revokedKeys = filtered.filter((k) => !!k.revokedAt);

  function handleRevoke(apiKey: ApiKey) {
    setRevokingKey(apiKey);
    setRevokeDialogOpen(true);
  }

  function handleCreated(apiKey: ApiKey) {
    setApiKeys((prev) => [apiKey, ...prev]);
  }

  function handleRevoked(id: string) {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date() } : k))
    );
    setRevokeDialogOpen(false);
    setRevokingKey(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <ApiKeysToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={() => setCreateDialogOpen(true)}
        />

        {/* Active keys */}
        <ApiKeysTable apiKeys={activeKeys} onRevoke={handleRevoke} />

        {/* Revoked keys — collapsible */}
        {revokedKeys.length > 0 && (
          <Collapsible open={revokedOpen} onOpenChange={setRevokedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${revokedOpen ? "rotate-180" : ""}`}
              />
              {t.apiKeys.revokedSection} ({revokedKeys.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <ApiKeysTable apiKeys={revokedKeys} onRevoke={handleRevoke} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCreated}
      />
      <RevokeApiKeyDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        apiKey={revokingKey}
        onRevoked={handleRevoked}
      />
    </div>
  );
}
