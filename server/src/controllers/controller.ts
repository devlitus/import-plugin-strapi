import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async listContentTypes(ctx) {
    try {
      const contentTypes = await strapi
        .plugin('import-plugin')
        .service('contentTypeService')
        .listContentTypes();

      ctx.body = {
        data: contentTypes,
      };
    } catch (error) {
      ctx.throw(400, error);
    }
  },

  async getSchema(ctx) {
    try {
      const { uid } = ctx.params;

      if (!uid) {
        return ctx.throw(400, 'uid parameter is required');
      }

      const schema = await strapi
        .plugin('import-plugin')
        .service('contentTypeService')
        .getSchema(uid);

      ctx.body = {
        data: schema,
      };
    } catch (error: any) {
      strapi.log.error('Error in getSchema:', error);
      return ctx.throw(500, error.message || 'Error getting schema');
    }
  },

  async export(ctx) {
    try {
      const { uid } = ctx.params;

      if (!uid) {
        ctx.throw(400, 'uid parameter is required');
      }

      const { csv } = await strapi
        .plugin('import-plugin')
        .service('exportService')
        .exportData(uid);

      ctx.type = 'text/csv';
      ctx.set('Content-Disposition', `attachment; filename="${uid}_${Date.now()}.csv"`);
      ctx.body = csv;
    } catch (error) {
      ctx.throw(400, error);
    }
  },

  async import(ctx) {
    try {
      const { uid } = ctx.params;

      if (!uid) {
        ctx.throw(400, 'uid parameter is required');
      }

      const files = ctx.request.files;
      let file = files?.file;

      if (!file && ctx.request.body?.files) {
        file = ctx.request.body.files.file;
      }

      if (!file) {
        ctx.throw(400, 'CSV file is required');
      }

      const fs = require('fs');
      const filePath = file.filepath || file.path || file.tempFilePath;

      if (!filePath) {
        ctx.throw(400, 'File path not found. File object: ' + JSON.stringify(Object.keys(file)));
      }

      const csvContent = fs.readFileSync(filePath, 'utf-8');

      const result = await strapi
        .plugin('import-plugin')
        .service('importService')
        .importData(uid, csvContent);

      ctx.body = {
        data: result,
      };
    } catch (error) {
      ctx.throw(400, error);
    }
  },
});

export default controller;
