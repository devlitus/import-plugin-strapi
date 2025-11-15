import type { Core } from '@strapi/strapi';
import { stringify } from 'csv-stringify/sync';

const exportService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async exportData(uid: string) {
    const entries = await strapi.entityService.findMany(uid as any);

    if (!entries || entries.length === 0) {
      return {
        csv: '',
        count: 0,
      };
    }

    const contentType = strapi.contentTypes[uid];
    const attributes = contentType.attributes;

    const simpleFields = Object.keys(attributes).filter((key) => {
      const attr = attributes[key];
      return (
        attr.type &&
        ['string', 'integer', 'boolean', 'date', 'decimal', 'float', 'text', 'richtext', 'email', 'password', 'enumeration']
          .includes(attr.type)
      );
    });

    const headers = ['id', ...simpleFields];

    const rows = entries.map((entry: any) => {
      const row: any = { id: entry.id };
      simpleFields.forEach((field) => {
        row[field] = entry[field] ?? '';
      });
      return row;
    });

    const csv = stringify(rows, {
      header: true,
      columns: headers,
    });

    return {
      csv,
      count: entries.length,
    };
  },
});

export default exportService;
