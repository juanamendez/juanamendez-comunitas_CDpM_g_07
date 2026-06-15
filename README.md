# COMUNITAS

Aplicación web para conectar personas en situación de vulnerabilidad con organizaciones de ayuda social en Buenos Aires.

## Tecnologías

- **Frontend:** HTML, CSS, JavaScript (SPA)
- **Backend / Contenedor:** Python + Streamlit
- **Base de datos:** Supabase (PostgreSQL)
- **Mapas:** Leaflet + OpenStreetMap

## Cómo correr el proyecto localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/comunitas.git
cd comunitas
```

### 2. Crear y activar el entorno virtual

```bash
python -m venv venv
```

En **Windows (PowerShell):**
```powershell
.\venv\Scripts\streamlit run app.py
```

> Si da error de permisos al activar, usá directamente el ejecutable de la carpeta venv:
> `.\venv\Scripts\streamlit run app.py`

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar las credenciales de Supabase

Crear el archivo `.streamlit/secrets.toml` con el siguiente contenido (pedirle las claves a Juana):

```toml
SUPABASE_URL = "https://TU_PROYECTO.supabase.co"
SUPABASE_KEY = "TU_CLAVE_ANONIMA"
```

> ⚠️ Este archivo **no está en el repositorio** por seguridad. Hay que crearlo manualmente.

### 5. Ejecutar la aplicación

```powershell
.\venv\Scripts\streamlit run app.py
```

La app se abre automáticamente en `http://localhost:8501`

## Estructura del proyecto

```
comunitas/
├── index.html          ← Estructura principal de la SPA
├── style.css           ← Estilos del prototipo
├── app.js              ← Lógica y navegación de la app
├── app.py              ← Contenedor Streamlit + conexión Supabase
├── requirements.txt    ← Dependencias de Python
├── assets/             ← Imágenes, logos e íconos
└── .streamlit/
    └── secrets.toml    ← Credenciales (NO incluido en el repo)
```
