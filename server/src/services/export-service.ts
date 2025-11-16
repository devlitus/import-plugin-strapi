import type { Core } from '@strapi/strapi';
import { stringify } from 'csv-stringify/sync';

const exportService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async exportData(uid: string) {
    const contentType = strapi.contentTypes[uid];
    const attributes = contentType.attributes;

    const relationFields: string[] = [];
    const mediaFields: string[] = [];
    const populateFields: any = {};

    Object.keys(attributes).forEach((key) => {
      const attr = attributes[key];
      if (attr.type === 'relation') {
        relationFields.push(key);
        populateFields[key] = true;
      } else if (attr.type === 'media') {
        mediaFields.push(key);
        populateFields[key] = true;
      }
    });

    const entries = await strapi.documents(uid as any).findMany({
      populate: Object.keys(populateFields).length > 0 ? populateFields : undefined,
    });

    if (!entries || entries.length === 0) {
      return {
        csv: '',
        count: 0,
      };
    }

    const relationDisplayFields: Record<string, string> = {};
    relationFields.forEach((field) => {
      const attr = attributes[field];
      const targetUid = attr.target;
      if (targetUid && strapi.contentTypes[targetUid]) {
        const targetContentType = strapi.contentTypes[targetUid];
        const displayField = targetContentType.attributes?.name
          ? 'name'
          : targetContentType.attributes?.title
            ? 'title'
            : 'documentId';
        relationDisplayFields[field] = displayField;
      } else {
        relationDisplayFields[field] = 'documentId';
      }
    });

    const simpleFields = Object.keys(attributes).filter((key) => {
      const attr = attributes[key];
      return (
        attr.type &&
        ['string', 'integer', 'boolean', 'date', 'decimal', 'float', 'text', 'richtext', 'email', 'password', 'enumeration']
          .includes(attr.type)
      );
    });

    const headers = ['document_id', ...simpleFields];

    relationFields.forEach((field) => {
      headers.push(`${field}_document_id`, `${field}_name`);
    });

    mediaFields.forEach((field) => {
      headers.push(`${field}_id`, `${field}_url`);
    });

    const rows = entries.map((entry: any) => {
      const row: any = { document_id: entry.documentId };

      simpleFields.forEach((field) => {
        row[field] = entry[field] ?? '';
      });

      relationFields.forEach((field) => {
        const relatedData = entry[field];
        const displayField = relationDisplayFields[field];
        if (relatedData) {
          if (Array.isArray(relatedData)) {
            row[`${field}_document_id`] = relatedData.map((r: any) => r.documentId).join(',');
            row[`${field}_name`] = relatedData.map((r: any) => r[displayField] || '').join(',');
          } else {
            row[`${field}_document_id`] = relatedData.documentId ?? '';
            row[`${field}_name`] = relatedData[displayField] ?? '';
          }
        } else {
          row[`${field}_document_id`] = '';
          row[`${field}_name`] = '';
        }
      });

      mediaFields.forEach((field) => {
        const mediaData = entry[field];
        if (mediaData) {
          if (Array.isArray(mediaData)) {
            row[`${field}_id`] = mediaData.map((m: any) => m.id).join(',');
            row[`${field}_url`] = mediaData.map((m: any) => m.url).join(',');
          } else {
            row[`${field}_id`] = mediaData.id ?? '';
            row[`${field}_url`] = mediaData.url ?? '';
          }
        } else {
          row[`${field}_id`] = '';
          row[`${field}_url`] = '';
        }
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
