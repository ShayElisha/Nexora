/**
 * Pagination middleware - שיפור דרמטי בביצועים!
 * במקום לטעון 10,000 רשומות - רק 20!
 */
export const paginate = (model) => {
  return async (req, res, next) => {
    // קבלת פרמטרים
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // ברירת מחדל 20
    const skip = (page - 1) * limit;

    // בדיקת תקינות
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    try {
      // בניית query (יכול להיות מוגדר קודם ב-middleware אחר)
      const query = req.filterQuery || {};

      // ספירה מהירה
      const total = await model.countDocuments(query);

      // שמירת מידע pagination ב-request
      req.pagination = {
        page,
        limit,
        skip,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };

      next();
    } catch (error) {
      console.error("Pagination error:", error);
      res.status(500).json({
        success: false,
        message: "Pagination error",
        error: error.message,
      });
    }
  };
};

/**
 * Helper function להוספת pagination לתשובה
 */
export const paginateResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      currentPage: pagination.page,
      itemsPerPage: pagination.limit,
      totalItems: pagination.total,
      totalPages: pagination.pages,
      hasNextPage: pagination.hasNext,
      hasPreviousPage: pagination.hasPrev,
    },
  };
};

/**
 * Pagination עבור Aggregation pipelines
 */
export const paginateAggregate = async (model, pipeline, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // הוספת pagination ל-pipeline
  const paginatedPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit },
  ];

  // ספירה
  const countPipeline = [...pipeline, { $count: "total" }];

  const [data, countResult] = await Promise.all([
    model.aggregate(paginatedPipeline),
    model.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export default { paginate, paginateResponse, paginateAggregate };

