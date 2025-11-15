# API Testing Files

Este directorio contiene archivos para testear los endpoints del plugin Import/Export.

## Archivos

### `test-import-plugin.http`
Archivo para la extensión REST Client de VSCode. Contiene todos los endpoints disponibles.

### `sample-import.csv`
CSV de ejemplo para testear la funcionalidad de import.

## Cómo usar

### 1. Instalar REST Client
Si no lo tienes, instala la extensión [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) en VSCode.

### 2. Configurar el content-type UID
En `test-import-plugin.http`, cambia la variable `@contentTypeUid` por el UID de tu content-type:

```
@contentTypeUid=api::category.category
```

### 3. Asegúrate de que Strapi esté corriendo
```bash
npm run develop
```

### 4. Ejecutar tests
Abre `test-import-plugin.http` en VSCode y:
- Click en "Send Request" sobre cada endpoint
- Los resultados aparecerán en un panel lateral

## Endpoints disponibles

1. **GET /content-types** - Lista todos los collection types
2. **GET /schema/:uid** - Obtiene el schema de un content-type
3. **GET /export/:uid** - Exporta datos a CSV
4. **POST /import/:uid** - Importa datos desde CSV

## Orden recomendado de prueba

1. Primero ejecuta `GET /content-types` para ver tus content-types disponibles
2. Copia el `uid` que quieras testear (ej: `api::category.category`)
3. Actualiza la variable `@contentTypeUid` en el archivo
4. Ejecuta `GET /schema/:uid` para ver el schema
5. Ejecuta `GET /export/:uid` para exportar datos existentes
6. Modifica `sample-import.csv` según el schema
7. Ejecuta `POST /import/:uid` para importar los datos

## Notas

- El CSV de ejemplo asume un content-type con campos `name` y `description`
- Ajusta los campos según tu schema real
- El campo `id` vacío indica que se crearán nuevos registros
- Con un `id` válido, se actualizará el registro existente
