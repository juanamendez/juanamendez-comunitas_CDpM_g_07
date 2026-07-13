# Reporte Técnico Backend - COMUNITAS (Supabase)

## 1. Tablas existentes

*(Los tipos de datos y columnas son inferidos a partir de los datos accesibles mediante la clave pública anónima. La metadata estricta (PK, FK, DEFAULT, NULL) requiere acceso de administrador / RLS.)*

### Tabla: `users`
> No hay registros accesibles para inferir las columnas.


### Tabla: `organizations`
> No hay registros accesibles para inferir las columnas.


### Tabla: `service_types`
> No hay registros accesibles para inferir las columnas.


### Tabla: `services`
> No hay registros accesibles para inferir las columnas.


### Tabla: `organization_members`
> No hay registros accesibles para inferir las columnas.


### Tabla: `organization_needs`
> No hay registros accesibles para inferir las columnas.


### Tabla: `organization_photos`
> No hay registros accesibles para inferir las columnas.


### Tabla: `reviews`
> No hay registros accesibles para inferir las columnas.


### Tabla: `tags`
> No hay registros accesibles para inferir las columnas.


### Tabla: `review_tag_assignments`
> No hay registros accesibles para inferir las columnas.


### Tabla: `favorites`
> No hay registros accesibles para inferir las columnas.


### Tabla: `suggested_organizations`
> No hay registros accesibles para inferir las columnas.


### Tabla: `suggested_organization_services`
> No hay registros accesibles para inferir las columnas.


## 2. Vistas existentes

### Vista: `view_map_organizations`
**Cantidad de registros:** 15

| Columna | Tipo Inferido |
|---|---|
| org_id | int |
| name | str |
| description | str |
| address | str |
| latitude | float |
| longitude | float |
| status | str |
| service_types | str |
| average_rating | float |
| total_reviews | int |

**Primeros 3 registros de ejemplo:**
```json
[
  {
    "org_id": 1,
    "name": "Comedor Esperanza Actualizado",
    "description": "Descripción actualizada para prueba.",
    "address": "Av. San Martín 1234, Pilar",
    "latitude": -34.4581,
    "longitude": -58.9142,
    "status": "active",
    "service_types": "Apoyo escolar, Comida, Ropa",
    "average_rating": 5.0,
    "total_reviews": 2
  },
  {
    "org_id": 2,
    "name": "Casa San José",
    "description": "Espacio de acompañamiento integral con duchas, ropa y alojamiento transitorio.",
    "address": "Belgrano 850, Pilar",
    "latitude": -34.4623,
    "longitude": -58.9087,
    "status": "active",
    "service_types": "Alojamiento, Duchas",
    "average_rating": 3.5,
    "total_reviews": 2
  },
  {
    "org_id": 3,
    "name": "Centro Comunitario Norte",
    "description": "Centro barrial con apoyo escolar, talleres y actividades para niños y adolescentes.",
    "address": "Las Heras 2200, Pilar",
    "latitude": -34.4556,
    "longitude": -58.9215,
    "status": "active",
    "service_types": "Apoyo escolar",
    "average_rating": 4.5,
    "total_reviews": 2
  }
]
```

### Vista: `view_services_full`
**Cantidad de registros:** 26

| Columna | Tipo Inferido |
|---|---|
| serv_id | int |
| org_id | int |
| organization_name | str |
| address | str |
| latitude | float |
| longitude | float |
| organization_status | str |
| type_id | int |
| service_type | str |
| title | str |
| description | str |
| schedule | str |
| service_status | str |
| created_at | str |

**Primeros 3 registros de ejemplo:**
```json
[
  {
    "serv_id": 1,
    "org_id": 1,
    "organization_name": "Comedor Esperanza Actualizado",
    "address": "Av. San Martín 1234, Pilar",
    "latitude": -34.4581,
    "longitude": -58.9142,
    "organization_status": "active",
    "type_id": 1,
    "service_type": "Comida",
    "title": "Almuerzo comunitario",
    "description": "Entrega de almuerzos calientes para personas y familias.",
    "schedule": "Lunes a viernes de 12:00 a 14:00",
    "service_status": "active",
    "created_at": "2026-06-10T02:29:18.15561"
  },
  {
    "serv_id": 2,
    "org_id": 1,
    "organization_name": "Comedor Esperanza Actualizado",
    "address": "Av. San Martín 1234, Pilar",
    "latitude": -34.4581,
    "longitude": -58.9142,
    "organization_status": "active",
    "type_id": 5,
    "service_type": "Ropa",
    "title": "Entrega de ropa",
    "description": "Entrega de ropa usada en buen estado según disponibilidad.",
    "schedule": "Miércoles de 10:00 a 12:00",
    "service_status": "active",
    "created_at": "2026-06-10T02:29:18.15561"
  },
  {
    "serv_id": 3,
    "org_id": 2,
    "organization_name": "Casa San José",
    "address": "Belgrano 850, Pilar",
    "latitude": -34.4623,
    "longitude": -58.9087,
    "organization_status": "active",
    "type_id": 2,
    "service_type": "Duchas",
    "title": "Duchas comunitarias",
    "description": "Espacio para higiene personal con turnos por orden de llegada.",
    "schedule": "Lunes, miércoles y viernes de 9:00 a 12:00",
    "service_status": "active",
    "created_at": "2026-06-10T02:29:18.15561"
  }
]
```

### Vista: `view_reviews_full`
**Cantidad de registros:** 16

| Columna | Tipo Inferido |
|---|---|
| rev_id | int |
| user_id | int |
| full_name | str |
| org_id | int |
| organization_name | str |
| rating | int |
| created_at | str |
| is_reported | bool |
| tags | str |

**Primeros 3 registros de ejemplo:**
```json
[
  {
    "rev_id": 1,
    "user_id": 1,
    "full_name": "Juan Pérez",
    "org_id": 1,
    "organization_name": "Comedor Esperanza Actualizado",
    "rating": 5,
    "created_at": "2026-06-10T02:31:15.378166",
    "is_reported": false,
    "tags": "Buen trato, Comida abundante, Personal amable"
  },
  {
    "rev_id": 2,
    "user_id": 1,
    "full_name": "Juan Pérez",
    "org_id": 2,
    "organization_name": "Casa San José",
    "rating": 4,
    "created_at": "2026-06-10T02:31:15.378166",
    "is_reported": false,
    "tags": "Ambiente seguro, Fácil acceso"
  },
  {
    "rev_id": 3,
    "user_id": 2,
    "full_name": "Ana López",
    "org_id": 1,
    "organization_name": "Comedor Esperanza Actualizado",
    "rating": 5,
    "created_at": "2026-06-10T02:31:15.378166",
    "is_reported": false,
    "tags": "Buen trato, Horarios cumplidos"
  }
]
```

### Vista: `view_favorites_full`
**Cantidad de registros:** 9

| Columna | Tipo Inferido |
|---|---|
| favorite_id | int |
| user_id | int |
| full_name | str |
| org_id | int |
| organization_name | str |
| description | str |
| address | str |
| latitude | float |
| longitude | float |
| created_at | str |

**Primeros 3 registros de ejemplo:**
```json
[
  {
    "favorite_id": 1,
    "user_id": 1,
    "full_name": "Juan Pérez",
    "org_id": 1,
    "organization_name": "Comedor Esperanza Actualizado",
    "description": "Descripción actualizada para prueba.",
    "address": "Av. San Martín 1234, Pilar",
    "latitude": -34.4581,
    "longitude": -58.9142,
    "created_at": "2026-06-10T02:31:15.378166"
  },
  {
    "favorite_id": 2,
    "user_id": 1,
    "full_name": "Juan Pérez",
    "org_id": 2,
    "organization_name": "Casa San José",
    "description": "Espacio de acompañamiento integral con duchas, ropa y alojamiento transitorio.",
    "address": "Belgrano 850, Pilar",
    "latitude": -34.4623,
    "longitude": -58.9087,
    "created_at": "2026-06-10T02:31:15.378166"
  },
  {
    "favorite_id": 7,
    "user_id": 1,
    "full_name": "Juan Pérez",
    "org_id": 9,
    "organization_name": "Comedor Manos Abiertas",
    "description": "Comedor barrial que entrega almuerzos y meriendas.",
    "address": "Chile 1200, Pilar",
    "latitude": -34.4598,
    "longitude": -58.9165,
    "created_at": "2026-06-10T04:25:16.232515"
  }
]
```

## 3. Funciones RPC existentes

*(Las firmas exactas de las funciones se infieren según la documentación de diseño del proyecto, ya que la metadata de pg_proc no es pública mediante la REST API)*

### Función: `add_favorite`
- **Parámetros:** user_id, organization_id
- **Tipo de retorno:** `void`
- **Propósito:** Agregar un favorito de un usuario.
- **Ejemplo de uso:** `supabase.rpc('add_favorite', {'user_id': '...'}).execute()`

### Función: `remove_favorite`
- **Parámetros:** user_id, organization_id
- **Tipo de retorno:** `void`
- **Propósito:** Quitar un favorito.
- **Ejemplo de uso:** `supabase.rpc('remove_favorite', {'user_id': '...'}).execute()`

### Función: `add_review`
- **Parámetros:** user_id, organization_id, rating, comment
- **Tipo de retorno:** `void`
- **Propósito:** Añadir una reseña y calificación.
- **Ejemplo de uso:** `supabase.rpc('add_review', {'user_id': '...'}).execute()`

### Función: `suggest_organization`
- **Parámetros:** name, description, latitude, longitude, address
- **Tipo de retorno:** `uuid`
- **Propósito:** Sugerir una nueva organización desde la app.
- **Ejemplo de uso:** `supabase.rpc('suggest_organization', {'name': '...'}).execute()`

### Función: `approve_suggestion`
- **Parámetros:** suggestion_id
- **Tipo de retorno:** `void`
- **Propósito:** Aprobar una sugerencia (solo admin).
- **Ejemplo de uso:** `supabase.rpc('approve_suggestion', {'suggestion_id': '...'}).execute()`

### Función: `reject_suggestion`
- **Parámetros:** suggestion_id, reason
- **Tipo de retorno:** `void`
- **Propósito:** Rechazar una sugerencia (solo admin).
- **Ejemplo de uso:** `supabase.rpc('reject_suggestion', {'suggestion_id': '...'}).execute()`

## 4. Conteo de registros (Tablas)

| Tabla | Registros Totales |
|---|---|
| users | 0 |
| organizations | 0 |
| service_types | 0 |
| services | 0 |
| organization_members | 0 |
| organization_needs | 0 |
| organization_photos | 0 |
| reviews | 0 |
| tags | 0 |
| review_tag_assignments | 0 |
| favorites | 0 |
| suggested_organizations | 0 |
| suggested_organization_services | 0 |

## 5. Datos de ejemplo

*(Ver sección 2 'Vistas existentes' donde se incluyen los 3 registros de ejemplo de las vistas principales solicitadas)*

## 6. Recomendación de integración

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
