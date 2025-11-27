# GitHub Actions Workflows

## Workflow: Build and Deploy to Play Store

Este workflow compila la aplicación Android y la sube automáticamente a Google Play Store para pruebas internas.

### Configuración Requerida

Para que el workflow funcione correctamente, necesitas configurar los siguientes secrets en GitHub:

#### 1. Secrets de Firma (Keystore)

- **`KEYSTORE_BASE64`**: El archivo `cert.jks` codificado en Base64

  ```bash
  # Para generar este secret, ejecuta:
  base64 -i android/app/cert/cert.jks | pbcopy
  # Luego pega el resultado en el secret KEYSTORE_BASE64
  ```

- **`RELEASE_KEY_ALIAS`**: El alias de la clave de firma (actualmente: `com.sphereag`)
- **`RELEASE_STORE_PASSWORD`**: Contraseña del keystore
- **`RELEASE_KEY_PASSWORD`**: Contraseña de la clave de firma

#### 2. Google Play Console API

- **`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`**: JSON completo de la cuenta de servicio de Google Play Console

  ⚠️ **Importante**: Solo los usuarios con rol de **Propietario** en Google Play Console pueden acceder a esta configuración.
  
  Para obtener este archivo:
  
  1. Ve a [Google Play Console](https://play.google.com/console)
  2. Selecciona tu aplicación
  3. En el menú lateral izquierdo, ve a **Configuración** (Settings) → **Acceso a la API** (API access)
     - Si no ves esta opción, probablemente no tienes permisos de Propietario
     - Contacta al propietario de la cuenta de desarrollador para que te otorgue acceso o realice la configuración
  4. Haz clic en **Crear cuenta de servicio nueva** o usa una existente
  5. Esto te redirigirá a Google Cloud Console para crear la cuenta de servicio
  6. Una vez creada, vuelve a Play Console y asigna el rol **Administrador** a la cuenta de servicio
  7. En Google Cloud Console, ve a **IAM y administración** → **Cuentas de servicio**
  8. Encuentra la cuenta creada y haz clic en ella
  9. Ve a la pestaña **Claves** → **Agregar clave** → **Crear nueva clave** → Selecciona **JSON**
  10. Descarga el archivo JSON
  11. Copia **todo el contenido** del archivo JSON y pégalo en el secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` de GitHub
  
  **Alternativa si no encuentras "Acceso a la API"**:
  
  - Verifica que tengas rol de **Propietario** en la cuenta de desarrollador
  - La opción puede estar en: **Configuración** → **Configuración de la cuenta** → **Acceso a la API**
  - O directamente en: **Configuración de la cuenta** → **Acceso a la API**

### Cómo Usar

#### Ejecución Automática

El workflow se ejecuta automáticamente cuando:

- Se hace push a las ramas `main` o `develop`
- Se ignoran cambios en archivos `.md` y en la carpeta `docs/`

#### Ejecución Manual

1. Ve a la pestaña "Actions" en GitHub
2. Selecciona "Build and Deploy to Play Store (Internal Testing)"
3. Haz clic en "Run workflow"
4. Selecciona la rama y el track (internal, alpha, beta, production)
5. Haz clic en "Run workflow"

### Tracks Disponibles

- **internal**: Pruebas internas (por defecto)
- **alpha**: Canal alpha
- **beta**: Canal beta
- **production**: Producción (usar con precaución)

### Notas Importantes

⚠️ **Seguridad**:

- Nunca subas el archivo `cert.jks` directamente al repositorio
- Usa siempre GitHub Secrets para credenciales sensibles
- Considera rotar las credenciales periódicamente

📝 **Release Notes**:

- Puedes agregar notas de versión creando archivos en `android/release-notes/`
- El formato debe ser: `default.txt` o archivos específicos por idioma (ej: `es-ES.txt`, `en-US.txt`)

🔍 **Debugging**:

- Si el workflow falla, revisa los logs en la pestaña "Actions"
- El AAB se guarda como artifact por 7 días para descarga manual si es necesario
