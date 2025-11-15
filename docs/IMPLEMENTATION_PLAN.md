# Plan de Implementación: Import/Export Plugin (v1)

## Objetivo

Implementar funcionalidad de import/export de datos para Strapi 5.x con las siguientes características:

- **Formato**: CSV únicamente
- **Alcance**: Collection types + relaciones + media files
- **Operaciones**:
  - Export: seleccionar content-type → filtrar (opcional) → exportar
  - Import: crear nuevos + actualizar existentes (nunca eliminar) + mapeo si schema cambió
- **Validaciones**: Validar contra schema, detener si hay errores, reportar
- **Volumen**: Pequeño (decenas de registros), procesamiento síncrono

---

## Arquitectura General

### Backend (Server)

#### 1. Rutas (`server/src/routes/content-api.ts`)

```
GET  /api/import-plugin/content-types          → Listar collection types disponibles
GET  /api/import-plugin/schema/:uid            → Obtener schema de un content-type
GET  /api/import-plugin/export/:uid            → Exportar datos en CSV (con filtros query params)
POST /api/import-plugin/import/:uid            → Importar CSV
```

#### 2. Servicios (`server/src/services/`)

##### a) `content-type-service`
- Listar todos los collection types del proyecto
- Obtener schema de un content-type específico
- Validar que el uid existe

##### b) `export-service`
- Consultar registros del content-type (con filtros opcionales)
- Transformar datos:
  - **Relaciones**: exportar IDs + campo display (ej: `category_id`, `category_name`)
  - **Media files**: exportar IDs + URLs
  - **Campos simples**: valores directos
- Generar CSV con headers basados en schema
- Retornar stream/buffer del CSV

##### c) `import-service`
- Parsear CSV (librería: `csv-parse` o `fast-csv`)
- **Validar estructura**:
  - Headers vs schema actual
  - Si no coinciden → retornar error con mapeo necesario
- **Validar datos**:
  - Tipos de datos (string, number, boolean, date)
  - Campos requeridos
  - Relaciones (verificar que IDs existen)
  - Media files (verificar que IDs existen)
- **Procesamiento**:
  - Para cada fila:
    - Buscar si registro existe (por ID o campo único)
    - Si existe → actualizar (`update`)
    - Si no existe → crear (`create`)
  - Si hay error en cualquier fila → detener todo y rollback (transacción si es posible)
- **Reporte**: retornar resumen (creados, actualizados, errores)

##### d) `validation-service`
- Validar fila contra schema
- Retornar errores detallados (fila, campo, razón)

#### 3. Controladores (`server/src/controllers/`)
- Delegar lógica a servicios
- Manejar respuestas HTTP (200, 400, 500)
- Para export: setear headers de descarga CSV

---

### Frontend (Admin)

#### 1. Estructura de páginas (`admin/src/pages/`)

##### a) `HomePage.tsx` (dashboard)
```
┌────────────────────────────────────┐
│   Import/Export Plugin             │
├────────────────────────────────────┤
│                                    │
│  [📤 Export Data]  [📥 Import Data] │
│                                    │
│  Recent Activity (opcional v2)     │
└────────────────────────────────────┘
```

##### b) `ExportPage.tsx`
```
┌────────────────────────────────────┐
│  1. Select Content Type            │
│     [Dropdown: Article, User...]   │
│                                    │
│  2. Filters (opcional v2)          │
│     [ Skip for v1 ]                │
│                                    │
│  3. Export                         │
│     [Download CSV Button]          │
└────────────────────────────────────┘
```

##### c) `ImportPage.tsx`
```
┌────────────────────────────────────┐
│  Step 1: Select Content Type       │
│     [Dropdown: Article, User...]   │
│                                    │
│  Step 2: Upload CSV                │
│     [Drag & Drop / Browse]         │
│     [file-name.csv] ✓              │
│                                    │
│  Step 3: Field Mapping             │
│     CSV Column    →  Schema Field  │
│     title         →  [title ▼]     │
│     desc          →  [description ▼]│
│     ...                            │
│                                    │
│  Step 4: Import                    │
│     [Import Button]                │
│                                    │
│  Results:                          │
│     ✓ 15 created, 5 updated        │
│     ✗ Error in row 8: ...          │
└────────────────────────────────────┘
```

#### 2. Componentes (`admin/src/components/`)

##### a) `ContentTypeSelector`
- Dropdown para seleccionar collection type
- Fetch de `/content-types` al montar

##### b) `FileUploader`
- Drag & drop de archivo CSV
- Validación: solo `.csv`
- Preview de nombre/tamaño

##### c) `FieldMapper`
- Tabla: columnas CSV ↔ campos schema
- Dropdowns para mapear
- Detectar automáticamente coincidencias exactas
- Opción "Ignore column"

##### d) `ImportResults`
- Mostrar resumen (creados, actualizados)
- Lista de errores con fila y detalle
- Botón para reintentar o volver

##### e) `ExportButton`
- Botón que llama a `/export/:uid`
- Trigger de descarga del CSV

#### 3. Estado y lógica

##### Para ExportPage:
- Estado: `selectedContentType`
- Al hacer click en "Download":
  - `GET /export/:uid`
  - Descargar archivo con nombre: `{contentType}_{timestamp}.csv`

##### Para ImportPage:
- Estado: `selectedContentType`, `file`, `fieldMapping`, `importResults`
- Flujo:
  1. Seleccionar content-type
  2. Subir CSV → parsear localmente para obtener headers
  3. Fetch schema → comparar headers vs campos
  4. Si no coinciden → mostrar `FieldMapper`
  5. Al confirmar import → `POST /import/:uid` con file + mapping
  6. Mostrar resultados/errores

---

## Consideraciones Técnicas

### 1. Manejo de Relaciones en CSV

#### Export:
```csv
id,title,category_id,category_name,tags_ids,tags_names
1,Article 1,5,Tech,"[2,3]","[JavaScript,React]"
```

#### Import:
- Buscar relaciones por `{relation}_id`
- Validar que IDs existen antes de asignar
- Si no existe → error

### 2. Manejo de Media Files en CSV

#### Export:
```csv
id,title,cover_id,cover_url
1,Article 1,42,http://localhost:1337/uploads/image.jpg
```

#### Import:
- Opción simple (v1): solo aceptar IDs de media existentes
- No descargar/subir archivos (eso sería v2)

### 3. Validación contra Schema

Para cada campo:
- Tipo: `string`, `integer`, `boolean`, `date`, `relation`, `media`
- Required: `true/false`
- Min/max (strings, numbers)

Validar antes de intentar create/update.

### 4. Transacciones

Strapi no tiene transacciones nativas, pero podemos:
- Validar TODAS las filas primero
- Si alguna falla → detener sin guardar nada
- Si todas pasan → guardar en orden

### 5. Librerías necesarias

#### Backend:
- `csv-parse` o `fast-csv` (parsear CSV)
- `csv-stringify` (generar CSV)

#### Frontend:
- `papaparse` (parsear CSV en browser)
- `@strapi/design-system` (ya incluido)

### 6. Acceso a la Base de Datos desde el Plugin

El plugin tiene acceso completo a la base de datos de la instancia de Strapi a través del objeto `strapi` que se inyecta automáticamente en servicios y controladores.

#### APIs disponibles en Strapi 5:

##### a) Entity Service API (recomendado para CRUD)
```typescript
// Leer registros
const entries = await strapi.entityService.findMany('api::article.article', {
  filters: { status: 'published' },
  populate: ['category', 'cover']
});

// Crear registro
const newEntry = await strapi.entityService.create('api::article.article', {
  data: {
    title: 'My Article',
    category: 5,  // ID de relación
    cover: 42     // ID de media
  }
});

// Actualizar registro
const updatedEntry = await strapi.entityService.update('api::article.article', entryId, {
  data: {
    title: 'Updated Title'
  }
});

// Buscar un registro por ID
const entry = await strapi.entityService.findOne('api::article.article', entryId);
```

##### b) Document Service API (nuevo en Strapi 5)
```typescript
// Similar a Entity Service pero con mejor soporte para drafts/publish
const document = await strapi.documents('api::article.article').create({
  data: {
    title: 'My Article'
  }
});
```

##### c) Query Engine API (para queries complejas)
```typescript
const entries = await strapi.db.query('api::article.article').findMany({
  where: { status: 'published' }
});
```

#### Ejemplo de implementación en import-service:

```typescript
// server/src/services/import-service.ts
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async importData(uid: string, rows: any[]) {
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        // Buscar si existe (por ID)
        const existing = row.id
          ? await strapi.entityService.findOne(uid, row.id)
          : null;

        if (existing) {
          // Actualizar
          await strapi.entityService.update(uid, row.id, {
            data: row
          });
          results.updated++;
        } else {
          // Crear nuevo
          await strapi.entityService.create(uid, {
            data: row
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          row,
          error: error.message
        });
        throw error; // Detener si hay error
      }
    }

    return results;
  }
});
```

#### Obtener content-types y schemas:

```typescript
// server/src/services/content-type-service.ts
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async listContentTypes() {
    // Obtener todos los content-types registrados
    const contentTypes = Object.keys(strapi.contentTypes)
      .filter(uid => {
        const ct = strapi.contentTypes[uid];
        // Filtrar solo collection types (no components, ni single types)
        return ct.kind === 'collectionType' &&
               !uid.startsWith('plugin::') &&
               !uid.startsWith('admin::');
      })
      .map(uid => ({
        uid,
        info: strapi.contentTypes[uid].info,
        attributes: strapi.contentTypes[uid].attributes
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
      options: contentType.options
    };
  }
});
```

#### Flujo completo de datos:

```
┌─────────────────────────────────────────────────┐
│  Usuario sube CSV con datos de "api::article"  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Controller recibe request                      │
│  ctx.body = await strapi                        │
│    .plugin('import-plugin')                     │
│    .service('import-service')                   │
│    .importData('api::article.article', data)    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  import-service:                                │
│  - Valida datos contra schema                   │
│  - Para cada fila:                              │
│    • strapi.entityService.findOne() → buscar    │
│    • strapi.entityService.update() → actualizar │
│    • strapi.entityService.create() → crear      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Strapi escribe en la base de datos             │
│  (PostgreSQL, MySQL, SQLite, etc.)              │
│  Automáticamente aplica:                        │
│  - Validaciones del schema                      │
│  - Lifecycles (beforeCreate, afterUpdate, etc.) │
│  - Relaciones                                   │
└─────────────────────────────────────────────────┘
```

#### Ventajas de usar Entity Service API:

1. **Validaciones automáticas**: respeta el schema del content-type
2. **Lifecycles hooks**: ejecuta beforeCreate, afterCreate, etc.
3. **Relaciones**: maneja automáticamente las relaciones
4. **Permisos**: respeta los permisos configurados
5. **Agnóstico de BD**: funciona con cualquier base de datos que use Strapi

---

## Orden de Implementación

### Fase 1: Backend básico
1. Service: `content-type-service` (listar, schema)
2. Service: `export-service` (sin relaciones ni media)
3. Routes + Controllers para export
4. **Test manual**: exportar collection simple

### Fase 2: Export completo
5. Añadir manejo de relaciones en export
6. Añadir manejo de media en export
7. **Test manual**: exportar con relaciones y media

### Fase 3: Import básico
8. Service: `import-service` (parsear, validar, crear/actualizar)
9. Service: `validation-service`
10. Routes + Controllers para import
11. **Test manual**: importar CSV simple

### Fase 4: Import completo
12. Añadir manejo de relaciones en import
13. Añadir manejo de media en import
14. **Test manual**: importar con relaciones y media

### Fase 5: Frontend Export
15. Componente: `ContentTypeSelector`
16. Página: `ExportPage`
17. Componente: `ExportButton`
18. Routing y navegación
19. **Test manual**: UI de export

### Fase 6: Frontend Import
20. Componente: `FileUploader`
21. Componente: `FieldMapper`
22. Componente: `ImportResults`
23. Página: `ImportPage`
24. **Test manual**: UI de import completo

### Fase 7: Integración final
25. Testing end-to-end
26. Manejo de errores y edge cases
27. i18n (traducciones)
28. Documentación básica

---

## Notas para futuras iteraciones (v2+)

- Filtros avanzados en export
- Procesamiento asíncrono para volúmenes grandes
- Soporte para más formatos (JSON, Excel)
- Descargar/subir media files durante import
- Preview de datos antes de import
- Historial de imports/exports
- Scheduled exports
- Validaciones personalizadas por content-type
