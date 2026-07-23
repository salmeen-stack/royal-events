import { useState, useCallback } from "react";

const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const goToPage = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const updatePagination = useCallback((paginationData) => {
    if (paginationData) {
      setTotal(paginationData.total || 0);
      setTotalPages(paginationData.totalPages || 1);
    }
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
    setTotalPages(1);
    setTotal(0);
  }, []);

  return {
    page,
    limit,
    totalPages,
    total,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    updatePagination,
    resetPagination,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default usePagination;