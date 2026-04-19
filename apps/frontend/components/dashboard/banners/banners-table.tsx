"use client";

import { useState, useEffect, useRef } from "react";
import { Banner } from "@/lib/api-types";
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
import { PencilIcon, ImageIcon } from "lucide-react";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import { useLocale } from "@/contexts/locale-context";

function getBannerImageUrl(filename: string) {
  return `/api/images/banners/${filename}`;
}

interface BannersTableProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
}

function BannerImageCell({ image, label }: { image?: string | null; label: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (!image) {
    return (
      <div className="h-10 w-14 rounded-md border bg-muted flex items-center justify-center">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!loaded && <ImageSkeleton width={56} height={40} className="rounded-md border" />}
      <img
        ref={imgRef}
        src={getBannerImageUrl(image)}
        alt={label}
        className={`h-10 w-14 object-cover rounded-md border ${!loaded ? "hidden" : ""}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

export function BannersTable({ banners, onEdit }: BannersTableProps) {
  const { t } = useLocale();

  if (banners.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.banners.noBannersFound}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10" />
            <TableHead className="w-16 font-medium">{t.banners.columnImage}</TableHead>
            <TableHead className="font-medium">{t.banners.columnLabel}</TableHead>
            <TableHead className="font-medium w-28">{t.banners.columnType}</TableHead>
            <TableHead className="hidden md:table-cell font-medium">{t.banners.columnTitle}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell className="w-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(banner)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="w-16">
                <BannerImageCell image={banner.image} label={banner.label} />
              </TableCell>
              <TableCell className="font-medium max-w-48">
                <span className="block truncate" title={banner.label}>{banner.label}</span>
              </TableCell>
              <TableCell className="w-28">
                <Badge variant={banner.type === "EVENT" ? "default" : "secondary"}>
                  {banner.type === "EVENT" ? t.banners.typeEvent : t.banners.typeSponsor}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground max-w-64">
                <span className="block truncate" title={banner.title ?? undefined}>
                  {banner.title ?? "-"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
