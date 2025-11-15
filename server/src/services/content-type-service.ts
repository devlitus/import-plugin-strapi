import type { Core } from '@strapi/strapi';

const contentTypeService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async listContentTypes() {
    const contentTypes = Object.keys(strapi.contentTypes)
      .filter((uid) => {
        const ct = strapi.contentTypes[uid];
        return (
          ct.kind === 'collectionType' &&
          !uid.startsWith('plugin::') &&
          !uid.startsWith('admin::')
        );
      })
      .map((uid) => ({
        uid,
        info: strapi.contentTypes[uid].info,
        attributes: strapi.contentTypes[uid].attributes,
      }));

    return contentTypes;
  },

  async getSchema(uid: string) {
    const contentType = strapi.contentTypes[uid];

    if (!contentType) {
      throw new Error(`Content-type ${uid} not found`);
    }

    return {
      uid,
      info: contentType.info,
      attributes: contentType.attributes,
      options: contentType.options,
    };
  },
});

export default contentTypeService;
