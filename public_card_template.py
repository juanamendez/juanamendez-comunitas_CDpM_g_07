PUBLIC_CARD_HTML = """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
    body { font-family: 'Outfit', sans-serif; background-color: #fbf9f6; margin: 0; padding: 15px; color: #4C433D; }
    .card { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 8px 24px rgba(76,67,61,0.08); margin: 0 auto; max-width: 500px; border: 1px solid rgba(76,67,61,0.05); }
    .brand { color: #E07A5F; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; margin-bottom: 5px; text-transform: uppercase; }
    h1 { font-size: 26px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.2; }
    .info-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
    .icon { color: #F2CC8F; width: 22px; flex-shrink: 0; }
    .section { background: #FAF7EC; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
    .section-title { font-size: 12px; color: #827B75; text-transform: uppercase; font-weight: 600; letter-spacing: 0.8px; margin-bottom: 8px; }
    #map { height: 200px; border-radius: 14px; margin-bottom: 16px; z-index: 1; border: 2px solid rgba(76,67,61,0.05); }
    .btn { display: flex; align-items: center; justify-content: center; background: #E07A5F; color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px; font-size: 16px; gap: 8px; box-shadow: 0 4px 12px rgba(224,122,95,0.3); }
    .sched-item { margin-bottom: 6px; }
    .sched-item strong { color: #4C433D; }
</style>
</head>
<body>
<div class="card">
    <div class="brand">COMUNITAS</div>
    <h1>{name}</h1>
    
    <div class="info-row">
        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
        <div style="font-size:16px;">{address}</div>
    </div>
    
    {phone_html}
    
    <div class="section">
        <div class="section-title">Servicios Disponibles</div>
        <div style="font-weight: 500; font-size:16px;">{services_list}</div>
    </div>
    
    <div class="section">
        <div class="section-title">Horarios</div>
        <div style="font-size:15px;">{schedules_html}</div>
    </div>
    
    {map_html}
    
    {maps_btn}
</div>
<script>
    if ({has_coords}) {{
        var map = L.map('map', {{zoomControl: false}}).setView([{lat}, {lng}], 15);
        L.tileLayer('https://{{s}}.basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}{{r}}.png', {{
            attribution: '©OpenStreetMap',
            maxZoom: 19
        }}).addTo(map);
        var icon = L.divIcon({{
            className: 'custom-div-icon',
            html: '<div style="background-color:#E07A5F; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }});
        L.marker([{lat}, {lng}], {{icon: icon}}).addTo(map);
    }}
</script>
</body>
</html>
"""
