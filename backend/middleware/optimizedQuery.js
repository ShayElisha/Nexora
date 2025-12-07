/**
 * Middleware לאופטימיזציה של queries
 * מוסיף אוטומטית .lean() ו-select() לפי הצורך
 */

/**
 * Helper להוספת lean() לכל queries
 * מאיץ פי 5-10!
 */
export const addLean = (query) => {
  if (query && typeof query.lean === "function") {
    return query.lean();
  }
  return query;
};

/**
 * בחירת שדות אופטימלית
 */
export const selectFields = (model, fields = null) => {
  if (!fields) {
    // שדות ברירת מחדל - ללא שדות גדולים
    return model.select("-password -__v");
  }
  return model.select(fields);
};

/**
 * Populate אופטימלי - רק שדות נחוצים
 */
export const optimizedPopulate = (query, populateConfig) => {
  if (Array.isArray(populateConfig)) {
    populateConfig.forEach((config) => {
      if (typeof config === "string") {
        query = query.populate(config);
      } else {
        query = query.populate(config);
      }
    });
  } else if (typeof populateConfig === "object") {
    query = query.populate(populateConfig);
  } else if (typeof populateConfig === "string") {
    query = query.populate(populateConfig);
  }
  return query;
};

/**
 * Query builder מאופטמז
 */
export class OptimizedQueryBuilder {
  constructor(model, filter = {}) {
    this.model = model;
    this.filter = filter;
    this.query = model.find(filter);
  }

  select(fields) {
    this.query = this.query.select(fields);
    return this;
  }

  populate(config) {
    this.query = optimizedPopulate(this.query, config);
    return this;
  }

  sort(sortBy) {
    this.query = this.query.sort(sortBy);
    return this;
  }

  limit(limit) {
    this.query = this.query.limit(limit);
    return this;
  }

  skip(skip) {
    this.query = this.query.skip(skip);
    return this;
  }

  paginate(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  lean() {
    this.query = this.query.lean();
    return this;
  }

  async exec() {
    return await this.query.lean().exec();
  }

  async execWithCount() {
    const [data, total] = await Promise.all([
      this.query.lean().exec(),
      this.model.countDocuments(this.filter),
    ]);
    return { data, total };
  }
}

/**
 * Helper לבניית aggregation pipeline מאופטמז
 */
export const buildAggregation = (model, stages) => {
  return model.aggregate(stages).allowDiskUse(true);
};

/**
 * Middleware לזיהוי queries איטיים
 */
export const queryLogger = (threshold = 1000) => {
  return async (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        console.warn(
          `⚠️  Slow query detected: ${req.method} ${req.path} took ${duration}ms`
        );
      }
    });

    next();
  };
};

export default {
  addLean,
  selectFields,
  optimizedPopulate,
  OptimizedQueryBuilder,
  buildAggregation,
  queryLogger,
};

