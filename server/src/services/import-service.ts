import type { Core } from '@strapi/strapi';
import { parse } from 'csv-parse/sync';

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

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const locale = row.locale || undefined;

      try {
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

          // Handle relation fields - parse from {fieldName}_document_id column
          if (attribute.type === 'relation') {
            const idColumnName = `${fieldName}_document_id`;
            const idValue = row[idColumnName];

            if (idValue && idValue !== '') {
              const ids = String(idValue)
                .split(',')
                .map((id) => id.trim())
                .filter((id) => id);

              if (ids.length > 0) {
                dataToSave[fieldName] = ids.length === 1 ? ids[0] : ids;
              }
            }
            return;
          }

          // Handle media fields - parse from {fieldName}_id column
          if (attribute.type === 'media') {
            const idColumnName = `${fieldName}_id`;
            const idValue = row[idColumnName];

            if (idValue && idValue !== '') {
              const ids = String(idValue)
                .split(',')
                .map((id) => id.trim())
                .filter((id) => id)
                .map((id) => parseInt(id));

              if (ids.length > 0) {
                dataToSave[fieldName] = ids.length === 1 ? ids[0] : ids;
              }
            }
            return;
          }

          // Handle uid fields - use provided value or auto-generate from targetField
          if (attribute.type === 'uid') {
            const slugValue = row[fieldName];

            if (slugValue && slugValue !== '') {
              // Use slug value from CSV if provided
              dataToSave[fieldName] = slugValue;
            } else if (attribute.targetField && row[attribute.targetField]) {
              // Generate uid slug from target field (e.g., from 'name')
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
            // Use default value if field is empty
            dataToSave[fieldName] = attribute.default;
          }
        });

        if (row.document_id) {
          try {
            const findOptions: any = { documentId: row.document_id };
            if (locale) {
              findOptions.locale = locale;
            }

            const existing = await strapi.documents(uid as any).findOne(findOptions);

            if (existing) {
              const updateOptions: any = {
                documentId: row.document_id,
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
          } catch (error) {
            const createOptions: any = { data: dataToSave };
            if (locale) {
              createOptions.locale = locale;
            }

            await strapi.documents(uid as any).create(createOptions);
            results.created++;
          }
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

        strapi.log.error('Import error details:', {
          errorMessage: error.message,
          errorDetails: error.details,
          errorBody: error.body,
          errorKeys: Object.keys(error),
          extractedFieldName: errorDetails.fieldName,
        });

        results.errors.push({
          row: i + 1,
          data: row,
          message: errorDetails.message,
          fieldName: errorDetails.fieldName,
        });
      }
    }

    return {
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? 'Import completed successfully' : `Import completed with ${results.errors.length} error(s)`,
      created: results.created,
      updated: results.updated,
      errors: results.errors,
    };
  },
});

export default importService;
