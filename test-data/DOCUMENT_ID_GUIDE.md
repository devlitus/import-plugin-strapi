# Guía: document_id en CSV para Strapi 5

El plugin ha sido actualizado para soportar correctamente `document_id` (UUID) en lugar de `id` numérico. Esta es la forma correcta de trabajar con Strapi 5.x cuando tienes `draftAndPublish: true`.

## ¿Qué cambió?

**Antes (antiguo):**
```csv
id,name,category_id
1,Bebé,5
```

**Ahora (correcto para Strapi 5):**
```csv
document_id,name,category_document_id
550e8400-e29b-41d4-a716-446655440001,Bebé,550e8400-e29b-41d4-a716-446655440099
```

## Cambios en el Plugin

### Export (Exportar)

Cuando exportas datos, ahora el CSV incluirá:
- **document_id** en lugar de id
- **{field}_document_id** para relaciones (en lugar de {field}_id)
- **{field}_id** y **{field}_url** para media files (sin cambios)

**Ejemplo CSV exportado:**
```csv
document_id,name,description,category_document_id,category_name,image_id,image_url
550e8400-e29b-41d4-a716-446655440001,Bebé,Ropa para bebés,550e8400-e29b-41d4-a716-446655440099,Principal,1,http://localhost:1337/uploads/...
```

### Import (Importar)

Cuando importas datos, el CSV debe tener:
- **document_id** para actualizar registros existentes (opcional)
- **{field}_document_id** para relaciones (no {field}_id)
- **{field}_id** para media files (sin cambios)

**Ejemplo CSV para importar:**
```csv
document_id,name,description,category_document_id,image_id
,Bebé,Ropa para bebés,550e8400-e29b-41d4-a716-446655440099,1
550e8400-e29b-41d4-a716-446655440001,Bebé Updated,Nueva descripción,550e8400-e29b-41d4-a716-446655440099,2
```

**Nota:** Si el `document_id` está vacío, el plugin **crea** un nuevo registro. Si tiene valor, **actualiza** el existente.

## Archivos CSV Proporcionados

### 1. `categories-with-document-id.csv`
Contiene 3 categorías con:
- **document_id**: UUIDs ficticios (reemplazar con los reales de tu Strapi)
- **subcategories_document_id**: relaciones a subcategorías
- **products_document_id**: relaciones a productos

### 2. `subcategories-with-document-id.csv`
Contiene 8 subcategorías con:
- **document_id**: UUIDs ficticios
- **category_document_id**: relación many-to-one a categoría

## Cómo Usar

### Paso 1: Obtener document_ids Reales

Los CSVs incluyen document_ids **ficticios**. Necesitas reemplazarlos con los UUIDs reales de tu Strapi.

**Opción A: Desde el Admin Panel**
1. Strapi Admin → Content Manager → Categories
2. Haz click en cada categoría
3. En la URL deberías ver algo como: `/admin/content-manager/collection-types/api::category.category/550e8400...`
4. El UUID después del último `/` es el `document_id`

**Opción B: Exportar desde el Plugin**
1. Plugin → Export Data → Category
2. Descargar CSV
3. El archivo incluirá los `document_id` correctos
4. Copiar los UUIDs del CSV exportado
5. Pegarlos en tu CSV para importar

**Opción C: Query a la API**
```bash
curl http://localhost:1337/api/categories
```

Obtendrás:
```json
{
  "data": [
    {
      "documentId": "550e8400-e29b-41d4-a716-446655440001",
      "id": 1,
      "attributes": {
        "name": "Bebé",
        ...
      }
    }
  ]
}
```

### Paso 2: Reemplazar document_ids en el CSV

Abre el CSV en Excel o editor de texto y reemplaza los UUIDs ficticios con los reales.

**Ejemplo:**
```csv
document_id,name,category_document_id
550e8400-e29b-41d4-a716-446655440001,Ropa Bebé,550e8400-e29b-41d4-a716-446655440099
```

Cambia a:
```csv
document_id,name,category_document_id
a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5,Ropa Bebé,f1e2d3c4-b5a6-4f8e-9d0c-1a2b3c4d5e6f
```

### Paso 3: Importar

1. Plugin → Import Data
2. Selecciona content-type (Category o Subcategory)
3. Upload el CSV actualizado
4. Click "Import CSV"

**Resultado esperado:**
- Si todos los `document_id` están vacíos: ✓ X created, 0 updated
- Si algunos `document_id` tienen valores: ✓ X created, Y updated

## Entendiendo document_id vs id

En Strapi 5 con draft & publish:

| Campo | Tipo | Descripción | Cambia |
|-------|------|-------------|--------|
| **documentId** | UUID | Identificador único del documento | ✗ Nunca |
| **id** | Integer | Identificador de la versión (borrador/publicado) | ✓ Sí |

**Ejemplo:**
- Documento: `documentId = 550e8400-e29b-41d4-a716-446655440001`
- Borrador: `id = 1`
- Publicado: `id = 2`

Cuando actualizas un documento, el `documentId` permanece igual pero el `id` puede cambiar.

**Por eso el plugin usa `documentId`** para identificar qué registro actualizar.

## Errores Comunes

### Error: "Relation with document_id ... does not exist"

**Causa:** El `document_id` de la relación no existe en Strapi

**Solución:**
1. Verifica que el documento relacionado existe
2. Obtén el `document_id` correcto (ver Paso 1)
3. Reemplaza en el CSV
4. Reimporta

### Error: "Invalid UUID format"

**Causa:** El `document_id` no es un UUID válido

**Solución:**
- Los UUIDs tienen formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Ejemplo válido: `550e8400-e29b-41d4-a716-446655440001`
- Verifica que no hay espacios o caracteres extras

### Rows importadas pero relaciones vacías

**Causa:** El `{field}_document_id` está vacío

**Solución:**
- Asegúrate de que el header es `{field}_document_id` (no `{field}_id`)
- Rellena los valores con los document_ids correctos
- Reimporta

## Ciclo Completo: Export → Modify → Import

Esta es la forma más segura de trabajar:

### 1. Exportar Datos Existentes
```bash
Plugin → Export Data → Select Category → Download
# Obtendrás: categories.csv con document_ids correctos
```

### 2. Modificar el CSV
```
Abre en Excel, modifica los datos que quieras cambiar
```

### 3. Reimportar
```bash
Plugin → Import Data → Select Category → Upload csv → Import
# Los document_ids servirán para actualizar registros existentes
```

**Ventaja:** Los document_ids ya son correctos, no hay riesgo de UUIDs inválidos.

## Diferencias con versiones antiguas de Strapi

| Aspecto | Strapi 4 | Strapi 5 |
|---------|----------|---------|
| Identificador | `id` (integer) | `documentId` (UUID) |
| Actualizar por | `id` | `documentId` |
| CSV para actualizar | `id` | `document_id` |
| Relaciones | `{field}_id` | `{field}_document_id` |

## Resumen

✅ El plugin ahora soporta correctamente `document_id` (UUID)
✅ Export exporta `document_id` automáticamente
✅ Import puede actualizar por `document_id`
✅ Las relaciones usan `{field}_document_id`

Usa los CSVs proporcionados como plantilla, reemplaza los document_ids ficticios con los reales, e importa.
