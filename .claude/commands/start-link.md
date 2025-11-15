Start the plugin watch:link process to enable live development with a Strapi instance.

Steps:
1. Build the plugin first
2. Start watch:link in background
3. Provide instructions for linking to Strapi instance

Execute:
```bash
npm run build && npm run watch:link
```

Then tell the user to run in their Strapi instance:
```bash
yalc add import-plugin
npm install
npm run develop
```
