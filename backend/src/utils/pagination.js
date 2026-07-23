  
// ==========================================
// PAGINATION HELPER
// ==========================================

export const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

// ==========================================
// BUILD PAGINATION META
// ==========================================

export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
  };
};

// ==========================================
// PARSE QUERY PARAMS
// ==========================================

export const parseQueryParams = (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = query;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    search: search.trim(),
    sortBy,
    sortOrder,
    filters,
  };
};

// ==========================================
// BUILD SEARCH WHERE CLAUSE
// ==========================================

export const buildSearchWhere = (search, fields) => {
  if (!search || search.trim() === "") return {};

  return {
    OR: fields.map((field) => {
      if (field.includes(".")) {
        const parts = field.split(".");
        const nested = {};
        let current = nested;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = {
          contains: search,
          mode: "insensitive",
        };
        return nested;
      }
      return {
        [field]: { contains: search, mode: "insensitive" },
      };
    }),
  };
};