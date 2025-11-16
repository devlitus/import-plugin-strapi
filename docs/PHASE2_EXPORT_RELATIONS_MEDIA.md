# Fase 2: Export Completo (Relaciones + Media Files)

## Cambios Realizados

### 1. Mejoras en `server/src/services/export-service.ts`

#### ✅ Detección de campos de relación y media
- Identifica automáticamente campos de tipo `relation` y `media`
- Construye un objeto `populate` para obtener datos relacionados

#### ✅ Exportación de Relaciones
- Exporta **dos columnas** por cada relación:
  - `{fieldName}_id`: IDs de los registros relacionados (comma-separated para relaciones múltiples)
  - `{fieldName}_name`: Nombres/títulos de los registros relacionados

- Detecta automáticamente el campo de display del content-type relacionado:
  - Busca primero si existe campo `name`
  - Si no, busca campo `title`
  - Si ninguno existe, usa `id` como fallback

- Maneja ambos tipos de relaciones:
  - **One-to-One / Many-to-One**: Exporta valor único
  - **One-to-Many / Many-to-Many**: Exporta valores separados por comas

#### ✅ Exportación de Media Files
- Exporta **dos columnas** por cada campo media:
  - `{fieldName}_id`: IDs de los archivos media (comma-separated para múltiples)
  - `{fieldName}_url`: URLs públicas de los archivos media

- Maneja ambos tipos:
  - **Single media**: Exporta valor único
  - **Multiple media**: Exporta valores separados por comas

### 2. Comportamiento del Servicio

```typescript
// Antes (solo campos simples):
id, title, content, status

// Después (incluye relaciones y media):
id, title, content, status, category_id, category_name, tags_id, tags_name, cover_id, cover_url
```

## Ejemplo de Exportación

### Content-Type: Article
- Campos simples: `title`, `content`, `status`
- Relación: `category` (many-to-one)
- Relación: `tags` (many-to-many)
- Media: `cover` (single)

### CSV Exportado
```csv
id,title,content,status,category_id,category_name,tags_id,tags_name,cover_id,cover_url
1,My Article,Great content,published,5,Tech,"2,3","JavaScript,React",42,http://localhost:1337/uploads/cover.jpg
2,Another Post,More content,draft,1,Life,"4",Design,43,http://localhost:1337/uploads/cover2.jpg
```

## Instrucciones de Testing Manual

### 1. Preparar un Content-Type con Relaciones y Media

En tu instancia de Strapi, crea o usa un content-type que incluya:

**Opción A - Crear rápidamente:**
```
Content-Type: "Blog Post"
├── Campos simples:
│   ├── title (string, required)
│   ├── content (richtext)
│   └── published_at (date)
├── Relación:
│   ├── category → Category (many-to-one)
│   └── tags → Tag (many-to-many)
└── Media:
    └── cover → Media (single)
```

**Opción B - Usar existentes:**
Si ya tienes content-types con relaciones, úsalos directamente.

### 2. Crear datos de prueba

En Strapi admin, crea al menos 2-3 registros con:
- Datos en los campos simples
- Al menos una relación asignada
- Al menos un archivo media asignado

### 3. Ejecutar Export desde el Plugin

1. Abrir el plugin → "Export Data"
2. Seleccionar el content-type con relaciones
3. Hacer click en "Download CSV"
4. Guardar el archivo

### 4. Verificar el CSV Descargado

Abrir el CSV en Excel, Google Sheets o editor de texto y validar:

- ✓ Headers incluyen:
  - Columnas simples del content-type
  - `{relacion}_id` y `{relacion}_name` para cada relación
  - `{media}_id` y `{media}_url` para cada media

- ✓ Datos en filas:
  - IDs de relaciones presentes y válidos
  - Nombres/títulos de relaciones mostrados correctamente
  - URLs de media son absolutas (http://...)
  - Para relaciones múltiples: valores separados por comas

- ✓ Formato CSV válido:
  - No hay errores de parsing
  - Quoted fields si contienen comas o newlines

### 5. Casos de Prueba Específicos

#### Caso 1: Relación One-to-Many
```csv
# Esperado:
id, title, category_id, category_name
1, Article, 5, Tech
2, Post, 1, Life
```

#### Caso 2: Relación Many-to-Many
```csv
# Esperado (valores comma-separated):
id, title, tags_id, tags_name
1, Article, "2,3", "JavaScript,React"
2, Post, "4", "CSS"
```

#### Caso 3: Media Single
```csv
# Esperado:
id, title, cover_id, cover_url
1, Article, 42, http://localhost:1337/uploads/cover.jpg
```

#### Caso 4: Media Multiple
```csv
# Esperado (valores comma-separated):
id, title, images_id, images_url
1, Article, "1,2,3", "http://localhost:1337/uploads/img1.jpg,http://localhost:1337/uploads/img2.jpg,http://localhost:1337/uploads/img3.jpg"
```

#### Caso 5: Valores Vacíos (sin relación asignada)
```csv
# Esperado (columnas vacías si no hay dato):
id, title, category_id, category_name
3, Draft, "", ""
```

## Limitaciones Conocidas

1. **Relaciones sin display field**: Si el content-type relacionado no tiene `name` ni `title`, se usa `id` en la columna `_name`

2. **URLs relativas en media**: Las URLs de media se obtienen del objeto media de Strapi. Asegúrate de que tu Strapi está correctamente configurado con la URL base.

3. **Sin filtros**: El export exporta **todos** los registros. Los filtros avanzados están planeados para v2.

4. **Orden en CSV**: Las columnas se ordenan como:
   - `id` primero
   - Campos simples en orden del schema
   - Relaciones en orden del schema
   - Media en orden del schema

## Resultado Esperado

✅ El plugin debería exportar correctamente cualquier content-type con:
- Campos simples
- Relaciones (one-to-many, many-to-many, etc.)
- Media files (single y multiple)

❌ Si encuentras issues:
- Los IDs no coinciden con los datos en Strapi → verificar que los IDs son correctos en la BD
- URLs de media están mal → revisar configuración de URL base en Strapi
- Nombres de relaciones vacíos → el content-type relacionado quizás no tiene field `name` ni `title`

## Próximas Fases

- **Fase 3**: Ya completada (import básico)
- **Fase 4**: Implementar import de relaciones y media
- **Fases 5-7**: Ya completadas (frontend y testing)
