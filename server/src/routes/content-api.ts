export default [
  {
    method: 'GET',
    path: '/content-types',
    handler: 'controller.listContentTypes',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/schema/:uid',
    handler: 'controller.getSchema',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/export/:uid',
    handler: 'controller.export',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/import/:uid',
    handler: 'controller.import',
    config: {
      policies: [],
    },
  },
];
