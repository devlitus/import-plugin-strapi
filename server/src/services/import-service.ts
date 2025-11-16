import type { Core } from '@strapi/strapi';
import { parse } from 'csv-parse/sync';
import PQueue from 'p-queue';

const extractErrorDetails = (error: any) => {
  let fieldName: string | null = null;
  let errorMessage = error.message || 'Unknown error';

  if (error.details?.errors && Array.isArray(error.details.errors)) {
    const firstError = error.details.errors[0];
    if (firstError.path && Array.isArray(firstError.path) && firstError.path.length > 0) {
      fieldName = firstError.path[0];
    }
    if (firstError.message) {
      errorMessage = firstError.message;
    }
  }

  if (!fieldName && error.body?.error?.details?.errors) {
    const bodyErrors = error.body.error.details.errors;
    if (Array.isArray(bodyErrors) && bodyErrors.length > 0) {
      const firstBodyError = bodyErrors[0];
      if (firstBodyError.path && firstBodyError.path.length > 0) {
        fieldName = firstBodyError.path[0];
      }
    }
  }

  if (!fieldName && error.message) {
    const patterns = [
      /Key \("([^"]+)"\)/i,
      /on table "([^"]+)"/i,
      /attribute "([^"]+)"/i,
      /field "([^"]+)"/i,
      /"([^"]+)" must be unique/i,
      /unique constraint.*"([^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = error.message.match(pattern);
      if (match && match[1]) {
        fieldName = match[1];
        break;
      }
    }
  }

  const message = fieldName
    ? `Field "${fieldName}" constraint violation: ${errorMessage}`
    : errorMessage;

  return { fieldName, message, originalError: errorMessage };
};

const importService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async importData(uid: string, csvContent: string) {
    const contentTypeService = strapi.plugin('strapi-import-tools').service('contentTypeService');
    const validationService = strapi.plugin('strapi-import-tools').service('validationService');

    const schema = await contentTypeService.getSchema(uid);

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records || records.length === 0) {
      return {
        success: false,
        message: 'No records found in CSV',
        created: 0,
        updated: 0,
        errors: [],
      };
    }

    const validation = await validationService.validateData(records, schema, uid);

    if (!validation.valid) {
      return {
        success: false,
        message: 'Validation failed',
        created: 0,
        updated: 0,
        errors: validation.errors,
      };
    }

    // Group records by locale for parallel processing
    const recordsByLocale: Record<string, any[]> = {};
    records.forEach((record: any) => {
      const locale = record.locale || 'default';
      if (!recordsByLocale[locale]) {
        recordsByLocale[locale] = [];
      }
      recordsByLocale[locale].push(record);
    });

    // Process each locale in parallel
    const localeResults = await Promise.all(
      Object.entries(recordsByLocale).map(([locale, localeRecords]) =>
        processLocaleRecords(strapi, uid, schema, localeRecords, locale === 'default' ? undefined : locale)
      )
    );

    // Aggregate results
    const aggregatedResults = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    localeResults.forEach((result) => {
      aggregatedResults.created += result.created;
      aggregatedResults.updated += result.updated;
      aggregatedResults.errors.push(...result.errors);
    });

    return {
      success: aggregatedResults.errors.length === 0,
      message: aggregatedResults.errors.length === 0 ? 'Import completed successfully' : `Import completed with ${aggregatedResults.errors.length} error(s)`,
      created: aggregatedResults.created,
      updated: aggregatedResults.updated,
      errors: aggregatedResults.errors,
    };
  },
});

const processLocaleRecords = async (
  strapi: Core.Strapi,
  uid: string,
  schema: any,
  records: any[],
  locale: string | undefined
) => {
  const results = {
    created: 0,
    updated: 0,
    errors: [] as any[],
  };

  // Pre-fetch existing document IDs in chunks (5000 per chunk)
  const CACHE_CHUNK_SIZE = 5000;
  const existingIds = new Set<string>();

  for (let chunkStart = 0; chunkStart < records.length; chunkStart += CACHE_CHUNK_SIZE) {
    const chunkEnd = Math.min(chunkStart + CACHE_CHUNK_SIZE, records.length);
    const chunkRecords = records.slice(chunkStart, chunkEnd);
    const idsToCheck = chunkRecords
      .map((r) => r.document_id)
      .filter(Boolean) as string[];

    if (idsToCheck.length === 0) continue;

    try {
      const findOptions: any = {
        filters: { documentId: { $in: idsToCheck } },
        fields: ['documentId'],
        limit: -1,
      };
      if (locale) {
        findOptions.locale = locale;
      }

      const existing = await strapi.documents(uid as any).findMany(findOptions);
      existing.forEach((doc: any) => existingIds.add(doc.documentId));
    } catch (error) {
      strapi.log.warn('Error pre-fetching existing IDs:', error);
    }
  }

  // Separate records into create and update batches
  const toCreate: Array<{ index: number; record: any }> = [];
  const toUpdate: Array<{ index: number; record: any }> = [];

  records.forEach((record, index) => {
    if (record.document_id && existingIds.has(record.document_id)) {
      toUpdate.push({ index, record });
    } else {
      toCreate.push({ index, record });
    }
  });

  // Process with queue (max 10 concurrent operations)
  const queue = new PQueue({ concurrency: 10 });
  const BATCH_SIZE = 100;

  // Process creations in batches
  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const batch = toCreate.slice(i, i + BATCH_SIZE);
    queue.add(() => processBatch(strapi, uid, schema, batch, 'create', locale, results));
  }

  // Process updates in batches
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);
    queue.add(() => processBatch(strapi, uid, schema, batch, 'update', locale, results));
  }

  await queue.onIdle();

  return results;
};

const processBatch = async (
  strapi: Core.Strapi,
  uid: string,
  schema: any,
  batch: Array<{ index: number; record: any }>,
  operation: 'create' | 'update',
  locale: string | undefined,
  results: any
) => {
  for (const { index, record } of batch) {
    try {
      const dataToSave = buildDataToSave(schema, record);

      if (operation === 'update') {
        const updateOptions: any = {
          documentId: record.document_id,
          data: dataToSave,
        };
        if (locale) {
          updateOptions.locale = locale;
        }

        await strapi.documents(uid as any).update(updateOptions);
        results.updated++;
      } else {
        const createOptions: any = { data: dataToSave };
        if (locale) {
          createOptions.locale = locale;
        }

        await strapi.documents(uid as any).create(createOptions);
        results.created++;
      }
    } catch (error: any) {
      const errorDetails = extractErrorDetails(error);

      strapi.log.error(`Import error (${operation}):`, {
        row: index + 1,
        errorMessage: error.message,
        fieldName: errorDetails.fieldName,
      });

      results.errors.push({
        row: index + 1,
        data: record,
        message: errorDetails.message,
        fieldName: errorDetails.fieldName,
      });
    }
  }
};

const buildDataToSave = (schema: any, row: any) => {
  const dataToSave: any = {};
  const attributes = schema.attributes;

  Object.keys(attributes).forEach((fieldName) => {
    const attribute = attributes[fieldName];
    const value = row[fieldName];

    // Skip system fields
    if (
      [
        'createdAt',
        'updatedAt',
        'publishedAt',
        'createdBy',
        'updatedBy',
        'localizations',
      ].includes(fieldName)
    ) {
      return;
    }

    // Skip locale - it's handled separately
    if (fieldName === 'locale') {
      return;
    }

    // Handle relation fields
    if (attribute.type === 'relation') {
      const idColumnName = `${fieldName}_document_id`;
      const idValue = row[idColumnName];

      if (idValue && idValue !== '') {
        const ids = String(idValue)
          .split(',')
          .map((id: string) => id.trim())
          .filter((id: string) => id);

        if (ids.length > 0) {
          dataToSave[fieldName] = ids.length === 1 ? ids[0] : ids;
        }
      }
      return;
    }

    // Handle media fields
    if (attribute.type === 'media') {
      const idColumnName = `${fieldName}_id`;
      const idValue = row[idColumnName];

      if (idValue && idValue !== '') {
        const ids = String(idValue)
          .split(',')
          .map((id: string) => id.trim())
          .filter((id: string) => id)
          .map((id: string) => parseInt(id));

        if (ids.length > 0) {
          dataToSave[fieldName] = ids.length === 1 ? ids[0] : ids;
        }
      }
      return;
    }

    // Handle uid fields
    if (attribute.type === 'uid') {
      const slugValue = row[fieldName];

      if (slugValue && slugValue !== '') {
        dataToSave[fieldName] = slugValue;
      } else if (attribute.targetField && row[attribute.targetField]) {
        const targetValue = row[attribute.targetField];
        dataToSave[fieldName] = targetValue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (attribute.type === 'integer') {
        dataToSave[fieldName] = parseInt(value);
      } else if (attribute.type === 'decimal' || attribute.type === 'float') {
        dataToSave[fieldName] = parseFloat(value);
      } else if (attribute.type === 'boolean') {
        dataToSave[fieldName] = ['true', 'True', 'TRUE', '1', 'yes', 'Yes', 'YES'].includes(String(value)) || value === true;
      } else if (
        ['string', 'text', 'richtext', 'email', 'password', 'enumeration', 'date'].includes(
          attribute.type
        )
      ) {
        dataToSave[fieldName] = value;
      }
    } else if (
      attribute.default !== undefined &&
      (value === undefined || value === null || value === '')
    ) {
      dataToSave[fieldName] = attribute.default;
    }
  });

  return dataToSave;
};

export default importService;
