#!/bin/bash

# Script para generar el Base64 del keystore para GitHub Secrets
# Uso: ./scripts/generate-keystore-base64.sh

KEYSTORE_PATH="android/app/cert/cert.jks"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: No se encontró el archivo $KEYSTORE_PATH"
    echo "Por favor, asegúrate de que el keystore existe en esa ubicación."
    exit 1
fi

echo "🔐 Generando Base64 del keystore..."
echo ""
echo "Copia el siguiente texto y pégalo en el secret KEYSTORE_BASE64 de GitHub:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    base64 -i "$KEYSTORE_PATH"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    base64 -w 0 "$KEYSTORE_PATH"
else
    # Windows (Git Bash)
    base64 -w 0 "$KEYSTORE_PATH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Base64 generado correctamente"
echo ""
echo "📝 Pasos siguientes:"
echo "1. Ve a tu repositorio en GitHub"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Crea un nuevo secret llamado 'KEYSTORE_BASE64'"
echo "4. Pega el texto generado arriba"
echo "5. Guarda el secret"

