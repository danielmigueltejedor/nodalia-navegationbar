const CARD_TAG = "nodalia-navigation-bar";
const EDITOR_TAG = "nodalia-navigation-bar-editor";
const CARD_VERSION = "0.1.0";

const DEFAULT_CONFIG = {
  title: "",
  show_labels: false,
  layout: {
    fixed: true,
    reserve_space: true,
    reserve_height: "calc(90px + env(safe-area-inset-bottom, 0px))",
    position: "bottom",
    show_desktop: false,
    mobile_breakpoint: 1279,
    z_index: 2,
    side_margin: "0px",
    offset: "0px",
  },
  styles: {
    bar: {
      background: "var(--ha-card-background)",
      border: "1px solid var(--divider-color)",
      border_radius: "32px",
      box_shadow: "var(--ha-card-box-shadow)",
      padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px",
      min_height: "90px",
      gap: "20px",
      justify_content: "space-evenly",
      max_width: "100%",
      backdrop_filter: "none",
    },
    button: {
      size: "60px",
      border_radius: "999px",
      color: "var(--primary-text-color)",
      active_color: "var(--primary-color)",
      active_background: "rgba(var(--rgb-primary-color), 0.12)",
      icon_size: "32px",
      label_color: "var(--secondary-text-color)",
      active_label_color: "var(--primary-color)",
      label_size: "12px",
      label_gap: "6px",
    },
    badge: {
      background: "var(--error-color)",
      color: "var(--text-primary-color, #fff)",
      min_size: "18px",
      font_size: "11px",
    },
  },
  routes: [],
};

const STUB_CONFIG = {
  show_labels: false,
  routes: [
    {
      icon: "mdi:home-assistant",
      label: "Inicio",
      path: "/lovelace/principal",
    },
    {
      icon: "mdi:flash",
      label: "Energia",
      path: "/lovelace/energia",
    },
    {
      icon: "mdi:thermostat",
      label: "Clima",
      path: "/lovelace/termostatos",
    },
    {
      icon: "mdi:security",
      label: "Seguridad",
      path: "/lovelace/seguridad",
    },
  ],
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function mergeConfig(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override.map(item => deepClone(item)) : deepClone(base);
  }

  if (!isObject(base)) {
    return override === undefined ? base : override;
  }

  const result = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(override || {})]);

  keys.forEach(key => {
    const baseValue = base[key];
    const overrideValue = override ? override[key] : undefined;

    if (overrideValue === undefined) {
      result[key] = deepClone(baseValue);
      return;
    }

    if (Array.isArray(overrideValue)) {
      result[key] = deepClone(overrideValue);
      return;
    }

    if (isObject(baseValue) && isObject(overrideValue)) {
      result[key] = mergeConfig(baseValue, overrideValue);
      return;
    }

    result[key] = overrideValue;
  });

  return result;
}

function compactConfig(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => compactConfig(item))
      .filter(item => item !== undefined);
  }

  if (isObject(value)) {
    const compacted = {};

    Object.entries(value).forEach(([key, item]) => {
      const cleaned = compactConfig(item);
      const isEmptyObject = isObject(cleaned) && Object.keys(cleaned).length === 0;

      if (cleaned !== undefined && !isEmptyObject) {
        compacted[key] = cleaned;
      }
    });

    return compacted;
  }

  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!isObject(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
}

function deleteByPath(target, path) {
  const parts = path.split(".");
  let cursor = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!isObject(cursor[key])) {
      return;
    }
    cursor = cursor[key];
  }

  delete cursor[parts[parts.length - 1]];
}

function fireEvent(node, type, detail, options) {
  const event = new CustomEvent(type, {
    bubbles: options?.bubbles ?? true,
    cancelable: Boolean(options?.cancelable),
    composed: options?.composed ?? true,
    detail,
  });
  node.dispatchEvent(event);
  return event;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function arrayFromCsv(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizePath(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  if (/^[a-z]+:\/\//i.test(value)) {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);
    return (url.pathname || "/").replace(/\/+$/, "") || "/";
  } catch (_error) {
    return (value.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  }
}

function matchPath(currentPath, candidatePath, mode) {
  if (!candidatePath) {
    return false;
  }

  if (mode === "prefix") {
    return currentPath === candidatePath || currentPath.startsWith(`${candidatePath}/`);
  }

  return currentPath === candidatePath;
}

function normalizeConfig(config) {
  const baseConfig = { ...config };

  if (!Array.isArray(baseConfig.routes) && Array.isArray(baseConfig.items)) {
    baseConfig.routes = baseConfig.items;
    delete baseConfig.items;
  }

  if (!Array.isArray(baseConfig.routes)) {
    throw new Error('"routes" is required and must be an array');
  }

  return mergeConfig(DEFAULT_CONFIG, baseConfig);
}

class NodaliaNavigationBarCard extends HTMLElement {
  static getStubConfig() {
    return deepClone(STUB_CONFIG);
  }

  static async getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._renderedRoutes = [];
    this._onResize = () => this._render();
    this._onLocationChange = () => this._render();
    this._onShadowClick = this._onShadowClick.bind(this);
    this.shadowRoot.addEventListener("click", this._onShadowClick);
  }

  connectedCallback() {
    window.addEventListener("resize", this._onResize);
    window.addEventListener("popstate", this._onLocationChange);
    window.addEventListener("location-changed", this._onLocationChange);
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("popstate", this._onLocationChange);
    window.removeEventListener("location-changed", this._onLocationChange);
  }

  setConfig(config) {
    this._config = normalizeConfig(config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  _onShadowClick(event) {
    const routeButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.routeIndex !== undefined);

    if (!routeButton) {
      return;
    }

    const index = Number(routeButton.dataset.routeIndex);
    const route = this._renderedRoutes[index];

    if (!route) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this._runAction(route);
  }

  _isInEditMode() {
    const homeAssistantRoot = document.querySelector("body > home-assistant");

    const inEditDashboardMode = this.closest("hui-card-edit-mode") !== null;
    const inPreviewMode = this.closest("hui-card-preview") !== null || this.closest(".card > .preview") !== null;
    const inEditCardMode = Boolean(
      homeAssistantRoot?.shadowRoot
        ?.querySelector("hui-dialog-edit-card")
        ?.shadowRoot?.querySelector("ha-dialog"),
    );

    return inEditDashboardMode || inPreviewMode || inEditCardMode;
  }

  _shouldHideForScreen(config) {
    if (this._isInEditMode()) {
      return false;
    }

    if (config.layout.show_desktop) {
      return false;
    }

    return window.innerWidth > Number(config.layout.mobile_breakpoint || 1279);
  }

  _getVisibleRoutes() {
    if (!this._config) {
      return [];
    }

    if (this._isInEditMode()) {
      return this._config.routes.filter(Boolean);
    }

    const currentUserId = this._hass?.user?.id;

    return this._config.routes.filter(route => {
      if (!route || route.hidden === true || route.show === false) {
        return false;
      }

      if (Array.isArray(route.users) && route.users.length > 0) {
        return route.users.includes(currentUserId);
      }

      return true;
    });
  }

  _getRoutePath(route) {
    if (typeof route.path === "string" && route.path) {
      return route.path;
    }

    if (route.tap_action?.action === "navigate" && route.tap_action.navigation_path) {
      return route.tap_action.navigation_path;
    }

    return null;
  }

  _isRouteActive(route, currentPath) {
    if (route.selected === true) {
      return true;
    }

    const candidates = [];
    const mainPath = normalizePath(this._getRoutePath(route));
    if (mainPath) {
      candidates.push(mainPath);
    }

    if (Array.isArray(route.active_paths)) {
      route.active_paths.forEach(path => {
        const normalized = normalizePath(path);
        if (normalized) {
          candidates.push(normalized);
        }
      });
    }

    return candidates.some(path => matchPath(currentPath, path, route.match || "exact"));
  }

  _getBadge(route) {
    const badge = route.badge;

    if (badge === undefined || badge === null || badge === false) {
      return null;
    }

    if (typeof badge === "string" || typeof badge === "number") {
      return {
        content: String(badge),
        background: this._config.styles.badge.background,
        color: this._config.styles.badge.color,
      };
    }

    if (badge.show === false) {
      return null;
    }

    let content = badge.content;

    if (content === undefined && badge.entity && this._hass?.states?.[badge.entity]) {
      const stateObject = this._hass.states[badge.entity];
      content = badge.attribute ? stateObject.attributes?.[badge.attribute] : stateObject.state;
    }

    if (content === undefined || content === null || content === "") {
      return null;
    }

    if (!badge.show_unavailable && ["unknown", "unavailable", "none"].includes(String(content).toLowerCase())) {
      return null;
    }

    if (!badge.show_zero && Number(content) === 0) {
      return null;
    }

    if (!Number.isNaN(Number(content)) && Number(content) > Number(badge.max || 99)) {
      content = `${badge.max || 99}+`;
    }

    return {
      content: String(content),
      background: badge.background || this._config.styles.badge.background,
      color: badge.color || this._config.styles.badge.color,
    };
  }

  _renderIcon(route, isActive) {
    const image = isActive ? route.image_active || route.image : route.image || route.image_active;

    if (image) {
      return `<img class="nav-image" src="${escapeHtml(image)}" alt="${escapeHtml(route.label || "navigation item")}" />`;
    }

    const icon = isActive ? route.icon_active || route.icon : route.icon || route.icon_active;
    if (!icon) {
      return `<span class="nav-icon nav-icon--placeholder"></span>`;
    }

    return `<ha-icon class="nav-icon" icon="${escapeHtml(icon)}"></ha-icon>`;
  }

  _getRouteAction(route) {
    if (route.tap_action) {
      return route.tap_action;
    }

    if (route.path) {
      return {
        action: "navigate",
        navigation_path: route.path,
      };
    }

    return null;
  }

  _navigate(path) {
    if (!path) {
      return;
    }

    window.history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
  }

  _callService(action) {
    if (!this._hass || !action?.service) {
      return;
    }

    const [domain, service] = String(action.service).split(".");
    if (!domain || !service) {
      return;
    }

    this._hass.callService(domain, service, action.service_data || {}, action.target);
  }

  _runAction(route) {
    const action = this._getRouteAction(route);

    if (!action || action.action === "none") {
      return;
    }

    switch (action.action) {
      case "navigate":
        this._navigate(action.navigation_path || route.path);
        break;
      case "url": {
        const url = action.url_path || action.url || route.url || route.path;
        if (!url) {
          return;
        }

        if (action.new_tab) {
          window.open(url, "_blank", "noopener");
        } else {
          window.location.assign(url);
        }
        break;
      }
      case "call-service":
        this._callService(action);
        break;
      case "toggle": {
        const entityId = action.entity || route.entity;
        if (!entityId || !this._hass) {
          return;
        }

        this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
        break;
      }
      case "more-info": {
        const entityId = action.entity || route.entity;
        if (!entityId) {
          return;
        }

        fireEvent(this, "hass-more-info", { entityId });
        break;
      }
      default:
        // Unsupported actions are ignored so the card stays safe to use.
        break;
    }
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    if (!this._config) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    const config = this._config;
    const inEditMode = this._isInEditMode();
    const shouldHide = this._shouldHideForScreen(config);

    if (shouldHide && !inEditMode) {
      this._renderedRoutes = [];
      this.shadowRoot.innerHTML = "";
      return;
    }

    const visibleRoutes = this._getVisibleRoutes();
    const currentPath = normalizePath(window.location.pathname) || "/";
    const isFixed = config.layout.fixed && !inEditMode;
    const spacerHeight = isFixed && config.layout.reserve_space ? config.layout.reserve_height : "0px";
    const titleMarkup = config.title
      ? `<div class="navbar-title">${escapeHtml(config.title)}</div>`
      : "";

    this._renderedRoutes = visibleRoutes;

    const routesMarkup =
      visibleRoutes.length > 0
        ? visibleRoutes
            .map((route, index) => {
              const isActive = this._isRouteActive(route, currentPath);
              const badge = this._getBadge(route);
              const label = route.label || "";
              const routeStyle = [
                route.color ? `--route-color:${route.color};` : "",
                route.active_color ? `--route-active-color:${route.active_color};` : "",
                route.active_background ? `--route-active-background:${route.active_background};` : "",
              ]
                .filter(Boolean)
                .join("");

              return `
                <button
                  class="nav-item ${isActive ? "active" : ""}"
                  data-route-index="${index}"
                  type="button"
                  style="${routeStyle}"
                  aria-label="${escapeHtml(label || route.path || `Route ${index + 1}`)}"
                >
                  <span class="nav-icon-wrap">
                    ${this._renderIcon(route, isActive)}
                    ${
                      badge
                        ? `<span
                            class="nav-badge"
                            style="--badge-background:${badge.background};--badge-color:${badge.color};"
                          >${escapeHtml(badge.content)}</span>`
                        : ""
                    }
                  </span>
                  ${
                    config.show_labels && label
                      ? `<span class="nav-label">${escapeHtml(label)}</span>`
                      : ""
                  }
                </button>
              `;
            })
            .join("")
        : `
          <div class="empty-state">
            No hay rutas visibles. Revisa los IDs de usuario o anade elementos a "routes".
          </div>
        `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        * {
          box-sizing: border-box;
        }

        .spacer {
          display: ${isFixed && config.layout.reserve_space ? "block" : "none"};
          height: ${spacerHeight};
        }

        .dock {
          position: ${isFixed ? "fixed" : "relative"};
          left: ${config.layout.side_margin};
          right: ${config.layout.side_margin};
          ${config.layout.position === "top" ? `top: ${config.layout.offset};` : `bottom: ${config.layout.offset};`}
          z-index: ${config.layout.z_index};
          pointer-events: none;
        }

        .dock-inner {
          width: 100%;
          max-width: ${config.styles.bar.max_width};
          margin: 0 auto;
          pointer-events: auto;
        }

        ha-card {
          background: ${config.styles.bar.background};
          border: ${config.styles.bar.border};
          border-radius: ${config.styles.bar.border_radius};
          box-shadow: ${config.styles.bar.box_shadow};
          backdrop-filter: ${config.styles.bar.backdrop_filter};
          padding: ${config.styles.bar.padding};
          min-height: ${config.styles.bar.min_height};
          overflow: hidden;
        }

        .navbar-title {
          margin-bottom: 10px;
          color: var(--primary-text-color);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .navbar {
          display: flex;
          align-items: center;
          justify-content: ${config.styles.bar.justify_content};
          gap: ${config.styles.bar.gap};
          width: 100%;
        }

        .nav-item {
          --route-color: ${config.styles.button.color};
          --route-active-color: ${config.styles.button.active_color};
          --route-active-background: ${config.styles.button.active_background};
          appearance: none;
          background: transparent;
          border: 0;
          border-radius: ${config.styles.button.border_radius};
          color: var(--route-color);
          cursor: pointer;
          display: inline-flex;
          flex: 1 1 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: ${config.show_labels ? config.styles.button.label_gap : "0px"};
          min-width: 0;
          min-height: ${config.styles.button.size};
          padding: 0;
          position: relative;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease;
        }

        .nav-item:hover {
          transform: translateY(-1px);
        }

        .nav-item:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        .nav-item.active {
          color: var(--route-active-color);
        }

        .nav-item.active .nav-icon-wrap {
          background: var(--route-active-background);
        }

        .nav-icon-wrap {
          width: ${config.styles.button.size};
          height: ${config.styles.button.size};
          border-radius: ${config.styles.button.border_radius};
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 160ms ease;
        }

        .nav-icon,
        .nav-image {
          width: ${config.styles.button.icon_size};
          height: ${config.styles.button.icon_size};
          font-size: ${config.styles.button.icon_size};
        }

        .nav-image {
          border-radius: 50%;
          object-fit: cover;
        }

        .nav-icon--placeholder {
          display: inline-block;
        }

        .nav-label {
          color: ${config.styles.button.label_color};
          font-size: ${config.styles.button.label_size};
          line-height: 1.2;
          white-space: nowrap;
        }

        .nav-item.active .nav-label {
          color: ${config.styles.button.active_label_color};
        }

        .nav-badge {
          align-items: center;
          background: var(--badge-background);
          border-radius: 999px;
          color: var(--badge-color);
          display: inline-flex;
          font-size: ${config.styles.badge.font_size};
          font-weight: 700;
          inset-inline-end: -4px;
          justify-content: center;
          min-height: ${config.styles.badge.min_size};
          min-width: ${config.styles.badge.min_size};
          padding: 0 6px;
          position: absolute;
          top: -2px;
        }

        .empty-state {
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.4;
          padding: 4px 0;
          text-align: center;
          width: 100%;
        }
      </style>
      <div class="spacer" aria-hidden="true"></div>
      <div class="dock">
        <div class="dock-inner">
          <ha-card>
            ${titleMarkup}
            <nav class="navbar" aria-label="Navigation bar">
              ${routesMarkup}
            </nav>
          </ha-card>
        </div>
      </div>
    `;
  }
}

class NodaliaNavigationBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = deepClone(STUB_CONFIG);
    this._onShadowInput = this._onShadowInput.bind(this);
    this._onShadowClick = this._onShadowClick.bind(this);
    this.shadowRoot.addEventListener("input", this._onShadowInput);
    this.shadowRoot.addEventListener("change", this._onShadowInput);
    this.shadowRoot.addEventListener("click", this._onShadowClick);
  }

  setConfig(config) {
    const nextConfig = deepClone(config || STUB_CONFIG);
    if (!Array.isArray(nextConfig.routes) && Array.isArray(nextConfig.items)) {
      nextConfig.routes = nextConfig.items;
      delete nextConfig.items;
    }
    if (!Array.isArray(nextConfig.routes)) {
      nextConfig.routes = [];
    }
    this._config = nextConfig;
    this._render();
  }

  _emitConfig(nextConfig) {
    this._config = compactConfig(nextConfig);
    this._render();
    fireEvent(this, "config-changed", {
      config: this._config,
    });
  }

  _onShadowInput(event) {
    const field = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.field);

    if (field) {
      const nextConfig = deepClone(this._config);
      const value = field.type === "checkbox" ? field.checked : field.value;

      if (value === "" && field.dataset.optional === "true") {
        deleteByPath(nextConfig, field.dataset.field);
      } else if (field.type === "number") {
        setByPath(nextConfig, field.dataset.field, Number(value));
      } else {
        setByPath(nextConfig, field.dataset.field, value);
      }

      this._emitConfig(nextConfig);
      return;
    }

    const routeField = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.routeField);

    if (!routeField) {
      return;
    }

    const routeIndex = Number(routeField.dataset.routeIndex);
    const routeKey = routeField.dataset.routeField;
    const nextConfig = deepClone(this._config);
    const route = nextConfig.routes[routeIndex];

    if (!route) {
      return;
    }

    if (routeField.dataset.csv === "true") {
      const values = arrayFromCsv(routeField.value);
      if (values.length > 0) {
        route[routeKey] = values;
      } else {
        delete route[routeKey];
      }
    } else if (routeField.type === "checkbox") {
      route[routeKey] = routeField.checked;
    } else if (routeField.value === "" && routeField.dataset.optional === "true") {
      delete route[routeKey];
    } else {
      route[routeKey] = routeField.value;
    }

    this._emitConfig(nextConfig);
  }

  _onShadowClick(event) {
    const actionButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.editorAction);

    if (!actionButton) {
      return;
    }

    const nextConfig = deepClone(this._config);
    if (!Array.isArray(nextConfig.routes)) {
      nextConfig.routes = [];
    }

    if (actionButton.dataset.editorAction === "add-route") {
      nextConfig.routes.push({
        icon: "mdi:circle-outline",
        label: `Ruta ${nextConfig.routes.length + 1}`,
        path: "/lovelace/nueva-ruta",
      });
      this._emitConfig(nextConfig);
      return;
    }

    if (actionButton.dataset.editorAction === "remove-route") {
      const index = Number(actionButton.dataset.routeIndex);
      nextConfig.routes.splice(index, 1);
      this._emitConfig(nextConfig);
    }
  }

  _renderRoute(route, index) {
    return `
      <div class="route-card">
        <div class="route-head">
          <strong>Ruta ${index + 1}</strong>
          <button type="button" class="danger" data-editor-action="remove-route" data-route-index="${index}">
            Eliminar
          </button>
        </div>
        <div class="grid">
          <label>
            <span>Etiqueta</span>
            <input type="text" data-route-index="${index}" data-route-field="label" value="${escapeHtml(route.label || "")}" />
          </label>
          <label>
            <span>Icono</span>
            <input type="text" data-route-index="${index}" data-route-field="icon" value="${escapeHtml(route.icon || "")}" />
          </label>
          <label>
            <span>Path</span>
            <input type="text" data-route-index="${index}" data-route-field="path" value="${escapeHtml(route.path || "")}" />
          </label>
          <label>
            <span>Path activo extra</span>
            <input
              type="text"
              data-route-index="${index}"
              data-route-field="active_paths"
              data-csv="true"
              data-optional="true"
              value="${escapeHtml((route.active_paths || []).join(", "))}"
              placeholder="/lovelace/principal/subvista"
            />
          </label>
          <label>
            <span>Usuarios</span>
            <input
              type="text"
              data-route-index="${index}"
              data-route-field="users"
              data-csv="true"
              data-optional="true"
              value="${escapeHtml((route.users || []).join(", "))}"
              placeholder="id1, id2"
            />
          </label>
          <label class="checkbox">
            <input type="checkbox" data-route-index="${index}" data-match-toggle="true" ${route.match === "prefix" ? "checked" : ""} />
            <span>Marcar activa por prefijo</span>
          </label>
        </div>
      </div>
    `;
  }

  _render() {
    const config = normalizeConfig(this._config || STUB_CONFIG);
    const routesMarkup = config.routes.map((route, index) => this._renderRoute(route, index)).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        * {
          box-sizing: border-box;
        }

        .editor {
          display: grid;
          gap: 16px;
          padding: 8px 0;
        }

        .panel,
        .route-card {
          background: var(--card-background-color, var(--ha-card-background, #fff));
          border: 1px solid var(--divider-color);
          border-radius: 16px;
          padding: 16px;
        }

        .panel-title,
        .route-head {
          align-items: center;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        label {
          color: var(--primary-text-color);
          display: grid;
          gap: 6px;
          font-size: 13px;
        }

        label span {
          color: var(--secondary-text-color);
          font-weight: 500;
        }

        input {
          background: var(--secondary-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          color: var(--primary-text-color);
          min-height: 38px;
          padding: 8px 10px;
          width: 100%;
        }

        .checkbox {
          align-items: center;
          grid-template-columns: auto 1fr;
          min-height: 38px;
        }

        .checkbox input {
          width: 18px;
          min-height: 18px;
          margin: 0;
        }

        button {
          background: var(--primary-color);
          border: 0;
          border-radius: 999px;
          color: var(--text-primary-color, #fff);
          cursor: pointer;
          min-height: 34px;
          padding: 0 14px;
        }

        button.danger {
          background: var(--error-color);
        }

        .hint {
          color: var(--secondary-text-color);
          font-size: 12px;
          line-height: 1.4;
        }
      </style>
      <div class="editor">
        <div class="panel">
          <div class="panel-title">
            <strong>General</strong>
          </div>
          <div class="grid">
            <label>
              <span>Titulo</span>
              <input type="text" data-field="title" data-optional="true" value="${escapeHtml(config.title || "")}" />
            </label>
            <label>
              <span>Breakpoint movil</span>
              <input type="number" data-field="layout.mobile_breakpoint" value="${escapeHtml(config.layout.mobile_breakpoint || 1279)}" />
            </label>
            <label>
              <span>Fondo</span>
              <input type="text" data-field="styles.bar.background" value="${escapeHtml(config.styles.bar.background || "")}" />
            </label>
            <label>
              <span>Color activo</span>
              <input type="text" data-field="styles.button.active_color" value="${escapeHtml(config.styles.button.active_color || "")}" />
            </label>
            <label>
              <span>Radio barra</span>
              <input type="text" data-field="styles.bar.border_radius" value="${escapeHtml(config.styles.bar.border_radius || "")}" />
            </label>
            <label>
              <span>Tamano icono</span>
              <input type="text" data-field="styles.button.icon_size" value="${escapeHtml(config.styles.button.icon_size || "")}" />
            </label>
            <label class="checkbox">
              <input type="checkbox" data-field="show_labels" ${config.show_labels ? "checked" : ""} />
              <span>Mostrar etiquetas</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" data-field="layout.fixed" ${config.layout.fixed ? "checked" : ""} />
              <span>Fijar a pantalla</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" data-field="layout.reserve_space" ${config.layout.reserve_space ? "checked" : ""} />
              <span>Reservar espacio</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" data-field="layout.show_desktop" ${config.layout.show_desktop ? "checked" : ""} />
              <span>Mostrar tambien en escritorio</span>
            </label>
          </div>
          <p class="hint">
            Para acciones avanzadas, badges o estilos por ruta, puedes completar el YAML manualmente.
          </p>
        </div>
        <div class="panel">
          <div class="panel-title">
            <strong>Rutas</strong>
            <button type="button" data-editor-action="add-route">Anadir ruta</button>
          </div>
          ${routesMarkup || '<p class="hint">No hay rutas todavia.</p>'}
        </div>
      </div>
    `;

    const prefixCheckboxes = this.shadowRoot.querySelectorAll("input[data-match-toggle]");
    prefixCheckboxes.forEach(checkbox => {
      checkbox.addEventListener("change", inputEvent => {
        const nextConfig = deepClone(this._config);
        const routeIndex = Number(inputEvent.currentTarget.dataset.routeIndex);
        const route = nextConfig.routes[routeIndex];

        if (!route) {
          return;
        }

        if (inputEvent.currentTarget.checked) {
          route.match = "prefix";
        } else {
          delete route.match;
        }

        this._emitConfig(nextConfig);
      });
    });
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, NodaliaNavigationBarCard);
}

if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, NodaliaNavigationBarEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Nodalia Navigation Bar",
  description: "Barra de navegacion fija y configurable para Home Assistant.",
  preview: true,
});

console.info(
  `%c ${CARD_TAG} %c v${CARD_VERSION} `,
  "background:#2f4858;color:#fff;padding:4px 8px;border-radius:999px 0 0 999px;font-weight:700;",
  "background:#4f7c82;color:#fff;padding:4px 8px;border-radius:0 999px 999px 0;font-weight:700;",
);
