const getPagination = (req) => {
  let page = Number.parseInt(req.query.page, 10);
  let limit = Number.parseInt(req.query.limit, 10);

  // Safe defaults
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    limit = 20;
  }

  // Prevent excessive database queries
  if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const getPaginationMeta = ({
  page,
  limit,
  total,
}) => {
  const totalPages =
    total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

module.exports = {
  getPagination,
  getPaginationMeta,
};