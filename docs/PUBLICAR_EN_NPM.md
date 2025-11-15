# Guía: Publicar el Plugin en npm

Esta guía explica paso a paso cómo publicar el plugin `import-plugin` en el registro de npm.

## 1. Preparación Previa

### 1.1 Crear cuenta en npm

1. Ve a https://www.npmjs.com/signup
2. Crea una cuenta con tu email
3. Verifica tu email
4. Guarda tu nombre de usuario (lo necesitarás después)

### 1.2 Configurar autenticación local

Abre tu terminal y ejecuta:

```bash
npm login
```

Te pedirá:
- **Username**: Tu nombre de usuario de npm
- **Password**: Tu contraseña de npm
- **Email**: Tu email registrado

Después de esto, npm guardará tus credenciales localmente.

### 1.3 Habilitar autenticación de dos factores (recomendado)

1. Inicia sesión en https://www.npmjs.com
2. Ve a tu perfil → **Auth Tokens**
3. Habilita 2FA (Two-Factor Authentication)

## 2. Actualizar package.json

Antes de publicar, asegúrate de que `package.json` tenga:

```json
{
  "name": "@tuusuario/import-plugin",
  "version": "1.0.0",
  "description": "A Strapi 5.x plugin for data import/export functionality",
  "main": "dist/server/index.js",
  "license": "MIT",
  "author": "Tu Nombre <tu@email.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/tusuario/import-plugin.git"
  },
  "keywords": [
    "strapi",
    "plugin",
    "import",
    "export",
    "data"
  ],
  "homepage": "https://github.com/tusuario/import-plugin#readme",
  "bugs": {
    "url": "https://github.com/tusuario/import-plugin/issues"
  },
  "files": [
    "dist"
  ],
  "exports": {
    "./package.json": "./package.json",
    "./strapi-admin": {
      "types": "./dist/admin/src/index.d.ts",
      "import": "./dist/admin/index.mjs",
      "require": "./dist/admin/index.js"
    },
    "./strapi-server": {
      "types": "./dist/server/src/index.d.ts",
      "import": "./dist/server/index.mjs",
      "require": "./dist/server/index.js"
    }
  },
  "strapi": {
    "kind": "plugin",
    "name": "import-plugin",
    "displayName": "Import/Export",
    "description": "A Strapi plugin for data import/export functionality"
  }
}
```

**Cambios importantes:**
- Reemplaza `@tuusuario` con tu nombre de usuario de npm (usa el scope)
- Actualiza `version` a `1.0.0` para la primera publicación
- Agrega `homepage`, `bugs`, `repository`
- Agrega `keywords` relevantes

## 3. Crear archivo .npmignore

Crea un archivo `.npmignore` en la raíz del proyecto para excluir archivos innecesarios:

```
# Desarrollo
admin/
server/
.github/
.claude/

# Configuración
*.config.js
tsconfig.json
prettier.config.js

# Dependencias
node_modules/
package-lock.json
yarn.lock

# Archivos de sistema
.DS_Store
.env
.env.local

# Otros
README.md
PUBLICAR_EN_NPM.md
.gitignore
```

## 4. Preparar el build

Asegúrate de que el plugin está listo para publicar:

```bash
# Instalar dependencias
npm install

# Verificar que TypeScript compila sin errores
npm run test:ts:front
npm run test:ts:back

# Construir el plugin
npm run build

# Verificar la estructura (opcional pero recomendado)
npm run verify
```

Después de `npm run build`, deberías tener una carpeta `dist/` con:
- `dist/admin/` (código de admin compilado)
- `dist/server/` (código de servidor compilado)

## 5. Verificar el contenido del paquete

Antes de publicar, previsualizá qué se incluirá:

```bash
npm pack
```

Esto crea un archivo `.tgz` que simula el paquete publicado. Puedes abrirlo para verificar:
- Que incluye la carpeta `dist/`
- Que no incluye archivos sensibles
- Que el `package.json` es correcto

Después de verificar, puedes eliminar el archivo `.tgz`:

```bash
rm import-plugin-1.0.0.tgz
```

## 6. Publicar el paquete

**Para un paquete con scope (recomendado para plugins):**

```bash
npm publish --access public
```

La opción `--access public` es necesaria para paquetes con scope (`@username/nombre`), ya que por defecto son privados.

**Espera a que el comando se complete.** Verás algo como:

```
+ @tuusuario/import-plugin@1.0.0
```

## 7. Verificar la publicación

1. **En npm:**
   - Ve a https://www.npmjs.com/package/@tuusuario/import-plugin
   - Verifica que el paquete aparece correctamente
   - Comprueba que la descripción y keywords están visibles

2. **Instalación de prueba:**
   ```bash
   npm install @tuusuario/import-plugin
   ```

## 8. Publicar actualizaciones futuras

Para publicar nuevas versiones:

1. Actualiza el código
2. Incrementa la versión en `package.json` usando:
   ```bash
   npm version patch    # Para cambios menores (1.0.0 → 1.0.1)
   npm version minor    # Para nuevas características (1.0.0 → 1.1.0)
   npm version major    # Para cambios importantes (1.0.0 → 2.0.0)
   ```

3. Construye:
   ```bash
   npm run build
   ```

4. Publica:
   ```bash
   npm publish
   ```

## 9. Información importante sobre versionado

- **No puedes reutilizar una versión**: Si publicas `1.0.0`, no puedes publicar `1.0.0` de nuevo
- **Semantic Versioning**:
  - `MAJOR.MINOR.PATCH` (ej: 1.2.3)
  - MAJOR: cambios que rompen compatibilidad
  - MINOR: nuevas características
  - PATCH: correcciones de bugs

## 10. Solución de problemas

### Error: "You do not have permission to publish"
- Verifica que hayas ejecutado `npm login`
- Comprueba que tu cuenta de npm existe
- Asegúrate de que el nombre en `package.json` no está tomado

### Error: "Package name too similar to existing packages"
- Usa un nombre más único o agrega un scope (`@username/nombre`)

### Error: "You must enable two-factor authentication"
- Habilita 2FA en tu cuenta de npm
- Genera un token de acceso si es necesario

### El paquete se publicó pero no aparece inmediatamente
- npm.js tarda unos segundos en indexar
- Recarga la página del paquete después de unos segundos

## 11. Checklist antes de publicar

- [ ] `package.json` actualizado con nombre, descripción, autor
- [ ] Versión configurada a `1.0.0` (primera publicación)
- [ ] `npm run build` ejecutado correctamente
- [ ] `npm run test:ts:front` sin errores
- [ ] `npm run test:ts:back` sin errores
- [ ] Carpeta `dist/` existe y contiene los archivos compilados
- [ ] Archivo `.npmignore` creado (opcional pero recomendado)
- [ ] `npm login` ejecutado y credenciales configuradas
- [ ] `npm pack` verifica que el contenido es correcto
- [ ] README.md está presente en la raíz

## 12. Después de publicar

Una vez publicado, puedes:

1. **Documentar el uso:** Crea un README detallado con ejemplos de instalación y uso
2. **Publicar en GitHub:** Sube el código a un repositorio público
3. **Agregar CI/CD:** Configura publicación automática en npm con GitHub Actions
4. **Mantener:** Publica actualizaciones cuando fixes bugs o agregues features

---

**Última actualización:** Noviembre 2025
