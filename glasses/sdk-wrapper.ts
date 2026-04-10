/**
 * Glasses SDK Wrapper — replaces @jappyjan/even-better-sdk
 *
 * Provides managed page/element creation on top of @evenrealities/even_hub_sdk.
 * Fixes: borderRadius spelling, maintained in-house for future SDK updates.
 */

import {
  RebuildPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  ListContainerProperty,
  ListItemContainerProperty,
  CreateStartUpPageContainer,
  EvenAppBridge,
  type EvenHubEvent,
} from '@evenrealities/even_hub_sdk';

// ── Logger ──

export type GlassesLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export type GlassesLoggerImplementation = {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
};

export class GlassesLogger {
  static level: GlassesLogLevel = 'error';
  static implementation: GlassesLoggerImplementation = {
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  static debug(message: string): void {
    if (this.level === 'debug') this.implementation.debug(message);
  }
  static info(message: string): void {
    if (['debug', 'info'].includes(this.level)) this.implementation.info(message);
  }
  static warn(message: string): void {
    if (['debug', 'info', 'warn'].includes(this.level)) this.implementation.warn(message);
  }
  static error(message: string): void {
    if (this.level !== 'none') this.implementation.error(message);
  }
}

// ── Element Position ──

export class GlassesElementPosition {
  private positionX: number;
  private positionY: number;

  constructor(x = 0, y = 0) {
    this.positionX = x;
    this.positionY = y;
  }

  setX(x: number): GlassesElementPosition {
    this.positionX = x;
    GlassesLogger.debug(`[Element] Position X set to ${x}.`);
    return this;
  }

  setY(y: number): GlassesElementPosition {
    this.positionY = y;
    GlassesLogger.debug(`[Element] Position Y set to ${y}.`);
    return this;
  }

  get x(): number { return this.positionX; }
  get y(): number { return this.positionY; }
}

// ── Element Size ──

export class GlassesElementSize {
  static MAX_WIDTH = 576;
  static MAX_HEIGHT = 288;

  private sizeWidth: number;
  private sizeHeight: number;

  constructor(width = 100, height = 100) {
    this.sizeWidth = width;
    this.sizeHeight = height;
  }

  setWidth(width: number): GlassesElementSize {
    if (width > GlassesElementSize.MAX_WIDTH) {
      width = GlassesElementSize.MAX_WIDTH;
      GlassesLogger.warn(`[Element] Width clamped to ${GlassesElementSize.MAX_WIDTH}.`);
    }
    this.sizeWidth = width;
    GlassesLogger.debug(`[Element] Width set to ${width}.`);
    return this;
  }

  setHeight(height: number): GlassesElementSize {
    if (height > GlassesElementSize.MAX_HEIGHT) {
      height = GlassesElementSize.MAX_HEIGHT;
      GlassesLogger.warn(`[Element] Height clamped to ${GlassesElementSize.MAX_HEIGHT}.`);
    }
    this.sizeHeight = height;
    GlassesLogger.debug(`[Element] Height set to ${height}.`);
    return this;
  }

  get width(): number { return this.sizeWidth; }
  get height(): number { return this.sizeHeight; }
}

// ── Element Border ──

export class ElementBorder {
  private _width: number;
  private _color: string;
  private _radius: number;

  constructor(width = 0, color = '#000000', radius = 0) {
    this._width = width;
    this._color = color;
    this._radius = radius;
  }

  setWidth(width: number): ElementBorder {
    this._width = width;
    GlassesLogger.debug(`[Element] Border width set to ${width}.`);
    return this;
  }

  setColor(color: string): ElementBorder {
    this._color = color;
    GlassesLogger.debug(`[Element] Border color set to ${color}.`);
    return this;
  }

  setRadius(radius: number): ElementBorder {
    this._radius = radius;
    GlassesLogger.debug(`[Element] Border radius set to ${radius}.`);
    return this;
  }

  get width(): number { return this._width; }
  get color(): string { return this._color; }
  get radius(): number { return this._radius; }
}

// ── Element Types ──

export enum GlassesElementType {
  LIST = 'list',
  TEXT = 'text',
}

export interface BaseContainerProperty {
  containerID?: number;
  containerName?: string;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
}

// ── Base Element ──

export abstract class GlassesElement {
  private static elementIdCounter = 0;
  private readonly containerID: number;
  protected position: GlassesElementPosition;
  protected size: GlassesElementSize;

  readonly type: GlassesElementType;
  protected readonly page: GlassesPage;

  constructor(page: GlassesPage, type: GlassesElementType) {
    this.page = page;
    this.type = type;
    this.containerID = GlassesElement.elementIdCounter++;
    this.position = new GlassesElementPosition(0, 0);
    this.size = new GlassesElementSize(100, 100);
    GlassesLogger.debug(`[Element] Element "${this.containerID}" created with type "${this.type}".`);
  }

  abstract get didChange(): boolean;

  afterRender(): Promise<void> {
    return Promise.resolve();
  }

  get id(): number {
    return this.containerID;
  }

  toEvenSdkElement(): BaseContainerProperty {
    GlassesLogger.debug(`[Element] Serializing element "${this.containerID}".`);
    return {
      containerID: this.containerID,
      containerName: this.id.toString(),
      xPosition: this.position.x,
      yPosition: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  markAsEventCaptureElement(): GlassesElement {
    GlassesLogger.info(`[Element] Element "${this.containerID}" marked as event capture.`);
    this.page.setEventCaptureElement(this);
    return this;
  }

  setPosition(setter: (position: GlassesElementPosition) => void): GlassesElement {
    setter(this.position);
    GlassesLogger.debug(`[Element] Element "${this.containerID}" position updated.`);
    return this;
  }

  setSize(setter: (size: GlassesElementSize) => void): GlassesElement {
    setter(this.size);
    GlassesLogger.debug(`[Element] Element "${this.containerID}" size updated.`);
    return this;
  }
}

// ── Element with partial update ──

export abstract class GlassesElementWithPartialUpdate extends GlassesElement {
  abstract updateWithEvenHubSdk(): Promise<boolean>;
}

// ── List Element ──

export class GlassesListElement extends GlassesElement {
  private border: ElementBorder | null = null;
  private items: string[];
  private itemWidth = 100;
  private isItemSelectBorderEn = false;
  private isDirty = true;

  constructor(page: GlassesPage, items: string[]) {
    super(page, GlassesElementType.LIST);
    this.items = items;
  }

  async afterRender(): Promise<void> {
    this.isDirty = false;
    GlassesLogger.debug(`[Element] List element "${this.id}" rendered.`);
  }

  get didChange(): boolean {
    return this.isDirty;
  }

  addItem(item: string): GlassesListElement {
    this.items.push(item);
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" added item.`);
    return this;
  }

  removeItem(index: number): GlassesListElement {
    this.items.splice(index, 1);
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" removed item at ${index}.`);
    return this;
  }

  setItems(items: string[]): GlassesListElement {
    this.items = items;
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" items set (${items.length} total).`);
    return this;
  }

  replaceItem(index: number, item: string): GlassesListElement {
    this.items[index] = item;
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" replaced item at ${index}.`);
    return this;
  }

  toEvenSdkElement(): ListContainerProperty {
    GlassesLogger.debug(`[Element] Serializing list element "${this.id}".`);
    return ListContainerProperty.fromJson({
      ...super.toEvenSdkElement(),
      borderWidth: this.border?.width,
      borderColor: this.border?.color,
      borderRadius: this.border?.radius,
      itemContainer: ListItemContainerProperty.fromJson({
        itemCount: this.items.length,
        itemWidth: this.itemWidth,
        isItemSelectBorderEn: this.isItemSelectBorderEn ? 1 : 0,
        itemName: this.items,
      }),
    });
  }

  setBorder(setter: (border: ElementBorder) => void): GlassesListElement {
    if (!this.border) this.border = new ElementBorder(0, '#000000', 0);
    setter(this.border);
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" border updated.`);
    return this;
  }

  setItemWidth(width: number): GlassesListElement {
    this.itemWidth = width;
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" item width set to ${width}.`);
    return this;
  }

  setIsItemSelectBorderEn(enabled: boolean): GlassesListElement {
    this.isItemSelectBorderEn = enabled;
    this.isDirty = true;
    GlassesLogger.debug(`[Element] List element "${this.id}" item select border set to ${enabled}.`);
    return this;
  }
}

// ── Text Element ──

export class GlassesTextElement extends GlassesElementWithPartialUpdate {
  private content: string;
  private border: ElementBorder | null = null;
  private isDirty = true;

  constructor(page: GlassesPage, content: string) {
    super(page, GlassesElementType.TEXT);
    this.content = content;
  }

  async afterRender(): Promise<void> {
    this.isDirty = false;
    GlassesLogger.debug(`[Element] Text element "${this.id}" rendered.`);
  }

  get didChange(): boolean {
    return this.isDirty;
  }

  toEvenSdkElement(): TextContainerProperty {
    GlassesLogger.debug(`[Element] Serializing text element "${this.id}".`);
    return TextContainerProperty.fromJson({
      ...super.toEvenSdkElement(),
      borderWidth: this.border?.width,
      borderColor: this.border?.color,
      borderRadius: this.border?.radius,
      content: this.content,
    });
  }

  setBorder(setter: (border: ElementBorder) => void): GlassesTextElement {
    if (!this.border) this.border = new ElementBorder(0, '#000000', 0);
    setter(this.border);
    this.isDirty = true;
    GlassesLogger.debug(`[Element] Text element "${this.id}" border updated.`);
    return this;
  }

  setContent(content: string): GlassesTextElement {
    this.content = content;
    this.isDirty = true;
    GlassesLogger.debug(`[Element] Text element "${this.id}" content updated.`);
    return this;
  }

  async updateWithEvenHubSdk(): Promise<boolean> {
    GlassesLogger.info(`[Element] Updating text element "${this.id}" via SDK.`);
    try {
      const bridge = await GlassesSdk.getRawBridge();
      const result = await bridge.textContainerUpgrade(
        TextContainerUpgrade.fromJson({
          containerID: this.id,
          containerName: this.id.toString(),
          content: this.content,
        }),
      );
      this.isDirty = false;
      GlassesLogger.debug(`[Element] Text element "${this.id}" update result: ${result}.`);
      return result;
    } catch (e) {
      GlassesLogger.error(`[Element] Text element "${this.id}" update failed.`);
      throw e;
    }
  }
}

// ── Page ──

let pageIdCounter = 0;
function generatePageId(): string {
  return `page-${pageIdCounter++}-${Date.now().toString(36)}`;
}

export class GlassesPage {
  readonly sdk: GlassesSdk;
  readonly id: string;
  private elements = new Map<number, GlassesElement>();
  private eventCaptureElementId: number | null = null;

  constructor(sdk: GlassesSdk) {
    this.sdk = sdk;
    this.id = generatePageId();
    GlassesLogger.info(`[Page] GlassesPage created with id "${this.id}".`);
  }

  async render(): Promise<void> {
    GlassesLogger.info(`[Page] Rendering page "${this.id}".`);
    return this.sdk.renderPage(this);
  }

  toEvenSdkPage(): CreateStartUpPageContainer {
    const elements = Array.from(this.elements.values());
    GlassesLogger.debug(`[Page] Building SDK page for "${this.id}" with ${elements.length} elements.`);
    return CreateStartUpPageContainer.fromJson({
      containerTotalNum: this.elements.size,
      listObject: elements
        .filter((e) => e.type === GlassesElementType.LIST)
        .map((e) => ({
          ...e.toEvenSdkElement(),
          isEventCapture: e.id === this.eventCaptureElementId ? 1 : 0,
        })),
      textObject: elements
        .filter((e) => e.type === GlassesElementType.TEXT)
        .map((e) => ({
          ...e.toEvenSdkElement(),
          isEventCapture: e.id === this.eventCaptureElementId ? 1 : 0,
        })),
    });
  }

  getElements(): GlassesElement[] {
    GlassesLogger.debug(`[Page] Getting elements for page "${this.id}".`);
    return Array.from(this.elements.values());
  }

  setEventCaptureElement(element: GlassesElement): void {
    GlassesLogger.info(`[Page] Setting event capture element "${element.id}" for page "${this.id}".`);
    this.eventCaptureElementId = element.id;
  }

  addTextElement(content: string): GlassesTextElement {
    GlassesLogger.info(`[Page] Adding text element to page "${this.id}".`);
    const el = new GlassesTextElement(this, content);
    this.elements.set(el.id, el);
    GlassesLogger.debug(`[Page] Text element "${el.id}" added to page "${this.id}".`);
    return el;
  }

  addListElement(items: string[]): GlassesListElement {
    GlassesLogger.info(`[Page] Adding list element to page "${this.id}".`);
    const el = new GlassesListElement(this, items);
    this.elements.set(el.id, el);
    GlassesLogger.debug(`[Page] List element "${el.id}" added to page "${this.id}".`);
    return el;
  }
}

// ── SDK (Shared State) ──

interface SharedState {
  bridge: EvenAppBridge | null;
  initializationPromise: Promise<void> | null;
  currentPageId: string | null;
  eventListeners: EventListener[];
  renderRequests: Array<{ page: GlassesPage; resolve: () => void }>;
  renderInProgress: boolean;
}

type EventListener = (event: EvenHubEvent) => void;

function getSharedState(): SharedState {
  const g = globalThis as any;
  if (!g.__glassesToolkitSharedState) {
    g.__glassesToolkitSharedState = {
      bridge: null,
      initializationPromise: null,
      currentPageId: null,
      eventListeners: [],
      renderRequests: [],
      renderInProgress: false,
    };
  }
  return g.__glassesToolkitSharedState;
}

export class GlassesSdk {
  private readonly pages = new Map<string, GlassesPage>();
  static logger = GlassesLogger;

  private static get state(): SharedState { return getSharedState(); }
  static get bridge(): EvenAppBridge | null { return this.state.bridge; }
  private static set bridge(v: EvenAppBridge | null) { this.state.bridge = v; }
  private static get currentPageId(): string | null { return this.state.currentPageId; }
  private static set currentPageId(v: string | null) { this.state.currentPageId = v; }
  private static get eventListeners(): EventListener[] { return this.state.eventListeners; }
  private static get renderRequests() { return this.state.renderRequests; }
  private static get renderInProgress(): boolean { return this.state.renderInProgress; }
  private static set renderInProgress(v: boolean) { this.state.renderInProgress = v; }
  private static get initializationPromise(): Promise<void> | null { return this.state.initializationPromise; }
  private static set initializationPromise(v: Promise<void> | null) { this.state.initializationPromise = v; }

  static setLogger(logger: GlassesLoggerImplementation): void {
    GlassesLogger.implementation = logger;
  }

  static setLogLevel(level: GlassesLogLevel): void {
    GlassesLogger.level = level;
  }

  createPage(identifier: string): GlassesPage {
    GlassesLogger.info(`[SDK] Creating page for identifier "${identifier}".`);
    const page = new GlassesPage(this);
    this.pages.set(identifier, page);
    GlassesLogger.debug(`[SDK] Page created with id "${page.id}" for identifier "${identifier}".`);
    return page;
  }

  get isInitialized(): boolean {
    GlassesLogger.debug(`[SDK] Initialized: ${GlassesSdk.bridge !== null}.`);
    return GlassesSdk.bridge !== null;
  }

  private static async initialize(): Promise<void> {
    if (this.initializationPromise) {
      GlassesLogger.debug('[SDK] Already initializing, waiting.');
      await this.initializationPromise;
    }
    if (this.bridge) {
      GlassesLogger.debug('[SDK] Already initialized.');
      return;
    }

    let resolve: () => void = () => { throw new Error('Init promise not set'); };
    this.initializationPromise = new Promise<void>((r) => { resolve = r; });

    try {
      GlassesLogger.info('[SDK] Initializing bridge.');
      const bridge = EvenAppBridge.getInstance();
      let waited = 0;
      while (!bridge.ready) {
        await new Promise((r) => setTimeout(r, 100));
        waited++;
        if (waited % 10 === 0) GlassesLogger.info(`[SDK] Waiting for bridge.ready (${waited * 100}ms).`);
      }
      GlassesLogger.info('[SDK] Bridge is ready.');
      bridge.onEvenHubEvent((event: EvenHubEvent) => {
        GlassesLogger.debug('[SDK] Event received, dispatching.');
        this.eventListeners.forEach((cb) => cb(event));
      });
      this.currentPageId = null;
      this.bridge = bridge;
      GlassesLogger.info('[SDK] Bridge initialization complete.');
    } finally {
      resolve();
    }
  }

  async getValue(key: string): Promise<string> {
    await GlassesSdk.initialize();
    return GlassesSdk.bridge!.getLocalStorage(key);
  }

  async setValue(key: string, value: string): Promise<void> {
    await GlassesSdk.initialize();
    await GlassesSdk.bridge!.setLocalStorage(key, value);
  }

  static async getRawBridge(): Promise<EvenAppBridge> {
    await this.initialize();
    return this.bridge!;
  }

  async renderPage(page: GlassesPage): Promise<void> {
    GlassesLogger.debug(`[SDK] Adding render request for page "${page.id}".`);
    const promise = new Promise<void>((resolve) => {
      GlassesSdk.renderRequests.push({ page, resolve });
    });
    GlassesSdk.processRenderRequests();
    await promise;
    GlassesLogger.debug(`[SDK] Render request for page "${page.id}" completed.`);
  }

  private static async processRenderRequests(): Promise<void> {
    if (this.renderInProgress) return;
    this.renderInProgress = true;

    const request = this.renderRequests.shift();
    if (!request) {
      this.renderInProgress = false;
      return;
    }

    const { page, resolve } = request;
    GlassesLogger.debug(`[SDK] Processing render for page "${page.id}".`);

    try {
      await this.initialize();
      const elements = page.getElements();
      GlassesLogger.debug(`[SDK] Page "${page.id}" has ${elements.length} elements.`);

      const textUpdates = elements.filter(
        (e): e is GlassesElementWithPartialUpdate =>
          e.didChange && e instanceof GlassesElementWithPartialUpdate,
      );
      const hasNonTextChanges = elements
        .filter((e) => e.didChange)
        .some((e) => !(e instanceof GlassesElementWithPartialUpdate));

      const samePage = this.currentPageId === page.id;
      const needsFullRender = !samePage || hasNonTextChanges;

      GlassesLogger.debug(`[SDK] Page "${page.id}" full render: ${needsFullRender} (same: ${samePage}).`);

      if (needsFullRender) {
        if (this.currentPageId === null) {
          GlassesLogger.info(`[SDK] Creating startup page for "${page.id}".`);
          await this.bridge!.createStartUpPageContainer(page.toEvenSdkPage());
        } else {
          GlassesLogger.info(`[SDK] Rebuilding page for "${page.id}".`);
          await this.bridge!.rebuildPageContainer(
            RebuildPageContainer.fromJson(page.toEvenSdkPage()),
          );
        }
        this.currentPageId = page.id;
        GlassesLogger.debug(`[SDK] Page "${page.id}" full render complete.`);
        return;
      }

      // Partial updates for text elements only
      for (const el of textUpdates) {
        GlassesLogger.debug(`[SDK] Partial update for element "${el.id}".`);
        try {
          const result = await el.updateWithEvenHubSdk();
          GlassesLogger.debug(`[SDK] Element "${el.id}" update result: ${result}.`);
        } catch (e) {
          GlassesLogger.error(`[SDK] Element "${el.id}" partial update failed.`);
          throw e;
        }
      }
      GlassesLogger.debug(`[SDK] Page "${page.id}" partial update complete.`);
    } finally {
      resolve();
      this.renderInProgress = false;
      setTimeout(() => { this.processRenderRequests(); }, 0);
    }
  }

  addEventListener(listener: EventListener): void {
    GlassesLogger.debug('[SDK] Adding event listener.');
    GlassesSdk.eventListeners.push(listener);
  }

  removeEventListener(listener: EventListener): void {
    GlassesLogger.debug('[SDK] Removing event listener.');
    const idx = GlassesSdk.eventListeners.indexOf(listener);
    if (idx >= 0) GlassesSdk.eventListeners.splice(idx, 1);
  }
}
