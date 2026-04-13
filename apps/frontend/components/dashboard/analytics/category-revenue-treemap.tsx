"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface CategoryRevenueTreemapProps {
  categories: CategoryItem[];
  onCategoryClick?: (cat: CategoryItem) => void;
}

const TREEMAP_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(43, 74%, 66%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(27, 87%, 67%)",
  "hsl(173, 58%, 39%)",
  "hsl(12, 76%, 61%)",
  "hsl(197, 37%, 24%)",
  "hsl(47, 100%, 50%)",
];

// Custom treemap content component
function CustomTreemapContent(props: any) {
  const { x, y, width, height, index, name, onCategoryClick, categoryItem } = props;

  if (width < 40 || height < 25) return null;

  return (
    <g
      onClick={() => onCategoryClick?.(categoryItem)}
      style={{ cursor: onCategoryClick ? "pointer" : "default" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        ry={6}
        style={{
          fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
          stroke: "hsl(var(--background))",
          strokeWidth: 3,
          opacity: 0.85,
        }}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-xs font-medium"
          style={{ fontSize: Math.min(13, width / 8), pointerEvents: "none" }}
        >
          {name.length > Math.floor(width / 8)
            ? name.substring(0, Math.floor(width / 8)) + "…"
            : name}
        </text>
      )}
    </g>
  );
}

export function CategoryRevenueTreemap({ categories, onCategoryClick }: CategoryRevenueTreemapProps) {
  const { t } = useLocale();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  const data = categories
    .filter((cat) => cat.revenue > 0)
    .map((cat, i) => ({
      name: cat.name,
      size: cat.revenue,
      quantity: cat.quantity,
      fill: TREEMAP_COLORS[i % TREEMAP_COLORS.length],
      categoryItem: cat,
      onCategoryClick,
    }));

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">{t.analytics.categoryTreemap}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
          {t.analytics.noData}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">{t.analytics.categoryTreemap}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              content={<CustomTreemapContent />}
            >
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="font-semibold mb-1">{item.name}</p>
                      <p className="text-muted-foreground">
                        {t.analytics.revenue}:{" "}
                        <span className="text-foreground font-medium">
                          {formatCurrency(item.size)}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {t.analytics.quantity}:{" "}
                        <span className="text-foreground font-medium">{item.quantity}</span>
                      </p>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 italic">
          {t.analytics.clickToExplore}
        </p>
      </CardContent>
    </Card>
  );
}
