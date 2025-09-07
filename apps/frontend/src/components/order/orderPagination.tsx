"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Page } from "@/types/page";
import { usePathname } from "next/navigation";

interface OrderPaginationProps {
  pagination: Page
}

export default function OrderPagination({ pagination }: OrderPaginationProps) {
  const pathname = usePathname();

  const buildPageUrl = (pageNumber: number) => {
    const pathParts = pathname.split('/');
    pathParts[pathParts.length - 1] = pageNumber.toString();
    return pathParts.join('/');
  };

  return (
    <Pagination>
      <PaginationContent>
        {
          pagination.prevPage ?
            <>
              <PaginationItem>
                <PaginationPrevious href={buildPageUrl(pagination.prevPage)} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href={buildPageUrl(pagination.prevPage)}>
                  {pagination.prevPage}
                </PaginationLink>
              </PaginationItem>
            </>
            : <></>
        }

        <PaginationItem>
          <PaginationLink href="#" isActive>{pagination.currentPage}</PaginationLink>
        </PaginationItem>

        {
          pagination.nextPage ?
            <>
              <PaginationItem>
                <PaginationLink href={buildPageUrl(pagination.nextPage)}>
                  {pagination.nextPage}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem >
                <PaginationNext href={buildPageUrl(pagination.nextPage)} />
              </PaginationItem>
            </>
            : <></>
        }
      </PaginationContent>
    </Pagination >
  )
}