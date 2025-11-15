import type { Core } from '@strapi/strapi';
import { parse } from 'csv-parse/sync';

const importService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async importData(uid: string, csvContent: string) {
    const contentTypeService = strapi.plugin('import-plugin').service('contentTypeService');
    const validationService = strapi.plugin('import-plugin').service('validationService');

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

    const validation = await validationService.validateData(records, schema);

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
              'locale',
              'localizations',
            ].includes(fieldName)
          ) {
            return;
          }

          // Skip media and relation fields - they can't be set from CSV
          if (attribute.type === 'media' || attribute.type === 'relation') {
            return;
          }

          // Handle uid fields - auto-generate from targetField
          if (attribute.type === 'uid') {
            if (attribute.targetField && row[attribute.targetField]) {
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

        if (row.id) {
          try {
            const existing = await strapi.entityService.findOne(uid as any, row.id);

            if (existing) {
              await strapi.entityService.update(uid as any, row.id, {
                data: dataToSave,
              });
              results.updated++;
            } else {
              await strapi.entityService.create(uid as any, {
                data: dataToSave,
              });
              results.created++;
            }
          } catch (error) {
            await strapi.entityService.create(uid as any, {
              data: dataToSave,
            });
            results.created++;
          }
        } else {
          await strapi.entityService.create(uid as any, {
            data: dataToSave,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          data: row,
          message: error.message,
        });

        return {
          success: false,
          message: `Error in row ${i + 1}: ${error.message}`,
          created: results.created,
          updated: results.updated,
          errors: results.errors,
        };
      }
    }

    return {
      success: true,
      message: 'Import completed successfully',
      created: results.created,
      updated: results.updated,
      errors: results.errors,
    };
  },
});

export default importService;
