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
    stack_gap: "12px",
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
      size: "54px",
      border_radius: "999px",
      background: "rgba(255, 255, 255, 0.05)",
      color: "var(--primary-text-color)",
      active_color: "var(--primary-text-color)",
      active_background: "rgba(255, 255, 255, 0.08)",
      icon_size: "28px",
      icon_offset_x: "0px",
      icon_offset_y: "-1px",
      label_color: "var(--secondary-text-color)",
      active_label_color: "var(--primary-text-color)",
      label_size: "12px",
      label_gap: "6px",
    },
    badge: {
      background: "var(--error-color)",
      color: "var(--text-primary-color, #fff)",
      min_size: "18px",
      font_size: "11px",
    },
    popup: {
      background: "var(--ha-card-background)",
      border: "1px solid var(--divider-color)",
      border_radius: "24px",
      box_shadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
      layout: "auto",
      padding: "12px",
      min_width: "220px",
      max_width: "380px",
      item_gap: "12px",
      item_size: "48px",
      backdrop: "rgba(0, 0, 0, 0.18)",
    },
    media_player: {
      background: "var(--ha-card-background)",
      border: "1px solid var(--divider-color)",
      border_radius: "28px",
      box_shadow: "var(--ha-card-box-shadow)",
      padding: "14px",
      min_height: "104px",
      artwork_size: "64px",
      control_size: "40px",
      title_size: "14px",
      subtitle_size: "12px",
      progress_color: "var(--primary-color)",
      progress_background: "rgba(var(--rgb-primary-color), 0.14)",
      overlay_color: "rgba(0, 0, 0, 0.32)",
      dot_size: "8px",
    },
  },
  media_player: {
    show: undefined,
    show_desktop: false,
    album_cover_background: true,
    reserve_height: "116px",
    players: [],
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

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function parsePrimitiveValue(value) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function escapeSelectorValue(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(String(value));
  }

  return String(value).replaceAll('"', '\\"');
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
    this._popupState = null;
    this._popupPositionFrame = null;
    this._activeMediaPlayerIndex = 0;
    this._onResize = () => {
      this._closePopup(false);
      this._render();
    };
    this._onLocationChange = () => {
      this._closePopup(false);
      this._render();
    };
    this._onWindowKeyDown = event => {
      if (event.key === "Escape" && this._popupState) {
        event.preventDefault();
        this._closePopup();
      }
    };
    this._onShadowClick = this._onShadowClick.bind(this);
    this.shadowRoot.addEventListener("click", this._onShadowClick);
  }

  connectedCallback() {
    window.addEventListener("resize", this._onResize);
    window.addEventListener("popstate", this._onLocationChange);
    window.addEventListener("location-changed", this._onLocationChange);
    window.addEventListener("keydown", this._onWindowKeyDown);
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("popstate", this._onLocationChange);
    window.removeEventListener("location-changed", this._onLocationChange);
    window.removeEventListener("keydown", this._onWindowKeyDown);
    if (this._popupPositionFrame) {
      cancelAnimationFrame(this._popupPositionFrame);
      this._popupPositionFrame = null;
    }
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
    const popupCloseTrigger = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.popupClose === "true");

    if (popupCloseTrigger) {
      event.preventDefault();
      event.stopPropagation();
      this._closePopup();
      return;
    }

    const mediaControlButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.mediaControl);

    if (mediaControlButton) {
      event.preventDefault();
      event.stopPropagation();
      this._handleMediaControl(
        mediaControlButton.dataset.mediaControl,
        mediaControlButton.dataset.entity,
      );
      return;
    }

    const mediaDotButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.mediaIndex !== undefined);

    if (mediaDotButton) {
      event.preventDefault();
      event.stopPropagation();
      this._activeMediaPlayerIndex = Number(mediaDotButton.dataset.mediaIndex);
      this._render();
      return;
    }

    const mediaCard = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.mediaCardIndex !== undefined);

    if (mediaCard) {
      const visiblePlayers = this._getVisibleMediaPlayers();
      const player = visiblePlayers[Number(mediaCard.dataset.mediaCardIndex)];

      if (player) {
        event.preventDefault();
        event.stopPropagation();
        this._runAction(player, {
          closePopup: false,
          defaultAction: {
            action: "more-info",
            entity: player.entity,
          },
        });
      }
      return;
    }

    const popupButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.popupItemIndex !== undefined);

    if (popupButton) {
      const routeIndex = Number(popupButton.dataset.popupRouteIndex);
      const popupItemIndex = Number(popupButton.dataset.popupItemIndex);
      const route = this._renderedRoutes[routeIndex];
      const popupItems = this._getPopupItems(route);
      const popupItem = popupItems[popupItemIndex];

      if (popupItem) {
        event.preventDefault();
        event.stopPropagation();
        this._runAction(popupItem, {
          closePopup: true,
        });
      }
      return;
    }

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
    this._runAction(route, {
      anchorElement: routeButton,
    });
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

  _isItemVisible(item) {
    if (!item || item.hidden === true || item.show === false) {
      return false;
    }

    if (this._isInEditMode()) {
      return true;
    }

    const currentUserId = this._hass?.user?.id;
    if (Array.isArray(item.users) && item.users.length > 0) {
      return item.users.includes(currentUserId);
    }

    return true;
  }

  _getVisibleRoutes() {
    if (!this._config) {
      return [];
    }

    return this._config.routes.filter(route => this._isItemVisible(route));
  }

  _getPopupItems(route) {
    if (!route || !Array.isArray(route.popup)) {
      return [];
    }

    return route.popup.filter(item => this._isItemVisible(item));
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

  _isNavItemActive(item, currentPath) {
    if (!item) {
      return false;
    }

    if (item.selected === true) {
      return true;
    }

    const candidates = [];
    const mainPath = normalizePath(this._getRoutePath(item));
    if (mainPath) {
      candidates.push(mainPath);
    }

    if (Array.isArray(item.active_paths)) {
      item.active_paths.forEach(path => {
        const normalized = normalizePath(path);
        if (normalized) {
          candidates.push(normalized);
        }
      });
    }

    return candidates.some(path => matchPath(currentPath, path, item.match || "exact"));
  }

  _isRouteActive(route, currentPath) {
    if (this._isNavItemActive(route, currentPath)) {
      return true;
    }

    return this._getPopupItems(route).some(item => this._isNavItemActive(item, currentPath));
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

  _getRouteLabel(route) {
    return route?.label || route?.name || route?.title || "";
  }

  _shouldShowRouteLabels(routes) {
    if (!this._config?.show_labels) {
      return false;
    }

    return routes.some(route => Boolean(this._getRouteLabel(route)));
  }

  _getPopupLayout(route) {
    const layout = route?.popup_layout || this._config?.styles?.popup?.layout || "auto";
    return ["auto", "vertical", "horizontal"].includes(layout) ? layout : "auto";
  }

  _getPopupMetrics(route, items) {
    const popupStyles = this._config?.styles?.popup || {};
    const popupMinWidth = Number.parseFloat(popupStyles.min_width || "220") || 220;
    const popupMaxWidth =
      Number.parseFloat(popupStyles.max_width || popupStyles.min_width || "380") ||
      Math.max(popupMinWidth, 380);
    const itemSize = Number.parseFloat(popupStyles.item_size || "48") || 48;
    const itemGap = Number.parseFloat(popupStyles.item_gap || "12") || 12;
    const panelPadding = Number.parseFloat(popupStyles.padding || "12") || 12;
    const viewportWidth = Math.max(240, (window.innerWidth || popupMaxWidth) - 24);
    const maxWidth = Math.max(Math.min(popupMaxWidth, viewportWidth), Math.min(popupMinWidth, viewportWidth));
    const minWidth = Math.min(popupMinWidth, maxWidth);
    const hasText = items.some(item => Boolean(this._getRouteLabel(item) || item.description));
    const itemMinWidth = itemSize + (hasText ? 42 : 20);
    const maxColumnsThatFit = Math.max(
      1,
      Math.min(
        items.length || 1,
        Math.floor((maxWidth - panelPadding * 2 + itemGap) / (itemMinWidth + itemGap)),
      ),
    );

    let columns = 1;
    const layout = this._getPopupLayout(route);
    if (layout === "horizontal") {
      columns = maxColumnsThatFit;
    } else if (layout === "auto") {
      columns = items.length <= 2 ? 1 : maxColumnsThatFit;
    }

    columns = Math.max(1, Math.min(columns, items.length || 1));

    const rows = Math.max(1, Math.ceil((items.length || 1) / columns));
    const widthFromColumns =
      columns * itemMinWidth + Math.max(0, columns - 1) * itemGap + panelPadding * 2;
    const width = clamp(widthFromColumns, minWidth, maxWidth);
    const rowHeight = itemSize + (hasText ? 56 : 26);
    const viewportHeight = Math.max(160, (window.innerHeight || 320) - 48);
    const estimatedHeight = Math.min(
      Math.max(120, rows * rowHeight + panelPadding * 2),
      viewportHeight,
    );

    return {
      columns,
      estimatedHeight,
      itemMinWidth,
      layout,
      width,
    };
  }

  _renderIcon(route, isActive) {
    const image = isActive ? route.image_active || route.image : route.image || route.image_active;

    if (image) {
      return `<img class="nav-image" src="${escapeHtml(image)}" alt="${escapeHtml(this._getRouteLabel(route) || "navigation item")}" />`;
    }

    const icon = isActive ? route.icon_active || route.icon : route.icon || route.icon_active;
    if (!icon) {
      return `<span class="nav-icon nav-icon--placeholder"></span>`;
    }

    return `<ha-icon class="nav-icon" icon="${escapeHtml(icon)}"></ha-icon>`;
  }

  _getRouteAction(route, defaultAction = null) {
    if (!route) {
      return defaultAction;
    }

    if (route.tap_action) {
      return route.tap_action;
    }

    if (Array.isArray(route.popup) && route.popup.length > 0) {
      return {
        action: "open-popup",
      };
    }

    if (route.path) {
      return {
        action: "navigate",
        navigation_path: route.path,
      };
    }

    return defaultAction;
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

  _closePopup(shouldRender = true) {
    if (!this._popupState) {
      return;
    }

    if (this._popupPositionFrame) {
      cancelAnimationFrame(this._popupPositionFrame);
      this._popupPositionFrame = null;
    }

    this._popupState = null;
    if (shouldRender) {
      this._render();
    }
  }

  _schedulePopupPositionSync() {
    if (!this._popupState || !this.shadowRoot) {
      return;
    }

    if (this._popupPositionFrame) {
      cancelAnimationFrame(this._popupPositionFrame);
    }

    this._popupPositionFrame = requestAnimationFrame(() => {
      this._popupPositionFrame = null;
      this._syncPopupPosition();
    });
  }

  _syncPopupPosition() {
    if (!this._popupState || !this.shadowRoot) {
      return;
    }

    const panel = this.shadowRoot.querySelector(".popup-panel");
    const anchor = this.shadowRoot.querySelector(
      `[data-route-index="${escapeSelectorValue(this._popupState.routeIndex)}"]`,
    );

    if (!(panel instanceof HTMLElement) || !(anchor instanceof HTMLElement)) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const preferredGap = this._popupState.layout === "horizontal" ? 4 : 6;
    const previousDirection = this._popupState.direction;
    let direction = previousDirection;
    let left = anchorRect.left + anchorRect.width / 2 - panelRect.width / 2;

    left = clamp(left, 12, Math.max(12, window.innerWidth - panelRect.width - 12));

    let top = direction === "up"
      ? anchorRect.top - panelRect.height - preferredGap
      : anchorRect.bottom + preferredGap;

    if (direction === "up" && top < 12) {
      direction = "down";
      top = anchorRect.bottom + preferredGap;
    }

    if (direction === "down" && top + panelRect.height > window.innerHeight - 12) {
      direction = "up";
      top = anchorRect.top - panelRect.height - preferredGap;
    }

    top = clamp(top, 12, Math.max(12, window.innerHeight - panelRect.height - 12));

    const nextLeft = `${left}px`;
    const nextTop = `${top}px`;

    this._popupState = {
      ...this._popupState,
      direction,
      left: nextLeft,
      top: nextTop,
      width: `${panelRect.width}px`,
    };

    if (direction !== previousDirection) {
      this._render();
      return;
    }

    panel.style.left = nextLeft;
    panel.style.top = nextTop;
  }

  _openPopup(route, anchorElement) {
    const items = this._getPopupItems(route);
    if (!items.length || !anchorElement) {
      return;
    }

    const anchorRect = anchorElement.getBoundingClientRect();
    const popupMetrics = this._getPopupMetrics(route, items);
    const popupWidth = popupMetrics.width;
    const estimatedHeight = popupMetrics.estimatedHeight;
    const preferredGap = popupMetrics.layout === "horizontal" ? 4 : 6;
    let direction = this._config.layout.position === "top" ? "down" : "up";
    let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;

    left = clamp(left, 12, window.innerWidth - popupWidth - 12);

    let top = direction === "up"
      ? anchorRect.top - estimatedHeight - preferredGap
      : anchorRect.bottom + preferredGap;

    if (direction === "up" && top < 12) {
      direction = "down";
      top = anchorRect.bottom + preferredGap;
    }

    if (direction === "down" && top + estimatedHeight > window.innerHeight - 12) {
      direction = "up";
      top = anchorRect.top - estimatedHeight - preferredGap;
    }

    top = clamp(top, 12, Math.max(12, window.innerHeight - estimatedHeight - 12));

    const routeIndex = this._renderedRoutes.indexOf(route);
    if (routeIndex < 0) {
      return;
    }

    this._popupState = {
      columns: popupMetrics.columns,
      direction,
      itemMinWidth: `${popupMetrics.itemMinWidth}px`,
      layout: popupMetrics.layout,
      left: `${left}px`,
      top: `${top}px`,
      route,
      routeIndex,
      width: `${popupWidth}px`,
    };
    this._render();
  }

  _getReservedHeight(showMediaPlayer) {
    const baseHeight = this._config.layout.reserve_height;
    if (!showMediaPlayer) {
      return baseHeight;
    }

    const mediaHeight =
      this._config.media_player.reserve_height ||
      this._config.styles.media_player.min_height;

    return `calc(${baseHeight} + ${this._config.layout.stack_gap} + ${mediaHeight})`;
  }

  _shouldShowMediaPlayerOnCurrentScreen() {
    if (this._isInEditMode()) {
      return true;
    }

    const isDesktop = window.innerWidth > Number(this._config.layout.mobile_breakpoint || 1279);
    return !isDesktop || this._config.media_player.show_desktop;
  }

  _getVisibleMediaPlayers() {
    if (!this._config?.media_player || !Array.isArray(this._config.media_player.players)) {
      return [];
    }

    if (this._config.media_player.show === false) {
      return [];
    }

    if (!this._shouldShowMediaPlayerOnCurrentScreen()) {
      return [];
    }

    return this._config.media_player.players.filter(player => {
      if (!player || !player.entity) {
        return false;
      }

      if (player.show === false) {
        return false;
      }

      const state = this._hass?.states?.[player.entity];
      if (!state) {
        return false;
      }

      if (this._config.media_player.show === true || player.show === true || this._isInEditMode()) {
        return true;
      }

      const visibleStates = Array.isArray(player.show_states) && player.show_states.length > 0
        ? player.show_states
        : ["playing", "paused"];

      return visibleStates.includes(state.state);
    });
  }

  _getMediaPlayerTitle(player, state) {
    if (player.title) {
      return player.title;
    }

    return state.attributes.media_title || state.attributes.friendly_name || player.entity;
  }

  _getMediaPlayerSubtitle(player, state) {
    if (player.subtitle) {
      return player.subtitle;
    }

    return state.attributes.media_artist || state.attributes.app_name || state.state;
  }

  _getMediaPlayerArtwork(player, state) {
    return player.image || state.attributes.entity_picture || null;
  }

  _handleMediaControl(control, entityId) {
    if (!this._hass || !entityId) {
      return;
    }

    switch (control) {
      case "previous":
        this._hass.callService("media_player", "media_previous_track", { entity_id: entityId });
        break;
      case "next":
        this._hass.callService("media_player", "media_next_track", { entity_id: entityId });
        break;
      case "play-pause":
        this._hass.callService("media_player", "media_play_pause", { entity_id: entityId });
        break;
      default:
        break;
    }
  }

  _runAction(route, options = {}) {
    const action = this._getRouteAction(route, options.defaultAction || null);

    if (!action || action.action === "none") {
      return;
    }

    switch (action.action) {
      case "navigate":
        this._navigate(action.navigation_path || route.path);
        break;
      case "open-popup":
        this._openPopup(route, options.anchorElement);
        return;
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

    if (options.closePopup) {
      this._closePopup();
    }
  }

  _renderPopup(currentPath) {
    if (!this._popupState?.route) {
      return "";
    }

    if (this._popupState.routeIndex < 0 || !this._renderedRoutes[this._popupState.routeIndex]) {
      this._popupState = null;
      return "";
    }

    const popupItems = this._getPopupItems(this._popupState.route);
    if (!popupItems.length) {
      this._popupState = null;
      return "";
    }

    const popupMarkup = popupItems
      .map((item, popupIndex) => {
        const isActive = this._isNavItemActive(item, currentPath);
        const badge = this._getBadge(item);
        const label = this._getRouteLabel(item);
        const hasLabel = Boolean(label);
        const hasDescription = Boolean(item.description);
        const isIconOnly = !hasLabel && !hasDescription;
        const ariaLabel = label || item.description || item.path || `Popup ${popupIndex + 1}`;
        const itemStyle = [
          item.background ? `--popup-route-background:${item.background};` : "",
          item.color ? `--popup-route-color:${item.color};` : "",
          item.active_color ? `--popup-route-active-color:${item.active_color};` : "",
          item.active_background ? `--popup-route-active-background:${item.active_background};` : "",
        ]
          .filter(Boolean)
          .join("");

        return `
          <button
            class="popup-item ${isActive ? "active" : ""} ${isIconOnly ? "icon-only" : ""}"
            type="button"
            data-popup-route-index="${this._popupState.routeIndex}"
            data-popup-item-index="${popupIndex}"
            style="${itemStyle}"
            aria-label="${escapeHtml(ariaLabel)}"
          >
            <span class="popup-item__icon-wrap">
              ${this._renderIcon(item, isActive)}
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
              hasLabel || hasDescription
                ? `
                  <span class="popup-item__content">
                    ${
                      hasLabel
                        ? `<span class="popup-item__label">${escapeHtml(label)}</span>`
                        : ""
                    }
                    ${
                      hasDescription
                        ? `<span class="popup-item__description">${escapeHtml(item.description)}</span>`
                        : ""
                    }
                  </span>
                `
                : ""
            }
          </button>
        `;
      })
      .join("");

    return `
      <div class="popup-backdrop" data-popup-close="true"></div>
      <div
        class="popup-panel popup-panel--${this._popupState.direction} popup-panel--layout-${this._popupState.layout || "auto"}"
        style="left:${this._popupState.left};top:${this._popupState.top};width:${this._popupState.width};--popup-columns:${this._popupState.columns || 1};--popup-item-min:${this._popupState.itemMinWidth || `calc(${this._config.styles.popup.item_size} + 24px)`};"
      >
        <div class="popup-items">
          ${popupMarkup}
        </div>
      </div>
    `;
  }

  _renderMediaPlayer(visiblePlayers) {
    if (!visiblePlayers.length) {
      return "";
    }

    this._activeMediaPlayerIndex = clamp(
      this._activeMediaPlayerIndex,
      0,
      visiblePlayers.length - 1,
    );

    const player = visiblePlayers[this._activeMediaPlayerIndex];
    const state = this._hass?.states?.[player.entity];

    if (!state) {
      return "";
    }

    const artwork = this._getMediaPlayerArtwork(player, state);
    const title = this._getMediaPlayerTitle(player, state);
    const subtitle = this._getMediaPlayerSubtitle(player, state);
    const duration = Number(state.attributes.media_duration || 0);
    const position = Number(state.attributes.media_position || 0);
    const progress = duration > 0 ? clamp((position / duration) * 100, 0, 100) : null;
    const albumCoverBackground = this._config.media_player.album_cover_background && artwork;
    const dotsMarkup =
      visiblePlayers.length > 1
        ? `
          <div class="media-player__dots" aria-label="Media players">
            ${visiblePlayers
              .map(
                (_item, index) => `
                  <button
                    type="button"
                    class="media-player__dot ${index === this._activeMediaPlayerIndex ? "active" : ""}"
                    data-media-index="${index}"
                    aria-label="Seleccionar reproductor ${index + 1}"
                  ></button>
                `,
              )
              .join("")}
          </div>
        `
        : "";

    return `
      <div
        class="media-player-card ${albumCoverBackground ? "has-album-background" : ""}"
        data-media-card-index="${this._activeMediaPlayerIndex}"
      >
        ${
          albumCoverBackground
            ? `<div class="media-player__album-bg" style="background-image:url('${escapeHtml(artwork)}');"></div>`
            : ""
        }
        ${
          progress !== null
            ? `
              <div class="media-player__progress">
                <span class="media-player__progress-fill" style="width:${progress}%"></span>
              </div>
            `
            : ""
        }
        <div class="media-player__main">
          <div class="media-player__artwork">
            ${
              artwork
                ? `<img src="${escapeHtml(artwork)}" alt="${escapeHtml(title)}" />`
                : `<ha-icon icon="${escapeHtml(player.icon || "mdi:music")}"></ha-icon>`
            }
          </div>
          <div class="media-player__meta">
            <div class="media-player__title">${escapeHtml(title)}</div>
            <div class="media-player__subtitle">${escapeHtml(subtitle)}</div>
          </div>
          <div class="media-player__controls">
            <button
              type="button"
              class="media-player__control"
              data-media-control="previous"
              data-entity="${escapeHtml(player.entity)}"
              aria-label="Anterior"
            >
              <ha-icon icon="mdi:skip-previous"></ha-icon>
            </button>
            <button
              type="button"
              class="media-player__control media-player__control--primary"
              data-media-control="play-pause"
              data-entity="${escapeHtml(player.entity)}"
              aria-label="Play o pausa"
            >
              <ha-icon icon="${escapeHtml(state.state === "playing" ? "mdi:pause" : "mdi:play")}"></ha-icon>
            </button>
            <button
              type="button"
              class="media-player__control"
              data-media-control="next"
              data-entity="${escapeHtml(player.entity)}"
              aria-label="Siguiente"
            >
              <ha-icon icon="mdi:skip-next"></ha-icon>
            </button>
          </div>
        </div>
        ${dotsMarkup}
      </div>
    `;
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
    const showRouteLabels = this._shouldShowRouteLabels(visibleRoutes);
    const visiblePlayers = this._getVisibleMediaPlayers();
    const currentPath = normalizePath(window.location.pathname) || "/";
    const isFixed = config.layout.fixed && !inEditMode;
    const spacerHeight = isFixed && config.layout.reserve_space
      ? this._getReservedHeight(visiblePlayers.length > 0)
      : "0px";
    const titleMarkup = config.title
      ? `<div class="navbar-title">${escapeHtml(config.title)}</div>`
      : "";

    this._renderedRoutes = visibleRoutes;

    const mediaPlayerMarkup = this._renderMediaPlayer(visiblePlayers);
    const popupMarkup = this._renderPopup(currentPath);

    const routesMarkup =
      visibleRoutes.length > 0
        ? visibleRoutes
            .map((route, index) => {
              const isActive = this._isRouteActive(route, currentPath);
              const badge = this._getBadge(route);
              const label = this._getRouteLabel(route);
              const routeStyle = [
                route.background ? `--route-background:${route.background};` : "",
                route.color ? `--route-color:${route.color};` : "",
                route.active_color ? `--route-active-color:${route.active_color};` : "",
                route.active_background ? `--route-active-background:${route.active_background};` : "",
              ]
                .filter(Boolean)
                .join("");
              const hasPopup = this._getPopupItems(route).length > 0;

              return `
                <button
                  class="nav-item ${isActive ? "active" : ""} ${hasPopup ? "has-popup" : ""}"
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
                    showRouteLabels
                      ? label
                        ? `<span class="nav-label">${escapeHtml(label)}</span>`
                        : '<span class="nav-label nav-label--placeholder" aria-hidden="true">&nbsp;</span>'
                      : ""
                  }
                  ${
                    hasPopup
                      ? `<span class="nav-popup-indicator" aria-hidden="true"></span>`
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

        .dock-stack {
          display: grid;
          gap: ${config.layout.stack_gap};
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
          flex-wrap: nowrap;
          width: 100%;
        }

        .nav-item {
          --route-background: ${config.styles.button.background};
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
          flex: ${showRouteLabels ? "1 1 0" : "0 0 auto"};
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: ${showRouteLabels ? config.styles.button.label_gap : "0px"};
          min-width: ${showRouteLabels ? "0" : config.styles.button.size};
          min-height: ${config.styles.button.size};
          padding: 0;
          position: relative;
          width: ${showRouteLabels ? "auto" : config.styles.button.size};
          transition: background 160ms ease, color 160ms ease;
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
          background: var(--route-background);
          width: ${config.styles.button.size};
          height: ${config.styles.button.size};
          border-radius: ${config.styles.button.border_radius};
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          position: relative;
          transition: background 160ms ease, box-shadow 160ms ease;
        }

        .nav-icon,
        .nav-image {
          display: block;
          flex: 0 0 auto;
          left: 50%;
          position: absolute;
          top: 50%;
          transform: translate(
            calc(-50% + ${config.styles.button.icon_offset_x}),
            calc(-50% + ${config.styles.button.icon_offset_y})
          );
          width: ${config.styles.button.icon_size};
          height: ${config.styles.button.icon_size};
        }

        .nav-icon {
          --mdc-icon-size: ${config.styles.button.icon_size};
          align-items: center;
          display: inline-flex;
          font-size: ${config.styles.button.icon_size};
          justify-content: center;
          line-height: 1;
          margin: 0;
          padding: 0;
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
          display: block;
          font-size: ${config.styles.button.label_size};
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-label--placeholder {
          visibility: hidden;
        }

        .nav-item.active .nav-label {
          color: ${config.styles.button.active_label_color};
        }

        .nav-popup-indicator {
          background: currentColor;
          border-radius: 999px;
          bottom: 2px;
          height: 4px;
          opacity: 0.75;
          position: absolute;
          width: 4px;
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

        .popup-backdrop {
          background: ${config.styles.popup.backdrop};
          inset: 0;
          position: fixed;
          z-index: ${Number(config.layout.z_index) + 1};
        }

        .popup-panel {
          background: ${config.styles.popup.background};
          border: ${config.styles.popup.border};
          border-radius: ${config.styles.popup.border_radius};
          box-shadow: ${config.styles.bar.box_shadow}, ${config.styles.popup.box_shadow};
          --popup-columns: 1;
          --popup-item-min: calc(${config.styles.popup.item_size} + 24px);
          max-height: calc(100vh - 24px);
          min-width: min(${config.styles.popup.min_width}, calc(100vw - 24px));
          overflow: auto;
          padding: ${config.styles.popup.padding};
          position: fixed;
          transform-origin: center bottom;
          width: min(${config.styles.popup.max_width}, calc(100vw - 24px));
          z-index: ${Number(config.layout.z_index) + 2};
        }

        .popup-panel--down {
          transform-origin: center top;
        }

        .popup-items {
          align-items: stretch;
          display: grid;
          gap: ${config.styles.popup.item_gap};
          grid-template-columns: repeat(var(--popup-columns), minmax(0, 1fr));
          justify-items: stretch;
        }

        .popup-panel--layout-vertical .popup-items {
          grid-template-columns: 1fr;
        }

        .popup-panel--layout-horizontal .popup-items,
        .popup-panel--layout-auto .popup-items {
          grid-template-columns: repeat(var(--popup-columns), minmax(var(--popup-item-min), 1fr));
        }

        .popup-item {
          --popup-route-background: ${config.styles.button.background};
          --popup-route-color: ${config.styles.button.color};
          --popup-route-active-color: ${config.styles.button.active_color};
          --popup-route-active-background: ${config.styles.button.active_background};
          appearance: none;
          align-items: center;
          background: rgba(255, 255, 255, 0.015);
          border: 0;
          border-radius: 20px;
          color: var(--popup-route-color);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
          min-height: calc(${config.styles.popup.item_size} + 36px);
          padding: 10px 8px;
          text-align: center;
          transition: background 160ms ease, transform 160ms ease;
          width: 100%;
        }

        .popup-item.icon-only {
          min-height: calc(${config.styles.popup.item_size} + 18px);
        }

        .popup-item:hover {
          background: rgba(var(--rgb-primary-color), 0.08);
          transform: translateY(-1px);
        }

        .popup-item.active {
          background: rgba(var(--rgb-primary-color), 0.12);
          color: var(--popup-route-active-color);
        }

        .popup-item__icon-wrap {
          align-items: center;
          background: var(--popup-route-background);
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: ${config.styles.button.border_radius};
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.03),
            0 8px 18px rgba(0, 0, 0, 0.12);
          display: flex;
          height: ${config.styles.popup.item_size};
          justify-content: center;
          line-height: 0;
          position: relative;
          width: ${config.styles.popup.item_size};
        }

        .popup-item.active .popup-item__icon-wrap {
          background: var(--popup-route-active-background);
        }

        .popup-panel--layout-horizontal .popup-item.icon-only,
        .popup-panel--layout-auto .popup-item.icon-only {
          background: transparent;
          min-height: auto;
          padding: 2px 0;
        }

        .popup-panel--layout-horizontal .popup-item.icon-only:hover,
        .popup-panel--layout-auto .popup-item.icon-only:hover,
        .popup-panel--layout-horizontal .popup-item.icon-only.active,
        .popup-panel--layout-auto .popup-item.icon-only.active {
          background: transparent;
        }

        .popup-panel--layout-vertical .popup-item {
          min-height: calc(${config.styles.popup.item_size} + 24px);
        }

        .popup-item__content {
          display: grid;
          gap: 4px;
          justify-items: center;
          min-width: 0;
          width: 100%;
        }

        .popup-item__label {
          color: inherit;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          white-space: normal;
        }

        .popup-item__description {
          color: var(--secondary-text-color);
          font-size: 12px;
          line-height: 1.2;
          max-width: 100%;
          text-align: center;
          white-space: normal;
        }

        .media-player-card {
          background: ${config.styles.media_player.background};
          border: ${config.styles.media_player.border};
          border-radius: ${config.styles.media_player.border_radius};
          box-shadow: ${config.styles.media_player.box_shadow};
          cursor: pointer;
          min-height: ${config.styles.media_player.min_height};
          overflow: hidden;
          padding: ${config.styles.media_player.padding};
          position: relative;
        }

        .media-player-card.has-album-background::after {
          background: linear-gradient(
            135deg,
            ${config.styles.media_player.overlay_color},
            rgba(0, 0, 0, 0.08)
          );
          content: "";
          inset: 0;
          position: absolute;
        }

        .media-player__album-bg {
          background-position: center;
          background-size: cover;
          filter: blur(22px);
          inset: -16px;
          opacity: 0.7;
          position: absolute;
          transform: scale(1.08);
        }

        .media-player__progress {
          background: ${config.styles.media_player.progress_background};
          border-radius: 999px;
          height: 4px;
          inset-inline: 14px;
          overflow: hidden;
          position: absolute;
          top: 10px;
          z-index: 1;
        }

        .media-player__progress-fill {
          background: ${config.styles.media_player.progress_color};
          display: block;
          height: 100%;
        }

        .media-player__main,
        .media-player__dots {
          position: relative;
          z-index: 1;
        }

        .media-player__main {
          align-items: center;
          display: grid;
          gap: 12px;
          grid-template-columns: ${config.styles.media_player.artwork_size} minmax(0, 1fr) auto;
        }

        .media-player__artwork {
          align-items: center;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 22px;
          display: flex;
          height: ${config.styles.media_player.artwork_size};
          justify-content: center;
          overflow: hidden;
          width: ${config.styles.media_player.artwork_size};
        }

        .media-player__artwork img,
        .media-player__artwork ha-icon {
          height: 100%;
          object-fit: cover;
          width: 100%;
        }

        .media-player__artwork ha-icon {
          font-size: calc(${config.styles.media_player.artwork_size} * 0.52);
          padding: 14px;
        }

        .media-player__meta {
          min-width: 0;
        }

        .media-player__title,
        .media-player__subtitle {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .media-player__title {
          color: var(--primary-text-color);
          font-size: ${config.styles.media_player.title_size};
          font-weight: 700;
        }

        .media-player__subtitle {
          color: var(--secondary-text-color);
          font-size: ${config.styles.media_player.subtitle_size};
          margin-top: 4px;
        }

        .media-player__controls {
          align-items: center;
          display: inline-flex;
          gap: 8px;
        }

        .media-player__control {
          align-items: center;
          appearance: none;
          background: rgba(var(--rgb-primary-color), 0.1);
          border: 0;
          border-radius: 999px;
          color: var(--primary-text-color);
          cursor: pointer;
          display: inline-flex;
          height: ${config.styles.media_player.control_size};
          justify-content: center;
          width: ${config.styles.media_player.control_size};
        }

        .media-player__control--primary {
          background: rgba(var(--rgb-primary-color), 0.18);
          color: ${config.styles.button.active_color};
        }

        .media-player__control ha-icon {
          font-size: 22px;
        }

        .media-player__dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 12px;
        }

        .media-player__dot {
          appearance: none;
          background: rgba(var(--rgb-primary-color), 0.18);
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          height: ${config.styles.media_player.dot_size};
          padding: 0;
          width: ${config.styles.media_player.dot_size};
        }

        .media-player__dot.active {
          background: ${config.styles.button.active_color};
          transform: scale(1.1);
        }
      </style>
      <div class="spacer" aria-hidden="true"></div>
      <div class="dock">
        <div class="dock-inner">
          <div class="dock-stack">
            ${mediaPlayerMarkup}
            <ha-card>
              ${titleMarkup}
              <nav class="navbar" aria-label="Navigation bar">
                ${routesMarkup}
              </nav>
            </ha-card>
          </div>
        </div>
      </div>
      ${popupMarkup}
    `;

    if (this._popupState) {
      this._schedulePopupPositionSync();
    }
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

  _prepareEditorConfig(config) {
    if (!Array.isArray(config.routes)) {
      config.routes = [];
    }

    if (!isObject(config.media_player)) {
      config.media_player = {};
    }

    if (!Array.isArray(config.media_player.players)) {
      config.media_player.players = [];
    }

    return config;
  }

  setConfig(config) {
    const nextConfig = deepClone(config || STUB_CONFIG);
    if (!Array.isArray(nextConfig.routes) && Array.isArray(nextConfig.items)) {
      nextConfig.routes = nextConfig.items;
      delete nextConfig.items;
    }
    this._config = this._prepareEditorConfig(nextConfig);
    this._render();
  }

  _captureFocusState() {
    const activeElement = this.shadowRoot?.activeElement;

    if (
      !(
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement
      )
    ) {
      return null;
    }

    const dataset = activeElement.dataset || {};
    let selector = null;

    if (dataset.field) {
      selector = `[data-field="${escapeSelectorValue(dataset.field)}"]`;
    } else if (dataset.playerField && dataset.playerIndex !== undefined) {
      selector =
        `[data-player-index="${escapeSelectorValue(dataset.playerIndex)}"]` +
        `[data-player-field="${escapeSelectorValue(dataset.playerField)}"]`;
    } else if (
      dataset.popupField &&
      dataset.routeIndex !== undefined &&
      dataset.popupIndex !== undefined
    ) {
      selector =
        `[data-route-index="${escapeSelectorValue(dataset.routeIndex)}"]` +
        `[data-popup-index="${escapeSelectorValue(dataset.popupIndex)}"]` +
        `[data-popup-field="${escapeSelectorValue(dataset.popupField)}"]`;
    } else if (dataset.routeField && dataset.routeIndex !== undefined) {
      selector =
        `[data-route-index="${escapeSelectorValue(dataset.routeIndex)}"]` +
        `[data-route-field="${escapeSelectorValue(dataset.routeField)}"]`;
    }

    if (!selector) {
      return null;
    }

    const supportsSelection =
      typeof activeElement.selectionStart === "number" &&
      typeof activeElement.selectionEnd === "number";

    return {
      selector,
      selectionEnd: supportsSelection ? activeElement.selectionEnd : null,
      selectionStart: supportsSelection ? activeElement.selectionStart : null,
      type: activeElement.type,
    };
  }

  _restoreFocusState(focusState) {
    if (!focusState?.selector || !this.shadowRoot) {
      return;
    }

    const target = this.shadowRoot.querySelector(focusState.selector);
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    try {
      target.focus({ preventScroll: true });
    } catch (_error) {
      target.focus();
    }

    const canRestoreSelection =
      focusState.type !== "checkbox" &&
      typeof focusState.selectionStart === "number" &&
      typeof focusState.selectionEnd === "number" &&
      typeof target.setSelectionRange === "function";

    if (!canRestoreSelection) {
      return;
    }

    try {
      target.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
    } catch (_error) {
      // Ignore inputs that do not support selection ranges.
    }
  }

  _emitConfig(nextConfig) {
    const focusState = this._captureFocusState();
    this._config = compactConfig(this._prepareEditorConfig(nextConfig));
    this._render();
    this._restoreFocusState(focusState);
    fireEvent(this, "config-changed", {
      config: this._config,
    });
  }

  _setEditorConfig(nextConfig) {
    this._config = compactConfig(this._prepareEditorConfig(nextConfig));
  }

  _commitEditorConfig(nextConfig, shouldEmit) {
    if (shouldEmit) {
      this._emitConfig(nextConfig);
      return;
    }

    this._setEditorConfig(nextConfig);
  }

  _applyFieldValue(target, key, field) {
    if (!target || !key) {
      return;
    }

    if (field.type === "checkbox" && field.dataset.checkedValue !== undefined) {
      if (field.checked) {
        target[key] = parsePrimitiveValue(field.dataset.checkedValue);
      } else if (field.dataset.uncheckedDelete === "true") {
        delete target[key];
      } else if (field.dataset.uncheckedValue !== undefined) {
        target[key] = parsePrimitiveValue(field.dataset.uncheckedValue);
      } else {
        target[key] = false;
      }
      return;
    }

    if (field.dataset.csv === "true") {
      const values = arrayFromCsv(field.value);
      if (values.length > 0) {
        target[key] = values;
      } else {
        delete target[key];
      }
      return;
    }

    if (field.type === "checkbox") {
      target[key] = field.checked;
      return;
    }

    if (field.value === "" && field.dataset.optional === "true") {
      delete target[key];
      return;
    }

    if (field.type === "number") {
      target[key] = Number(field.value);
      return;
    }

    target[key] = field.value;
  }

  _onShadowInput(event) {
    const shouldEmit = event.type === "change";
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

      this._commitEditorConfig(nextConfig, shouldEmit);
      return;
    }

    const playerField = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.playerField);

    if (playerField) {
      const nextConfig = deepClone(this._config);
      this._prepareEditorConfig(nextConfig);
      const playerIndex = Number(playerField.dataset.playerIndex);
      const player = nextConfig.media_player.players[playerIndex];

      if (!player) {
        return;
      }

      this._applyFieldValue(player, playerField.dataset.playerField, playerField);
      this._commitEditorConfig(nextConfig, shouldEmit);
      return;
    }

    const routeField = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.routeField);

    if (routeField) {
      const routeIndex = Number(routeField.dataset.routeIndex);
      const nextConfig = deepClone(this._config);
      this._prepareEditorConfig(nextConfig);
      const route = nextConfig.routes[routeIndex];

      if (!route) {
        return;
      }

      this._applyFieldValue(route, routeField.dataset.routeField, routeField);
      this._commitEditorConfig(nextConfig, shouldEmit);
      return;
    }

    const popupField = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.popupField);

    if (!popupField) {
      return;
    }

    const nextConfig = deepClone(this._config);
    this._prepareEditorConfig(nextConfig);
    const routeIndex = Number(popupField.dataset.routeIndex);
    const popupIndex = Number(popupField.dataset.popupIndex);
    const route = nextConfig.routes[routeIndex];

    if (!route || !Array.isArray(route.popup)) {
      return;
    }

    const popupItem = route.popup[popupIndex];
    if (!popupItem) {
      return;
    }

    this._applyFieldValue(popupItem, popupField.dataset.popupField, popupField);
    this._commitEditorConfig(nextConfig, shouldEmit);
  }

  _onShadowClick(event) {
    const actionButton = event
      .composedPath()
      .find(node => node instanceof HTMLElement && node.dataset?.editorAction);

    if (!actionButton) {
      return;
    }

    const nextConfig = deepClone(this._config);
    this._prepareEditorConfig(nextConfig);

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
      return;
    }

    if (actionButton.dataset.editorAction === "add-popup-item") {
      const routeIndex = Number(actionButton.dataset.routeIndex);
      const route = nextConfig.routes[routeIndex];

      if (!route) {
        return;
      }

      if (!Array.isArray(route.popup)) {
        route.popup = [];
      }

      route.popup.push({
        icon: "mdi:dots-circle",
        path: "/lovelace/nueva-ruta",
      });
      this._emitConfig(nextConfig);
      return;
    }

    if (actionButton.dataset.editorAction === "remove-popup-item") {
      const routeIndex = Number(actionButton.dataset.routeIndex);
      const popupIndex = Number(actionButton.dataset.popupIndex);
      const route = nextConfig.routes[routeIndex];

      if (!route || !Array.isArray(route.popup)) {
        return;
      }

      route.popup.splice(popupIndex, 1);
      if (route.popup.length === 0) {
        delete route.popup;
      }
      this._emitConfig(nextConfig);
      return;
    }

    if (actionButton.dataset.editorAction === "add-player") {
      nextConfig.media_player.players.push({
        entity: "media_player.nuevo",
      });
      this._emitConfig(nextConfig);
      return;
    }

    if (actionButton.dataset.editorAction === "remove-player") {
      const playerIndex = Number(actionButton.dataset.playerIndex);
      nextConfig.media_player.players.splice(playerIndex, 1);
      this._emitConfig(nextConfig);
    }
  }

  _renderPopupItem(routeIndex, popupItem, popupIndex) {
    return `
      <div class="sub-card">
        <div class="route-head route-head--sub">
          <strong>Popup ${popupIndex + 1}</strong>
          <button
            type="button"
            class="danger"
            data-editor-action="remove-popup-item"
            data-route-index="${routeIndex}"
            data-popup-index="${popupIndex}"
          >
            Eliminar
          </button>
        </div>
        <div class="grid">
          <label>
            <span>Etiqueta opcional</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="label"
              data-optional="true"
              value="${escapeHtml(popupItem.label || "")}"
              placeholder="Dejalo vacio para solo icono"
            />
          </label>
          <label>
            <span>Icono</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="icon"
              value="${escapeHtml(popupItem.icon || "")}"
            />
          </label>
          <label>
            <span>Path</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="path"
              value="${escapeHtml(popupItem.path || "")}"
            />
          </label>
          <label>
            <span>Descripcion</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="description"
              data-optional="true"
              value="${escapeHtml(popupItem.description || "")}"
            />
          </label>
          <label>
            <span>Usuarios</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="users"
              data-csv="true"
              data-optional="true"
              value="${escapeHtml((popupItem.users || []).join(", "))}"
              placeholder="id1, id2"
            />
          </label>
          <label>
            <span>Paths activos</span>
            <input
              type="text"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="active_paths"
              data-csv="true"
              data-optional="true"
              value="${escapeHtml((popupItem.active_paths || []).join(", "))}"
              placeholder="/lovelace/seguridad/camaras"
            />
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              data-route-index="${routeIndex}"
              data-popup-index="${popupIndex}"
              data-popup-field="match"
              data-checked-value="prefix"
              data-unchecked-delete="true"
              ${popupItem.match === "prefix" ? "checked" : ""}
            />
            <span>Activa por prefijo</span>
          </label>
        </div>
      </div>
    `;
  }

  _renderMediaPlayerPlayer(player, index) {
    return `
      <div class="route-card">
        <div class="route-head">
          <strong>Player ${index + 1}</strong>
          <button type="button" class="danger" data-editor-action="remove-player" data-player-index="${index}">
            Eliminar
          </button>
        </div>
        <div class="grid">
          <label>
            <span>Entidad</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="entity"
              value="${escapeHtml(player.entity || "")}"
              placeholder="media_player.spotify"
            />
          </label>
          <label>
            <span>Titulo</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="title"
              data-optional="true"
              value="${escapeHtml(player.title || "")}"
            />
          </label>
          <label>
            <span>Subtitulo</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="subtitle"
              data-optional="true"
              value="${escapeHtml(player.subtitle || "")}"
            />
          </label>
          <label>
            <span>Icono fallback</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="icon"
              data-optional="true"
              value="${escapeHtml(player.icon || "")}"
              placeholder="mdi:speaker"
            />
          </label>
          <label>
            <span>Imagen fija</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="image"
              data-optional="true"
              value="${escapeHtml(player.image || "")}"
            />
          </label>
          <label>
            <span>Estados visibles</span>
            <input
              type="text"
              data-player-index="${index}"
              data-player-field="show_states"
              data-csv="true"
              data-optional="true"
              value="${escapeHtml((player.show_states || []).join(", "))}"
              placeholder="playing, paused"
            />
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              data-player-index="${index}"
              data-player-field="show"
              data-checked-value="true"
              data-unchecked-delete="true"
              ${player.show === true ? "checked" : ""}
            />
            <span>Mostrar siempre</span>
          </label>
        </div>
      </div>
    `;
  }

  _renderRoute(route, index) {
    const popupMarkup = Array.isArray(route.popup) && route.popup.length > 0
      ? route.popup.map((popupItem, popupIndex) => this._renderPopupItem(index, popupItem, popupIndex)).join("")
      : '<p class="hint">Esta ruta no tiene popup todavia.</p>';

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
          <label>
            <span>Layout popup</span>
            <select data-route-index="${index}" data-route-field="popup_layout" data-optional="true">
              <option value="" ${!route.popup_layout ? "selected" : ""}>Auto</option>
              <option value="vertical" ${route.popup_layout === "vertical" ? "selected" : ""}>Vertical</option>
              <option value="horizontal" ${route.popup_layout === "horizontal" ? "selected" : ""}>Horizontal</option>
            </select>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              data-route-index="${index}"
              data-route-field="match"
              data-checked-value="prefix"
              data-unchecked-delete="true"
              ${route.match === "prefix" ? "checked" : ""}
            />
            <span>Marcar activa por prefijo</span>
          </label>
        </div>
        <div class="subsection">
          <div class="route-head route-head--subsection">
            <strong>Popup</strong>
            <button type="button" data-editor-action="add-popup-item" data-route-index="${index}">
              Anadir popup
            </button>
          </div>
          ${popupMarkup}
        </div>
      </div>
    `;
  }

  _render() {
    const config = normalizeConfig(this._config || STUB_CONFIG);
    const routesMarkup = config.routes.map((route, index) => this._renderRoute(route, index)).join("");
    const playersMarkup = (config.media_player?.players || [])
      .map((player, index) => this._renderMediaPlayerPlayer(player, index))
      .join("");

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
        .route-card,
        .sub-card {
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

        .route-head--subsection,
        .route-head--sub {
          margin-bottom: 10px;
        }

        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .subsection {
          border-top: 1px solid var(--divider-color);
          margin-top: 16px;
          padding-top: 16px;
        }

        .sub-card {
          background: rgba(127, 127, 127, 0.08);
          margin-top: 10px;
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

        input,
        select {
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
              <span>Fondo botones</span>
              <input type="text" data-field="styles.button.background" value="${escapeHtml(config.styles.button.background || "")}" />
            </label>
            <label>
              <span>Color activo</span>
              <input type="text" data-field="styles.button.active_color" value="${escapeHtml(config.styles.button.active_color || "")}" />
            </label>
            <label>
              <span>Fondo activo</span>
              <input type="text" data-field="styles.button.active_background" value="${escapeHtml(config.styles.button.active_background || "")}" />
            </label>
            <label>
              <span>Radio barra</span>
              <input type="text" data-field="styles.bar.border_radius" value="${escapeHtml(config.styles.bar.border_radius || "")}" />
            </label>
            <label>
              <span>Padding barra</span>
              <input type="text" data-field="styles.bar.padding" value="${escapeHtml(config.styles.bar.padding || "")}" />
            </label>
            <label>
              <span>Tamano icono</span>
              <input type="text" data-field="styles.button.icon_size" value="${escapeHtml(config.styles.button.icon_size || "")}" />
            </label>
            <label>
              <span>Offset icono X</span>
              <input type="text" data-field="styles.button.icon_offset_x" value="${escapeHtml(config.styles.button.icon_offset_x || "")}" />
            </label>
            <label>
              <span>Offset icono Y</span>
              <input type="text" data-field="styles.button.icon_offset_y" value="${escapeHtml(config.styles.button.icon_offset_y || "")}" />
            </label>
            <label>
              <span>Tamano boton</span>
              <input type="text" data-field="styles.button.size" value="${escapeHtml(config.styles.button.size || "")}" />
            </label>
            <label>
              <span>Ancho popup</span>
              <input
                type="text"
                data-field="styles.popup.max_width"
                data-optional="true"
                value="${escapeHtml(config.styles.popup.max_width || "")}"
              />
            </label>
            <label>
              <span>Tamano item popup</span>
              <input
                type="text"
                data-field="styles.popup.item_size"
                data-optional="true"
                value="${escapeHtml(config.styles.popup.item_size || "")}"
              />
            </label>
            <label>
              <span>Separacion popup</span>
              <input
                type="text"
                data-field="styles.popup.item_gap"
                data-optional="true"
                value="${escapeHtml(config.styles.popup.item_gap || "")}"
              />
            </label>
            <label>
              <span>Layout popup por defecto</span>
              <select data-field="styles.popup.layout" data-optional="true">
                <option value="" ${!config.styles.popup.layout || config.styles.popup.layout === "auto" ? "selected" : ""}>Auto</option>
                <option value="vertical" ${config.styles.popup.layout === "vertical" ? "selected" : ""}>Vertical</option>
                <option value="horizontal" ${config.styles.popup.layout === "horizontal" ? "selected" : ""}>Horizontal</option>
              </select>
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
            Aqui ya puedes editar popup y media player. Para acciones muy avanzadas, sigue siendo mejor completar el YAML.
          </p>
        </div>
        <div class="panel">
          <div class="panel-title">
            <strong>Media Player</strong>
            <button type="button" data-editor-action="add-player">Anadir player</button>
          </div>
          <div class="grid">
            <label class="checkbox">
              <input type="checkbox" data-field="media_player.show_desktop" ${config.media_player.show_desktop ? "checked" : ""} />
              <span>Mostrar tambien en escritorio</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" data-field="media_player.album_cover_background" ${config.media_player.album_cover_background ? "checked" : ""} />
              <span>Usar caratula de fondo</span>
            </label>
            <label>
              <span>Altura reservada</span>
              <input type="text" data-field="media_player.reserve_height" value="${escapeHtml(config.media_player.reserve_height || "")}" />
            </label>
            <label>
              <span>Radio player</span>
              <input type="text" data-field="styles.media_player.border_radius" value="${escapeHtml(config.styles.media_player.border_radius || "")}" />
            </label>
          </div>
          <div class="subsection">
            ${playersMarkup || '<p class="hint">No hay reproductores configurados.</p>'}
          </div>
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
