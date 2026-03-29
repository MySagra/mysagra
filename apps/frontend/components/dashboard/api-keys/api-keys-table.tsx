"use client";

import { ApiKey } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2Icon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";

interface ApiKeysTableProps {
  apiKeys: ApiKey[];
  onRevoke: (apiKey: ApiKey) => void;
}

const typeVariants: Record<string, "default" | "secondary"> = {
  PRINTER: "default",
  WEBAPP: "secondary",
};

export function ApiKeysTable({ apiKeys, onRevoke }: ApiKeysTableProps) {
  const { t } = useLocale();
  const { canManageApiKeys } = useRole();

  if (apiKeys.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.apiKeys.noApiKeysFound}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>{t.apiKeys.columnName}</TableHead>
            <TableHead className="w-28 hidden sm:table-cell">{t.apiKeys.columnType}</TableHead>
            <TableHead className="w-40 hidden md:table-cell">{t.apiKeys.columnKey}</TableHead>
            <TableHead className="w-40 hidden md:table-cell">{t.apiKeys.columnCreatedAt}</TableHead>
            <TableHead className="w-40 hidden md:table-cell">{t.apiKeys.columnLastUsed}</TableHead>
            <TableHead className="w-28 text-center">{t.apiKeys.columnStatus}</TableHead>
            {canManageApiKeys && <TableHead className="w-16"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((key) => (
            <TableRow key={key.id} className={key.revokedAt ? "opacity-50" : undefined}>
              <TableCell className="font-medium max-w-48">
                <span className="block truncate" title={key.name}>{key.name}</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={typeVariants[key.type]}>
                  {key.type === "PRINTER" ? t.apiKeys.typePrinter : t.apiKeys.typeWebapp}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm hidden md:table-cell">
                {key.prefix}
                {"••••"}
                {key.last_digits}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {key.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {key.lastUsedAt ? key.lastUsedAt.toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="text-center">
                {key.revokedAt ? (
                  <Badge variant="destructive">{t.apiKeys.statusRevoked}</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">{t.apiKeys.statusActive}</Badge>
                )}
              </TableCell>
              {canManageApiKeys && (
                <TableCell>
                  {!key.revokedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRevoke(key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
