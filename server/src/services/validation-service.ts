import type { Core } from '@strapi/strapi';

const validationService = ({ strapi }: { strapi: Core.Strapi }) => ({
  validateRow(row: any, schema: any, rowIndex: number) {
    const errors: any[] = [];
    const attributes = schema.attributes;

    Object.keys(attributes).forEach((fieldName) => {
      const attribute = attributes[fieldName];
      const value = row[fieldName];

      // Skip validation for system fields
      if (['createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations'].includes(fieldName)) {
        return;
      }

      // Skip required validation for fields with defaults or certain types
      const hasDefault = attribute.default !== undefined;
      const isMedia = attribute.type === 'media';
      const isRelation = attribute.type === 'relation';
      const isUid = attribute.type === 'uid';

      // Check if value is empty
      const isEmpty = value === undefined || value === null || value === '';

      if (attribute.required && isEmpty) {
        // Only require fields that don't have defaults and aren't media/relations
        if (!hasDefault && !isMedia && !isRelation && !isUid) {
          errors.push({
            row: rowIndex,
            field: fieldName,
            message: `Field "${fieldName}" is required`,
          });
        }
      }

      // Only validate type if value is provided and field doesn't have a default
      if (!isEmpty) {
        if (attribute.type === 'integer' && isNaN(parseInt(value))) {
          errors.push({
            row: rowIndex,
            field: fieldName,
            message: `Field "${fieldName}" must be an integer`,
          });
        }

        if (attribute.type === 'decimal' || attribute.type === 'float') {
          if (isNaN(parseFloat(value))) {
            errors.push({
              row: rowIndex,
              field: fieldName,
              message: `Field "${fieldName}" must be a number`,
            });
          }
        }

        if (attribute.type === 'boolean') {
          const validBooleanValues = ['true', 'false', 'True', 'False', '1', '0', 'yes', 'no', 'Yes', 'No'];
          if (!validBooleanValues.includes(String(value)) && value !== true && value !== false) {
            errors.push({
              row: rowIndex,
              field: fieldName,
              message: `Field "${fieldName}" must be a boolean (true/false/1/0)`,
            });
          }
        }
      }
    });

    return errors;
  },

  async validateRelationIds(row: any, schema: any, rowIndex: number) {
    const errors: any[] = [];
    const attributes = schema.attributes;

    for (const fieldName of Object.keys(attributes)) {
      const attribute = attributes[fieldName];

      if (attribute.type !== 'relation') {
        continue;
      }

      const idColumnName = `${fieldName}_document_id`;
      const value = row[idColumnName];

      if (!value || value === '') {
        continue;
      }

      const targetUid = attribute.target;
      if (!targetUid) {
        continue;
      }

      const ids = String(value)
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);

      for (const id of ids) {
        try {
          const exists = await strapi.documents(targetUid as any).findOne({
            documentId: id,
          });
          if (!exists) {
            errors.push({
              row: rowIndex,
              field: fieldName,
              message: `Relation "${fieldName}" with document_id ${id} does not exist`,
            });
          }
        } catch (error) {
          errors.push({
            row: rowIndex,
            field: fieldName,
            message: `Failed to validate relation "${fieldName}" with document_id ${id}`,
          });
        }
      }
    }

    return errors;
  },

  async validateMediaIds(row: any, schema: any, rowIndex: number) {
    const errors: any[] = [];
    const attributes = schema.attributes;

    for (const fieldName of Object.keys(attributes)) {
      const attribute = attributes[fieldName];

      if (attribute.type !== 'media') {
        continue;
      }

      const idColumnName = `${fieldName}_id`;
      const value = row[idColumnName];

      if (!value || value === '') {
        continue;
      }

      const ids = String(value)
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);

      for (const id of ids) {
        try {
          const exists = await strapi.db.query('plugin::upload.file').findOne({
            where: { id: parseInt(id) },
          });
          if (!exists) {
            errors.push({
              row: rowIndex,
              field: fieldName,
              message: `Media file with ID ${id} does not exist`,
            });
          }
        } catch (error) {
          errors.push({
            row: rowIndex,
            field: fieldName,
            message: `Failed to validate media file with ID ${id}`,
          });
        }
      }
    }

    return errors;
  },

  async validateUniqueFields(row: any, schema: any, rowIndex: number, uid: string) {
    const errors: any[] = [];
    const attributes = schema.attributes;

    for (const fieldName of Object.keys(attributes)) {
      const attribute = attributes[fieldName];

      if (!attribute.unique) {
        continue;
      }

      const value = row[fieldName];
      if (!value || value === '') {
        continue;
      }

      try {
        const query: any = {
          [fieldName]: value,
        };

        if (row.document_id) {
          query.documentId = { $ne: row.document_id };
        }

        const existing = await strapi.documents(uid as any).findOne(query);

        if (existing) {
          errors.push({
            row: rowIndex,
            field: fieldName,
            message: `Field "${fieldName}" must be unique - value "${value}" already exists`,
          });
        }
      } catch (error: any) {
        errors.push({
          row: rowIndex,
          field: fieldName,
          message: `Failed to validate unique constraint on field "${fieldName}": ${error.message}`,
        });
      }
    }

    return errors;
  },

  async validateData(rows: any[], schema: any, uid?: string) {
    const allErrors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 1;

      const basicErrors = this.validateRow(row, schema, rowIndex);
      allErrors.push(...basicErrors);

      const relationErrors = await this.validateRelationIds(row, schema, rowIndex);
      allErrors.push(...relationErrors);

      const mediaErrors = await this.validateMediaIds(row, schema, rowIndex);
      allErrors.push(...mediaErrors);

      if (uid) {
        const uniqueErrors = await this.validateUniqueFields(row, schema, rowIndex, uid);
        allErrors.push(...uniqueErrors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  },
});

export default validationService;
