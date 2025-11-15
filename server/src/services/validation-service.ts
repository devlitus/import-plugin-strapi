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

  async validateData(rows: any[], schema: any) {
    const allErrors: any[] = [];

    rows.forEach((row, index) => {
      const rowErrors = this.validateRow(row, schema, index + 1);
      allErrors.push(...rowErrors);
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  },
});

export default validationService;
