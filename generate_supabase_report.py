import os
import json
import toml
from supabase import create_client

secrets_path = 'c:/Users/juana/OneDrive/Documentos/Austral/3.1 CDpM/comunitas/.streamlit/secrets.toml'
secrets = toml.load(secrets_path)
url = secrets.get('SUPABASE_URL', '')
key = secrets.get('SUPABASE_KEY', '')

supabase = create_client(url, key)
report_path = 'c:/Users/juana/OneDrive/Documentos/Austral/3.1 CDpM/comunitas/supabase_backend_report.md'

tables_list = [
    "users", "organizations", "service_types", "services", 
    "organization_members", "organization_needs", "organization_photos", 
    "reviews", "tags", "review_tag_assignments", "favorites", 
    "suggested_organizations", "suggested_organization_services"
]

views_list = [
    "view_map_organizations",
    "view_services_full",
    "view_reviews_full",
    "view_favorites_full"
]

def mask_data(row):
    for k, val in row.items():
        if 'password' in k or 'hash' in k:
            row[k] = '***MASKED***'
        elif 'key' in k and isinstance(val, str) and len(val) > 10:
            row[k] = val[:4] + '***'
    return row

with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# Reporte Técnico Backend - COMUNITAS (Supabase)\n\n")

    f.write("## 1. Tablas existentes\n\n")
    f.write("*(Los tipos de datos y columnas son inferidos a partir de los datos accesibles mediante la clave pública anónima. La metadata estricta (PK, FK, DEFAULT, NULL) requiere acceso de administrador / RLS.)*\n\n")
    
    table_counts = {}
    for t in tables_list:
        f.write(f"### Tabla: `{t}`\n")
        try:
            # Try to get columns by fetching 1 row
            res = supabase.table(t).select('*').limit(1).execute()
            data = res.data
            if data:
                f.write("| Columna | Tipo Inferido |\n|---|---|\n")
                for col, val in data[0].items():
                    val_type = type(val).__name__ if val is not None else "unknown (NULL)"
                    f.write(f"| {col} | {val_type} |\n")
            else:
                f.write("> No hay registros accesibles para inferir las columnas.\n\n")
            
            # Try to get count
            count_res = supabase.table(t).select('*', count='exact').limit(0).execute()
            table_counts[t] = count_res.count if count_res.count is not None else 0
        except Exception as e:
            f.write(f"> Error al acceder (probablemente bloqueado por RLS): {e}\n\n")
            table_counts[t] = "Bloqueado por RLS"
        f.write("\n")

    f.write("## 2. Vistas existentes\n\n")
    for v in views_list:
        f.write(f"### Vista: `{v}`\n")
        try:
            res = supabase.table(v).select('*').limit(3).execute()
            data = res.data
            
            # Try count
            count_res = supabase.table(v).select('*', count='exact').limit(0).execute()
            v_count = count_res.count if count_res.count is not None else 0
            
            f.write(f"**Cantidad de registros:** {v_count}\n\n")
            
            if data:
                f.write("| Columna | Tipo Inferido |\n|---|---|\n")
                for col, val in data[0].items():
                    val_type = type(val).__name__ if val is not None else "unknown (NULL)"
                    f.write(f"| {col} | {val_type} |\n")
                
                f.write("\n**Primeros 3 registros de ejemplo:**\n")
                f.write("```json\n")
                masked_data = [mask_data(row) for row in data]
                f.write(json.dumps(masked_data, indent=2, ensure_ascii=False))
                f.write("\n```\n\n")
            else:
                f.write("> No hay registros accesibles.\n\n")
        except Exception as e:
            f.write(f"> Error al acceder: {e}\n\n")
            
    f.write("## 3. Funciones RPC existentes\n\n")
    f.write("*(Las firmas exactas de las funciones se infieren según la documentación de diseño del proyecto, ya que la metadata de pg_proc no es pública mediante la REST API)*\n\n")
    
    rpcs = [
        ("add_favorite", ["user_id", "organization_id"], "void", "Agregar un favorito de un usuario."),
        ("remove_favorite", ["user_id", "organization_id"], "void", "Quitar un favorito."),
        ("add_review", ["user_id", "organization_id", "rating", "comment"], "void", "Añadir una reseña y calificación."),
        ("suggest_organization", ["name", "description", "latitude", "longitude", "address"], "uuid", "Sugerir una nueva organización desde la app."),
        ("approve_suggestion", ["suggestion_id"], "void", "Aprobar una sugerencia (solo admin)."),
        ("reject_suggestion", ["suggestion_id", "reason"], "void", "Rechazar una sugerencia (solo admin).")
    ]
    for rpc_name, params, ret, prop in rpcs:
        f.write(f"### Función: `{rpc_name}`\n")
        f.write(f"- **Parámetros:** {', '.join(params) if params else 'Ninguno'}\n")
        f.write(f"- **Tipo de retorno:** `{ret}`\n")
        f.write(f"- **Propósito:** {prop}\n")
        if params:
            f.write(f"- **Ejemplo de uso:** `supabase.rpc('{rpc_name}', {{'{params[0]}': '...'}}).execute()`\n\n")

    f.write("## 4. Conteo de registros (Tablas)\n\n")
    f.write("| Tabla | Registros Totales |\n|---|---|\n")
    for t, count in table_counts.items():
        f.write(f"| {t} | {count} |\n")

    f.write("\n## 5. Datos de ejemplo\n\n*(Ver sección 2 'Vistas existentes' donde se incluyen los 3 registros de ejemplo de las vistas principales solicitadas)*\n\n")

    f.write("""## 6. Recomendación de integración

### Lectura (Frontend -> Supabase)
Para optimizar consultas y no exponer lógica de JOINs en el frontend, se recomienda consultar estas vistas:
- **Home:** `view_map_organizations` (o similar con límite).
- **Servicios:** `view_services_full` (agrupa la info del servicio con la organización).
- **Mapa:** `view_map_organizations` (devuelve latitud, longitud y estado consolidado).
- **Detalle de organización:** Una vista específica (ej. `view_organizations_with_rating`) combinada con un filtro sobre `view_services_full` usando el ID de la organización.
- **Favoritos:** `view_favorites_full` (requiere filtrar por usuario logueado).
- **Reseñas:** `view_reviews_full` (trae detalles de la reseña y nombre/avatar del usuario si es público).
- **Sugerencias:** Tabla `suggested_organizations` (generalmente su lectura está bloqueada excepto para admins).

### Escritura (Frontend -> Supabase RPC)
Para operaciones de mutación, se recomiendan funciones RPC (Remote Procedure Calls) debido a que pueden encapsular validaciones lógicas complejas y eludir restricciones RLS a nivel tabla si están configuradas como `SECURITY DEFINER`:
- **agregar favorito:** `rpc('add_favorite', {...})`
- **quitar favorito:** `rpc('remove_favorite', {...})`
- **agregar reseña:** `rpc('add_review', {...})`
- **sugerir organización:** `rpc('suggest_organization', {...})` (para que inserte también los servicios sugeridos en una transacción).
- **aprobar sugerencia:** `rpc('approve_suggestion', {suggestion_id: ...})`
- **rechazar sugerencia:** `rpc('reject_suggestion', {suggestion_id: ...})`
- **agregar necesidad:** Se recomienda un RPC o un INSERT directo sobre `organization_needs` si el usuario tiene rol de propietario.
- **agregar foto:** INSERT en `organization_photos` tras subir la imagen al Storage.
""")
