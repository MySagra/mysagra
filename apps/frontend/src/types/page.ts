export type Page = {
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
    nextPage: number | null,
    prevPage: number | null
}