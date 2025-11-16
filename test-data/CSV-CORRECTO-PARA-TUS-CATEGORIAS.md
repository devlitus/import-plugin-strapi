# CSV Correcto para Tus Categorías (Strapi 5 con document_id)

## Schema Real de Tu Category

```json
{
  "attributes": {
    "name": "string (required)",
    "description": "text (optional)",
    "slug": "uid (uid type, requerido - proporcionar en CSV)",
    "image": "media (required)",
    "visible": "boolean (default: true)",
    "seo_title": "string (optional)",
    "seo_description": "text (optional)",
    "subcategories": "oneToMany (mappedBy from subcategory)",
    "products": "manyToMany"
  }
}
```

## CSV Correcto: `categories-final.csv` (Con Soporte de Idiomas)

```csv
document_id,name,slug,description,image_id,visible,seo_title,seo_description,locale
,Bebé,bebe,Ropa y accesorios para bebés recién nacidos,1,true,Ropa Bebé Online,Tienda online de ropa y accesorios para bebés,es
,Baby,bebe,Baby clothing and accessories for newborns,1,true,Baby Clothes Online,Online store for baby clothing and accessories,en
,Bebé,bebe,Roba i accessoris per a bebès recién nascuts,1,true,Roba de Bebè Online,Botiga en línia de roba i accessoris per a bebès,ca
,Infantiles,infantiles,Ropa y accesorios para niños de 3 a 12 años,2,true,Ropa Infantil,Compra ropa infantil de calidad para niños,es
,Children,infantiles,Children clothing and accessories for kids 3 to 12 years,2,true,Children's Clothing,Buy quality children's clothing,en
,Infantils,infantiles,Roba i accessoris per a nens de 3 a 12 anys,2,true,Roba Infantil,Compra roba infantil de qualitat per a nens,ca
,Juveniles,juveniles,Ropa y accesorios para adolescentes,3,true,Ropa Adolescentes,Tienda de ropa juvenil para adolescentes,es
,Youth,juveniles,Clothing and accessories for teenagers,3,true,Youth Clothing,Youth fashion store for teenagers,en
,Juvenils,juveniles,Roba i accessoris per a adolescents,3,true,Roba Juvenil,Botiga de moda juvenil per a adolescents,ca
```

### Explicación de Cada Columna

| Columna | Tipo | Requerido | Ejemplo | Descripción |
|---------|------|-----------|---------|-------------|
| **document_id** | UUID | ✗ Opcional | *(dejar vacío)* | **VACÍO para CREAR nuevos registros**. Llena con UUID para ACTUALIZAR registros existentes. MISMO document_id para todas las localizaciones. |
| **name** | string | ✓ Sí | Bebé / Baby / Bebé | Nombre en el idioma especificado. DIFERENTE para cada idioma. |
| **slug** | uid | ✓ Sí | bebe, infantiles, juveniles | Identificador único tipo slug. MISMO para todas las localizaciones de la misma categoría. |
| **description** | text | ✗ No | Ropa para bebés | Descripción en el idioma especificado |
| **image_id** | media | ✓ Sí | 1 | ID de archivo media (MISMO para todos idiomas) |
| **visible** | boolean | ✓ Sí | true | true = visible, false = oculto |
| **seo_title** | string | ✗ No | Ropa Bebé | Título SEO en el idioma especificado |
| **seo_description** | text | ✗ No | Tienda online... | Descripción SEO en el idioma especificado |
| **locale** | string | - | es, en, ca | Idioma/localización: `es` (español), `en` (inglés), `ca` (catalán) |

### ¿Qué es document_id?

**document_id** es el identificador único (UUID) de un documento en Strapi 5. Es diferente al `id` numérico.

- **Para CREAR nuevas categorías**: Dejar **VACÍO** (ningún valor)
- **Para ACTUALIZAR categorías existentes**: Llenar con el UUID real del documento

**Ejemplo:**
```csv
document_id,name,slug
,Bebé,bebe                                           ← Crear nueva
550e8400-e29b-41d4-a716-446655440001,Bebé Updated,bebe   ← Actualizar existente
```

### Campos que NO van en el CSV

- **subcategories**: Es una relación oneToMany inversa. Las subcategorías apuntan a la categoría. NO incluir aquí
- **products**: Relación manyToMany. Si necesitas asignar productos, hazlo desde el lado de Product. NO incluir aquí

## Soporte de Idiomas/Localizaciones

El plugin soporta la columna **`locale`** para importar en diferentes idiomas.

### Cómo Funciona

**Sin locale (Por defecto):**
```csv
document_id,name,slug,description,image_id,...
,Bebé,bebe,Ropa para bebés,1,...
```
→ Se crea en el idioma por defecto de tu Strapi

**Con locale (Múltiples idiomas):**
```csv
document_id,name,slug,description,image_id,...,locale
,Bebé,bebe,Ropa para bebés,1,...,es
,Baby,bebe,Baby clothing,1,...,en
,Bebé,bebe,Roba per a bebès,1,...,ca
```
→ Se crea el MISMO documento (sin document_id) en 3 idiomas con el MISMO slug

### Ejemplo Completo

Tienes 3 categorías × 3 idiomas = 9 filas en el CSV:

```csv
document_id,name,slug,description,image_id,visible,seo_title,seo_description,locale
,Bebé,bebe,Ropa para bebés,1,true,Ropa Bebé,Tienda de ropa para bebés,es
,Baby,bebe,Baby clothing,1,true,Baby Clothes,Baby clothing store,en
,Bebé,bebe,Roba per a bebès,1,true,Roba de Bebè,Botiga de roba per a bebès,ca
,Infantiles,infantiles,Ropa para niños,2,true,Ropa Infantil,Tienda de ropa para niños,es
,Children,infantiles,Children clothing,2,true,Children Clothes,Children clothing store,en
,Infantils,infantiles,Roba per a nens,2,true,Roba Infantil,Botiga de roba per a nens,ca
```

**Resultado en Strapi:**
- 2 documentos (Bebé, Infantiles)
- Cada uno con 3 localizaciones (es, en, ca)
- MISMO slug para cada documento en todos los idiomas

### Identificar Documentos Cuando Hay Localizaciones

**Sin `document_id`:**
- Primera fila de cada grupo → CREA nuevo documento
- Siguientes filas del mismo grupo (mismo slug) → agregan LOCALIZACIONES

**Con `document_id`:**
- Las filas con el mismo `document_id` → actualizan/agregan localizaciones al documento existente

**Ejemplo con actualización:**
```csv
document_id,name,slug,description,image_id,...,locale
550e8400-...,Bebé Updated,bebe,Ropa para bebés,1,...,es
550e8400-...,Baby Updated,bebe,Baby clothing,1,...,en
550e8400-...,Bebé Updated,bebe,Roba per a bebès,1,...,ca
```
→ Actualiza el documento con ese UUID en 3 idiomas

## CSV Correcto: `subcategories-final.csv`

```csv
document_id,name,slug,description,image_id,visible,seo_title,seo_description,category_document_id
550e8400-e29b-41d4-a716-446655440011,Ropa Bebé,ropa-bebe,Prendas para bebés,1,true,Ropa Bebé,Ropa segura,550e8400-e29b-41d4-a716-446655440001
550e8400-e29b-41d4-a716-446655440012,Accesorios,accesorios-bebe,Accesorios bebé,2,true,Accesorios,Productos útiles,550e8400-e29b-41d4-a716-446655440001
```

### Explicación

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| **document_id** | UUID | Opcional | ID único de la subcategoría |
| **name** | string | ✓ Sí | Nombre de subcategoría |
| **slug** | uid | ✓ Sí | Slug único para la subcategoría |
| **description** | text | ✗ No | Descripción |
| **image_id** | media | ✓ Sí | ID de imagen |
| **visible** | boolean | ✓ Sí | Visibilidad |
| **seo_title** | string | ✗ No | Título SEO |
| **seo_description** | text | ✗ No | Descripción SEO |
| **category_document_id** | relation | ✓ Sí | UUID de la categoría padre |

## Pasos Correctos

### 1. Obtener image_id

Los image_id en los CSV (1, 2, 3) son ficticios. Necesitas reemplazarlos:

1. Sube imágenes a Strapi Media Library
2. Copia los IDs asignados por Strapi
3. Reemplaza en el CSV

**Ejemplo:**
```csv
# Antes (ficticio):
Bebé,bebe,Ropa para bebés,1,true,...

# Después (real):
Bebé,bebe,Ropa para bebés,42,true,...
```

### 2. Obtener document_ids Reales

Los document_ids en los CSV son ficticios (para subcategorías). Tienes dos opciones:

**Opción A: Dejar vacío (crear nuevos)**
```csv
,Bebé,bebe,Ropa para bebés,1,true,...
```
El plugin crea nuevos registros automáticamente.

**Opción B: Usar document_ids existentes (actualizar)**
```csv
550e8400-e29b-41d4-a716-446655440001,Bebé,bebe,Ropa para bebés,1,true,...
```

Para obtener document_ids existentes:
- Export desde el plugin → CSV tendrá document_ids correctos
- O consulta la API: `GET http://localhost:1337/api/categories`

### 3. Importar Orden Correcto

⚠️ **IMPORTANTE**: Importa en este orden:
1. **Categories** primero (las principales)
2. **Subcategories** después (necesitan category_document_id)

### 4. Importar

```
Plugin → Import Data → Category → Upload categories-final.csv → Import
Plugin → Import Data → Subcategory → Upload subcategories-final.csv → Import
```

## Errores Comunes

### Error: "Field 'image_id' is required but empty"
**Causa:** image_id está vacío
**Solución:** Reemplaza los IDs ficticios con los reales de tu Strapi

### Error: "Relation 'category' with document_id ... does not exist"
**Causa:** El category_document_id no existe
**Solución:**
1. Primero importa categorías
2. Obtén los document_ids correctos
3. Luego importa subcategorías con los UUIDs correctos

### Error: "Field 'slug' must be unique - value X already exists"
**Causa:** Ya existe un slug con ese valor
**Solución:** Usa un slug diferente para cada categoría

### Error: "Invalid UUID format"
**Causa:** El document_id no es un UUID válido
**Solución:** Usa formato correcto: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Resumen

✅ **Estructura CSV:**
```
document_id (vacío para crear, UUID para actualizar)
name (obligatorio, diferente por idioma)
slug (obligatorio, MISMO para todas las localizaciones)
description, image_id, visible, seo_title, seo_description
locale (es, en, ca)
```

✅ **Document ID:**
- Vacío = crear nuevo documento
- Con UUID = actualizar documento existente
- Mismo para todas las localizaciones

✅ **Slug:**
- Obligatorio en CSV
- Mismo para todas las localizaciones de una categoría
- Diferente para cada categoría

✅ **image_id:** Reemplaza ficticios (1, 2, 3) con IDs reales de tu Strapi

✅ **Orden de importación:** Categories → Subcategories
