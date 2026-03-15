# Nodalia Navigation Bar

Tarjeta Lovelace ligera para Home Assistant pensada para reemplazar barras de navegacion hechas con `vertical-stack`, `button-card` y `mod-card` cuando empiezan a ser dificiles de mantener.

## Que aporta

- Barra fija inferior o superior.
- Ocultacion automatica en escritorio o movil.
- Rutas con visibilidad por usuario.
- Deteccion de ruta activa.
- Soporte basico para `navigate`, `url`, `call-service`, `toggle` y `more-info`.
- Badges sencillos por valor fijo o por entidad.
- Editor visual simple para las opciones mas comunes.
- Archivo unico `nodalia-navigation-bar.js`, sin build.

## Instalacion

1. Copia `nodalia-navigation-bar.js` a `/config/www/nodalia-navigation-bar.js`.
2. Anade el recurso en Home Assistant:

```yaml
url: /local/nodalia-navigation-bar.js
type: module
```

3. Usa la tarjeta con:

```yaml
type: custom:nodalia-navigation-bar
```

## Ejemplo equivalente a tu barra actual

```yaml
type: custom:nodalia-navigation-bar
show_labels: false
layout:
  fixed: true
  reserve_space: true
  show_desktop: false
  mobile_breakpoint: 1279
  z_index: 2
styles:
  bar:
    background: var(--ha-card-background)
    border: 1px solid var(--divider-color)
    border_radius: 32px
    box_shadow: var(--ha-card-box-shadow)
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px
    min_height: 90px
    gap: 20px
  button:
    size: 60px
    icon_size: 32px
    color: var(--primary-text-color)
routes:
  - icon: mdi:home-assistant
    path: /lovelace/principal
  - icon: mdi:flash
    path: /lovelace/energia
  - icon: mdi:thermostat
    path: /lovelace/termostatos
  - icon: mdi:security
    path: /lovelace/seguridad
  - icon: mdi:account
    path: /profile
    users:
      - 3b746808932e40958ec4fcf054f287ec
      - 7b4e977112784070beb56114ec31bd99
      - 0220bbe1ed2842b7ba9976c04a71b9de
      - 53316bbdd54a4c139fb823c415ca3c8d
      - d91b85c4b3114e508c50e65afcf944c8
  - icon: mdi:cog
    path: /config/dashboard
    users:
      - 7daa14a5edee4742848cf5ecc5ef0fb6
```

## Configuracion principal

### Nivel superior

- `title`: texto opcional encima de la barra.
- `show_labels`: muestra texto bajo cada icono.
- `routes`: array de elementos.
- `layout`: comportamiento general.
- `styles`: personalizacion visual.

### `layout`

```yaml
layout:
  fixed: true
  reserve_space: true
  reserve_height: calc(90px + env(safe-area-inset-bottom, 0px))
  position: bottom
  show_desktop: false
  mobile_breakpoint: 1279
  z_index: 2
  side_margin: 0px
  offset: 0px
```

### `styles`

```yaml
styles:
  bar:
    background: var(--ha-card-background)
    border: 1px solid var(--divider-color)
    border_radius: 32px
    box_shadow: var(--ha-card-box-shadow)
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px
    min_height: 90px
    gap: 20px
    justify_content: space-evenly
    max_width: 100%
    backdrop_filter: none
  button:
    size: 60px
    border_radius: 999px
    color: var(--primary-text-color)
    active_color: var(--primary-color)
    active_background: rgba(var(--rgb-primary-color), 0.12)
    icon_size: 32px
    label_color: var(--secondary-text-color)
    active_label_color: var(--primary-color)
    label_size: 12px
    label_gap: 6px
  badge:
    background: var(--error-color)
    color: white
    min_size: 18px
    font_size: 11px
```

## Formato de cada ruta

```yaml
routes:
  - icon: mdi:home
    icon_active: mdi:home
    image: /local/avatar.png
    image_active: /local/avatar-selected.png
    label: Inicio
    path: /lovelace/principal
    active_paths:
      - /lovelace/principal/subvista
    match: exact
    users:
      - user-id-1
    badge:
      entity: sensor.notificaciones
      show_zero: false
      max: 99
    tap_action:
      action: navigate
      navigation_path: /lovelace/principal
```

### Campos utiles por ruta

- `icon`, `icon_active`
- `image`, `image_active`
- `label`
- `path`
- `active_paths`
- `match`: `exact` o `prefix`
- `users`
- `hidden`
- `badge`
- `tap_action`
- `color`, `active_color`, `active_background`

## Acciones soportadas

```yaml
tap_action:
  action: navigate
  navigation_path: /lovelace/principal
```

```yaml
tap_action:
  action: url
  url_path: https://example.com
  new_tab: true
```

```yaml
tap_action:
  action: call-service
  service: light.turn_on
  service_data:
    entity_id: light.salon
```

```yaml
tap_action:
  action: toggle
  entity: light.salon
```

```yaml
tap_action:
  action: more-info
  entity: climate.termostato
```

## Badge rapido

```yaml
routes:
  - icon: mdi:bell
    path: /lovelace/avisos
    badge:
      entity: sensor.pending_notifications
      show_zero: false
      max: 9
```

## Limitaciones actuales

- El editor integrado cubre solo la configuracion mas comun.
- No incluye popups, media player ni templates JS.
- Si quieres acciones muy personalizadas, es mejor seguir ampliando el YAML.

## Archivo de ejemplo

Puedes usar `examples/mobile-navbar.yaml` como base.
