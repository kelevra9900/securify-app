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

  Para obtener este archivo:
  1. Ve a [Google Play Console](https://play.google.com/console)
  2. Configuración → Acceso a la API
  3. Crea una cuenta de servicio o usa una existente
  4. Descarga el archivo JSON de la cuenta de servicio
  5. Copia todo el contenido del JSON y pégalo en el secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

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

