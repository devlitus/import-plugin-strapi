# Fase 4: Import Completo (Relaciones + Media Files)

## Cambios Realizados

### 1. Mejoras en `server/src/services/import-service.ts`

#### ✅ Parseo de Relaciones
- Identifica columnas `{fieldName}_id` en el CSV
- Parsea múltiples IDs separados por comas (ej: `2,3` → `[2, 3]`)
- Elimina espacios en blanco alrededor de IDs
- Asigna correctamente en la data a guardar:
  - **One-to-One / Many-to-One**: Asigna valor único (integer)
  - **One-to-Many / Many-to-Many**: Asigna array de integers

#### ✅ Parseo de Media Files
- Identifica columnas `{fieldName}_id` en el CSV
- Parsea múltiples IDs separados por comas
- Elimina espacios en blanco
- Asigna correctamente en la data a guardar:
  - **Single media**: Asigna valor único (integer)
  - **Multiple media**: Asigna array de integers

### 2. Mejoras en `server/src/services/validation-service.ts`

#### ✅ Validación de IDs de Relaciones
- Nuevo método `validateRelationIds()`
- Verifica que cada ID referenciado existe en el content-type relacionado
- Maneja múltiples IDs en una fila
- Reporta errores claros si algún ID no existe

#### ✅ Validación de IDs de Media Files
- Nuevo método `validateMediaIds()`
- Verifica que cada ID de media existe en la tabla `plugin::upload.file`
- Maneja múltiples IDs en una fila
- Reporta errores claros si algún ID no existe

#### ✅ Validación Integrada
- El método `validateData()` ahora ejecuta:
  1. Validación de tipos y campos requeridos (básica)
  2. Validación de IDs de relaciones
  3. Validación de IDs de media
- Si alguna validación falla, se detiene y reporta todos los errores

## Flujo de Importación

```
CSV Upload (con relaciones y media)
       ↓
Parse CSV con headers
       ↓
Validar estructura básica (tipos, campos requeridos)
       ↓
Validar que IDs de relaciones existen en BD
       ↓
Validar que IDs de media existen en BD
       ↓
Si todas las validaciones pasan → procesar cada fila:
  - Para cada fila:
    - Parsear columnas {field}_id
    - Asignar valores a dataToSave
    - Create/Update en BD
       ↓
Retornar resumen (creados, actualizados, errores)
```

## Ejemplo de CSV para Import

### Content-Type: Article
Con relación `category` (many-to-one), `tags` (many-to-many), media `cover` (single)

```csv
id,title,content,status,category_id,tags_id,cover_id
,New Article 1,Great content,published,5,"2,3",42
,New Article 2,More content,draft,1,"4",43
4,Update Article,Updated content,published,5,"2,3,5",42
```

**Resultado esperado:**
- Fila 1: Crear nuevo, asignar category=5, tags=[2,3], cover=42
- Fila 2: Crear nuevo, asignar category=1, tags=[4], cover=43
- Fila 3: Actualizar ID 4, asignar category=5, tags=[2,3,5], cover=42

## Instrucciones de Testing Manual

### 1. Preparar datos de prueba en Strapi

#### Paso 1: Crear/verificar content-types
Necesitas tener:

**a) Content-Type relacionado** (ej: Category)
```
- id (auto)
- name (string, required)
- displayName: "name"
```

Crear al menos 2 categorías:
- ID 1: "Life"
- ID 5: "Tech"

**b) Otro content-type relacionado** (ej: Tag)
```
- id (auto)
- name (string, required)
- displayName: "name"
```

Crear al menos 4 tags:
- ID 2: "JavaScript"
- ID 3: "React"
- ID 4: "CSS"
- ID 5: "TypeScript"

**c) Media files** (uploads)
Subir al menos 2 archivos:
- ID 42: cualquier imagen
- ID 43: otra imagen

#### Paso 2: Crear el content-type de prueba (Article)
```
Content-Type: "Article"
├── Campos simples:
│   ├── title (string, required)
│   ├── content (richtext)
│   └── status (enumeration: published/draft)
├── Relación:
│   ├── category → Category (many-to-one, not required)
│   └── tags → Tag (many-to-many, not required)
└── Media:
    └── cover → Media (single, not required)
```

### 2. Exportar un CSV de prueba

Desde el plugin:
1. Ir a "Export Data"
2. Seleccionar "Article"
3. Descargar CSV

Deberías obtener un CSV con headers como:
```
id,title,content,status,category_id,category_name,tags_id,tags_name,cover_id,cover_url
```

### 3. Modificar el CSV para testing

Abre el CSV en Excel/Google Sheets y crea nuevas filas:

**Opción A: Archivo CSV de ejemplo**
```csv
id,title,content,status,category_id,tags_id,cover_id
,Test Article 1,Great content,published,5,"2,3",42
,Test Article 2,More content,draft,1,"4",
```

**Opción B: Con actualización**
```csv
id,title,content,status,category_id,tags_id,cover_id
,New Article,New content,published,5,"2,3",42
1,Update Article,Updated content,draft,1,"4",43
```

### 4. Importar el CSV

Desde el plugin:
1. Ir a "Import Data"
2. Seleccionar "Article"
3. Subir el CSV
4. Click "Import CSV"
5. Verificar resultados

### 5. Validar los resultados

En Strapi Admin:

**Para Article 1:**
- ✓ title = "Test Article 1"
- ✓ content = "Great content"
- ✓ status = "published"
- ✓ category = ID 5 (Tech)
- ✓ tags = IDs [2, 3] (JavaScript, React)
- ✓ cover = archivo con ID 42

**Para Article 2:**
- ✓ title = "Test Article 2"
- ✓ content = "More content"
- ✓ status = "draft"
- ✓ category = ID 1 (Life)
- ✓ tags = ID 4 (CSS)
- ✓ cover = sin asignar (vacío)

## Casos de Prueba Especiales

### Caso 1: Validación fallida - ID de categoría no existe
```csv
id,title,content,status,category_id,tags_id,cover_id
,Test Article,Content,published,999,"2,3",42
```

**Resultado esperado:**
```
Error: Relation "category" with ID 999 does not exist
```

### Caso 2: Validación fallida - ID de tag no existe
```csv
id,title,content,status,category_id,tags_id,cover_id
,Test Article,Content,published,5,"2,999",42
```

**Resultado esperado:**
```
Error: Relation "tags" with ID 999 does not exist
```

### Caso 3: Validación fallida - ID de media no existe
```csv
id,title,content,status,category_id,tags_id,cover_id
,Test Article,Content,published,5,"2,3",999
```

**Resultado esperado:**
```
Error: Media file with ID 999 does not exist
```

### Caso 4: Relación vacía (sin asignar)
```csv
id,title,content,status,category_id,tags_id,cover_id
,Test Article,Content,published,,,
```

**Resultado esperado:**
- Artículo creado sin categoría, tags ni cover asignados
- Sin errores

### Caso 5: Actualización de relaciones
```csv
id,title,content,status,category_id,tags_id,cover_id
1,Updated Title,Updated content,published,1,"3,4",43
```

**Resultado esperado:**
- ID 1 actualizado con:
  - category = ID 1 (cambió de 5 a 1)
  - tags = IDs [3, 4] (cambió de [2, 3] a [3, 4])
  - cover = ID 43 (cambió de 42 a 43)

## Limitaciones Conocidas

1. **Solo IDs de registros existentes**: No puedes crear nuevas categorías/tags desde el CSV. Deben existir previamente en la BD.

2. **IDs de media deben existir**: No se descargan/suben archivos nuevos. Solo se asignan archivos ya subidos a Strapi.

3. **Sin validación de tipos en IDs**: Se asume que los IDs en el CSV son números válidos. Si contienen caracteres no numéricos, se parsean y pueden causar errores.

4. **Sin mapeo de nombres a IDs**: No puedes usar "Tech" en lugar de "5". Solo acepta IDs numéricos en columnas `{field}_id`.

## Troubleshooting

### Error: "Relation "X" with ID Y does not exist"
**Solución:**
- Verifica que el ID Y existe en el content-type relacionado
- Usa el mismo ID que ves en Strapi Admin

### Error: "Media file with ID X does not exist"
**Solución:**
- Verifica que el ID X existe en la sección Media de Strapi
- Copia el ID correcto del archivo media en Strapi Admin

### Error: "Field 'X' must be an integer"
**Solución:**
- Verifica que la columna `{field}_id` contiene solo números
- Si son múltiples, usa comas sin espacios (ej: "2,3" no "2, 3")

### Los cambios no se guardan
**Solución:**
- Verifica que la validación pasó (sin errores mostrados)
- Actualiza la página para ver los cambios
- Revisa la consola del navegador para errores

## Diferencias con Fase 2 (Export)

| Aspecto | Fase 2 (Export) | Fase 4 (Import) |
|---------|-----------------|-----------------|
| **Relaciones** | Exporta `{field}_id` y `{field}_name` | Lee `{field}_id` y asigna por ID |
| **Media** | Exporta `{field}_id` y `{field}_url` | Lee `{field}_id` y asigna por ID |
| **Validación** | No hay | Valida que IDs existen |
| **Múltiples valores** | Separados por comas | Separados por comas |
| **Vacíos** | Columnas vacías si sin dato | Permite vacíos (no asigna) |

## Próximas Fases

- **Fase 7**: Testing end-to-end (ya completada en teoría)
- **v2+**:
  - FieldMapper en frontend (mapeo de columnas)
  - Filtros avanzados en export
  - Soporte para más formatos (JSON, Excel)
  - Descargar/subir media files durante import
  - Procesar volúmenes grandes de forma asíncrona
