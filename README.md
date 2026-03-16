# Nodalia Navigation Bar

Tarjeta Lovelace ligera para Home Assistant pensada para reemplazar barras de navegacion hechas con `vertical-stack`, `button-card` y `mod-card` cuando empiezan a ser dificiles de mantener.

## Que aporta

- Barra fija inferior o superior.
- Ocultacion automatica en escritorio o movil.
- Rutas con visibilidad por usuario.
- Deteccion de ruta activa.
- Popups por ruta para agrupar accesos secundarios, tambien en modo solo icono.
- Media player integrado encima de la barra, con boton para plegarlo temporalmente.
- Soporte basico para `navigate`, `url`, `call-service`, `toggle` y `more-info`.
- Badges sencillos por valor fijo o por entidad.
- Editor visual para general, rutas, popup y media player, con reordenacion rapida.
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
- `show_labels`: muestra texto bajo cada icono si las rutas visibles tienen `label`.
- `routes`: array de elementos.
- `media_player`: widget opcional de reproduccion.
- `layout`: comportamiento general.
- `styles`: personalizacion visual.

### `layout`

```yaml
layout:
  fixed: true
  reserve_space: true
  reserve_height: calc(90px + env(safe-area-inset-bottom, 0px))
  position: bottom
  stack_gap: 12px
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
    size: 54px
    border_radius: 999px
    background: rgba(255, 255, 255, 0.05)
    color: var(--primary-text-color)
    active_color: var(--primary-text-color)
    active_background: rgba(255, 255, 255, 0.08)
    icon_size: 28px
    icon_offset_x: 0px
    icon_offset_y: -1px
    label_color: var(--secondary-text-color)
    active_label_color: var(--primary-text-color)
    label_size: 12px
    label_gap: 6px
  badge:
    background: var(--error-color)
    color: white
    min_size: 18px
    font_size: 11px
  popup:
    background: var(--ha-card-background)
    border: 1px solid var(--divider-color)
    border_radius: 24px
    box_shadow: 0 18px 40px rgba(0, 0, 0, 0.22)
    layout: auto
    label_size: 13px
    padding: 12px
    min_width: 220px
    max_width: 380px
    item_gap: 12px
    item_size: 48px
    backdrop: rgba(0, 0, 0, 0.18)
  media_player:
    background: var(--ha-card-background)
    border: 1px solid var(--divider-color)
    border_radius: 28px
    box_shadow: var(--ha-card-box-shadow)
    padding: 14px
    min_height: 104px
    artwork_size: 64px
    control_size: 40px
    title_size: 14px
    subtitle_size: 12px
    progress_color: var(--primary-color)
    progress_background: rgba(var(--rgb-primary-color), 0.14)
    overlay_color: rgba(0, 0, 0, 0.32)
    dot_size: 8px
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
    popup:
      - icon: mdi:cog
        label: Ajustes
        path: /config/dashboard
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
- `popup`
- `popup_layout`: `auto`, `vertical` o `horizontal`
- `badge`
- `tap_action`
- `color`, `active_color`, `active_background`

## Popup por ruta

Si una ruta tiene `popup`, la tarjeta abrira el menu automaticamente al pulsarla. Tambien puedes forzarlo con `tap_action.action: open-popup`.
El popup puede mostrarse en `auto`, `vertical` u `horizontal`. `auto` intenta decidir una distribucion mas agradable segun el numero de items, `vertical` usa una sola columna y `horizontal` reparte los items en varias columnas.

```yaml
routes:
  - icon: mdi:dots-horizontal
    label: Mas
    popup_layout: vertical
    popup:
      - icon: mdi:account
        path: /profile
        users:
          - 3b746808932e40958ec4fcf054f287ec
      - icon: mdi:cog
        label: Ajustes
        path: /config/dashboard
        users:
          - 7daa14a5edee4742848cf5ecc5ef0fb6
      - icon: mdi:robot
        label: Automatizaciones
        path: /config/automation/dashboard
```

Cada item del popup admite practicamente los mismos campos que una ruta normal: `icon`, `image`, `label`, `description`, `path`, `active_paths`, `users`, `badge` y `tap_action`.
`label` es opcional, asi que puedes dejarlo vacio desde el editor visual para crear accesos solo con icono. Tambien puedes ajustar `styles.popup.layout`, `styles.popup.max_width`, `styles.popup.item_size` y `styles.popup.item_gap` desde el editor, y si un boton concreto necesita un comportamiento distinto puedes usar `popup_layout` en esa ruta.

## Media player integrado

El bloque `media_player` se muestra encima de la barra cuando encuentra reproductores visibles. Por defecto, un reproductor aparece si su estado es `playing` o `paused`.
Desde la propia UI puedes plegarlo temporalmente y volver a mostrarlo con una pastilla compacta, sin tocar la configuracion.

```yaml
media_player:
  show_desktop: false
  album_cover_background: true
  reserve_height: 116px
  players:
    - entity: media_player.spotify_plus_daniel
      title: Spotify
      subtitle: Cuenta principal
    - entity: media_player.salon
      icon: mdi:speaker
      subtitle: Altavoz del salon
```

### Opciones del widget

- `show`: `true` o `false` para forzar visibilidad global.
- `show_desktop`: muestra el widget tambien en escritorio.
- `album_cover_background`: usa la caratula como fondo difuminado.
- `reserve_height`: altura extra reservada cuando la barra es fija.
- `players`: lista de reproductores.

### Opciones por reproductor

- `entity`: entidad `media_player.*`.
- `title`: titulo fijo opcional.
- `subtitle`: subtitulo fijo opcional.
- `icon`: icono alternativo si no quieres usar caratula.
- `image`: imagen fija alternativa.
- `show`: `true` o `false` para ese reproductor.
- `show_states`: lista de estados visibles, por ejemplo `["playing", "paused", "idle"]`.
- `tap_action`: accion al pulsar la tarjeta del reproductor.

Los reproductores tambien se pueden anadir y editar desde el editor visual.

## Estilo compacto tipo barra clasica

Si quieres acercarte mas al aspecto de tu barra anterior, este bloque suele dar un resultado mejor equilibrado:

```yaml
styles:
  bar:
    border: none
    border_radius: 38px
    padding: 18px 20px calc(18px + env(safe-area-inset-bottom, 0px)) 20px
    min_height: 88px
    gap: 16px
  button:
    size: 62px
    background: rgba(255, 255, 255, 0.05)
    active_background: rgba(255, 255, 255, 0.12)
    active_color: var(--primary-text-color)
    active_label_color: var(--primary-text-color)
  popup:
    max_width: 420px
    item_size: 46px
    item_gap: 10px
```

### Ejemplo completo con popup y media player

```yaml
type: custom:nodalia-navigation-bar
show_labels: false
layout:
  fixed: true
  reserve_space: true
  show_desktop: false
styles:
  bar:
    border_radius: 32px
media_player:
  album_cover_background: true
  players:
    - entity: media_player.spotify_plus_daniel
      title: Spotify
    - entity: media_player.salon
      icon: mdi:speaker
routes:
  - icon: mdi:home-assistant
    path: /lovelace/principal
  - icon: mdi:flash
    path: /lovelace/energia
  - icon: mdi:thermostat
    path: /lovelace/termostatos
  - icon: mdi:dots-horizontal
    label: Mas
    popup:
      - icon: mdi:security
        label: Seguridad
        path: /lovelace/seguridad
      - icon: mdi:account
        label: Perfil
        path: /profile
      - icon: mdi:cog
        label: Ajustes
        path: /config/dashboard
```

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

- El editor visual cubre ya popup y media player, pero las acciones complejas siguen siendo mas comodas por YAML.
- Si quieres acciones muy personalizadas, es mejor seguir ampliando el YAML.

## Archivo de ejemplo

Puedes usar `examples/mobile-navbar.yaml` como base.
Si quieres una base con popup y media player, usa `examples/mobile-navbar-popup-media.yaml`.
