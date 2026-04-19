import { Skeleton } from "@/components/ui/skeleton";

interface ImageSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function ImageSkeleton({
  width = "100%",
  height = "200px",
  className = "",
}: ImageSkeletonProps) {
  return (
    <Skeleton
      className={`${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
