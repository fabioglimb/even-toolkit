import { EvenBetterSdk } from '@jappyjan/even-better-sdk';
import type { EvenBetterPage, EvenBetterTextElement } from '@jappyjan/even-better-sdk';
import {
  RebuildPageContainer,
  ImageContainerProperty,
  ImageRawDataUpdate,
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
  type EvenHubEvent,
} from '@evenrealities/even_hub_sdk';
import { DISPLAY_W, DISPLAY_H, CHART_TEXT, IMAGE_TILES, SPLIT_HEADER, SPLIT_LEFT, SPLIT_RIGHT } from './layout';
import type { PageMode, SplitLayout } from './types';
import { notifyTextUpdate } from './gestures';

function noBorder(el: EvenBetterTextElement): EvenBetterTextElement {
  return el.setBorder(b => b.setWidth(0).setColor('0').setRadius(0));
}

export interface ColumnConfig {
  x: number;
  w: number;
}

export class EvenHubBridge {
  private sdk: EvenBetterSdk;
  /** Raw EvenHub SDK bridge — exposed for STT audio control */
  rawBridge: EvenAppBridge | null = null;
  private _currentMode: PageMode | null = null;
  private _pageReady = false;

  // ── SDK-managed pages ──

  // Single text page (settings, simple screens)
  private textPage!: EvenBetterPage;
  private textContent!: EvenBetterTextElement;

  // Column page (watchlist, tables)
  private columnPage!: EvenBetterPage;
  private columnElements: EvenBetterTextElement[] = [];

  // Split page (header + two lower panes)
  private splitPage!: EvenBetterPage;
  private splitHeader!: EvenBetterTextElement;
  private splitLeft!: EvenBetterTextElement;
  private splitRight!: EvenBetterTextElement;
  private lastSplitLayoutKey: string | null = null;

  // Chart dummy (for SDK state tracking before raw bridge chart/home)
  private chartDummyPage!: EvenBetterPage;

  constructor(columns?: ColumnConfig[]) {
    this.sdk = new EvenBetterSdk();
    const cols = columns ?? [
      { x: 0, w: 192 },
      { x: 192, w: 192 },
      { x: 384, w: DISPLAY_W - 384 },
    ];
    this.createPages(cols);
  }

  get pageReady(): boolean { return this._pageReady; }
  get currentMode(): PageMode | null { return this._currentMode; }
  /** Alias matching even-market naming convention */
  get currentLayout(): PageMode | null { return this._currentMode; }

  private createPages(cols: ColumnConfig[]): void {
    // ── Text page: empty overlay (event capture, no bounce) + visible content ──
    this.textPage = this.sdk.createPage('text');
    const textOverlay = noBorder(this.textPage.addTextElement(''));
    textOverlay
      .setPosition(p => p.setX(0).setY(0))
      .setSize(s => s.setWidth(DISPLAY_W).setHeight(DISPLAY_H));
    textOverlay.markAsEventCaptureElement();

    this.textContent = noBorder(this.textPage.addTextElement(''));
    this.textContent
      .setPosition(p => p.setX(0).setY(0))
      .setSize(s => s.setWidth(DISPLAY_W).setHeight(DISPLAY_H));

    // ── Column page: empty overlay + N column text elements (max 3 columns + overlay = 4 containers) ──
    this.columnPage = this.sdk.createPage('columns');
    const colOverlay = noBorder(this.columnPage.addTextElement(''));
    colOverlay
      .setPosition(p => p.setX(0).setY(0))
      .setSize(s => s.setWidth(DISPLAY_W).setHeight(DISPLAY_H));
    colOverlay.markAsEventCaptureElement();

    this.columnElements = cols.map((col) => {
      const el = noBorder(this.columnPage.addTextElement(''));
      el.setPosition(p => p.setX(col.x).setY(0))
        .setSize(s => s.setWidth(col.w).setHeight(DISPLAY_H));
      return el;
    });

    // ── Split page: empty overlay + full-width header + two bottom panes ──
    this.splitPage = this.sdk.createPage('split');
    const splitOverlay = noBorder(this.splitPage.addTextElement(''));
    splitOverlay
      .setPosition(p => p.setX(0).setY(0))
      .setSize(s => s.setWidth(DISPLAY_W).setHeight(DISPLAY_H));
    splitOverlay.markAsEventCaptureElement();

    this.splitHeader = noBorder(this.splitPage.addTextElement(''));
    this.splitHeader
      .setPosition(p => p.setX(SPLIT_HEADER.x).setY(SPLIT_HEADER.y))
      .setSize(s => s.setWidth(SPLIT_HEADER.w).setHeight(SPLIT_HEADER.h));

    this.splitLeft = noBorder(this.splitPage.addTextElement(''));
    this.splitLeft
      .setPosition(p => p.setX(SPLIT_LEFT.x).setY(SPLIT_LEFT.y))
      .setSize(s => s.setWidth(SPLIT_LEFT.w).setHeight(SPLIT_LEFT.h));

    this.splitRight = noBorder(this.splitPage.addTextElement(''));
    this.splitRight
      .setPosition(p => p.setX(SPLIT_RIGHT.x).setY(SPLIT_RIGHT.y))
      .setSize(s => s.setWidth(SPLIT_RIGHT.w).setHeight(SPLIT_RIGHT.h));

    // ── Chart dummy page (for SDK state tracking) ──
    this.chartDummyPage = this.sdk.createPage('chart-dummy');
    const dummyText = noBorder(this.chartDummyPage.addTextElement(''));
    dummyText
      .setPosition(p => p.setX(0).setY(0))
      .setSize(s => s.setWidth(1).setHeight(1));
    dummyText.markAsEventCaptureElement();
  }

  async init(): Promise<void> {
    try {
      this.rawBridge = await EvenBetterSdk.getRawBridge() as unknown as EvenAppBridge;
      this._pageReady = true;
    } catch (err) {
      throw err;
    }
  }

  // ── Setup (required before chart/home layout switch) ──

  async setupTextPage(): Promise<boolean> {
    if (!this._pageReady) return false;
    try {
      this.textContent.setContent('');
      await this.sdk.renderPage(this.textPage);
      this._currentMode = 'text';
      return true;
    } catch { return false; }
  }

  // ── Text page (single full-screen text, no bounce) ──

  async showTextPage(content: string): Promise<void> {
    if (!this._pageReady) return;
    this.textContent.setContent(content);
    notifyTextUpdate();
    await this.sdk.renderPage(this.textPage);
    this._currentMode = 'text';
  }

  async updateText(content: string): Promise<void> {
    if (!this._pageReady) return;
    this.textContent.setContent(content);
    notifyTextUpdate();
    await this.sdk.renderPage(this.textPage);
  }

  // ── Column page (multi-column text, no bounce) ──

  async showColumnPage(columns: string[]): Promise<void> {
    if (!this._pageReady) return;
    for (let i = 0; i < this.columnElements.length && i < columns.length; i++) {
      this.columnElements[i]!.setContent(columns[i]!);
    }
    notifyTextUpdate();
    await this.sdk.renderPage(this.columnPage);
    this._currentMode = 'columns';
  }

  async updateColumns(columns: string[]): Promise<void> {
    if (!this._pageReady) return;
    for (let i = 0; i < this.columnElements.length && i < columns.length; i++) {
      this.columnElements[i]!.setContent(columns[i]!);
    }
    notifyTextUpdate();
    await this.sdk.renderPage(this.columnPage);
  }

  // ── Split page (header + two-pane layout) ──

  private resolveSplitLayout(layout?: SplitLayout): {
    headerHeight: number;
    leftWidth: number;
    rightWidth: number;
    key: string;
  } {
    const headerHeight = Math.max(40, Math.min(DISPLAY_H - 80, layout?.headerHeight ?? SPLIT_HEADER.h));
    const requestedLeft = layout?.leftWidth ?? (layout?.rightWidth ? DISPLAY_W - layout.rightWidth : SPLIT_LEFT.w);
    const leftWidth = Math.max(180, Math.min(DISPLAY_W - 180, requestedLeft));
    const rightWidth = DISPLAY_W - leftWidth;
    return {
      headerHeight,
      leftWidth,
      rightWidth,
      key: `${headerHeight}:${leftWidth}`,
    };
  }

  async showSplitPage(header: string, left: string, right: string, layout?: SplitLayout): Promise<void> {
    if (!this._pageReady) return;
    const resolved = this.resolveSplitLayout(layout);
    if (this.rawBridge) {
      await this.sdk.renderPage(this.chartDummyPage);
      await this.rawBridge.rebuildPageContainer(
        new RebuildPageContainer({
          containerTotalNum: 4,
          textObject: [
            new TextContainerProperty({
              containerID: 1, containerName: 'overlay',
              xPosition: 0, yPosition: 0, width: DISPLAY_W, height: DISPLAY_H,
              borderWidth: 0, borderColor: 0, paddingLength: 0,
              content: '', isEventCapture: 1,
            }),
            new TextContainerProperty({
              containerID: 6, containerName: 'split-header',
              xPosition: 0, yPosition: 0, width: DISPLAY_W, height: resolved.headerHeight,
              borderWidth: 0, borderColor: 0, paddingLength: 0,
              content: header, isEventCapture: 0,
            }),
            new TextContainerProperty({
              containerID: 7, containerName: 'split-left',
              xPosition: 0, yPosition: resolved.headerHeight, width: resolved.leftWidth, height: DISPLAY_H - resolved.headerHeight,
              borderWidth: 0, borderColor: 0, paddingLength: 6,
              content: left, isEventCapture: 0,
            }),
            new TextContainerProperty({
              containerID: 8, containerName: 'split-right',
              xPosition: resolved.leftWidth, yPosition: resolved.headerHeight, width: resolved.rightWidth, height: DISPLAY_H - resolved.headerHeight,
              borderWidth: 0, borderColor: 0, paddingLength: 6,
              content: right, isEventCapture: 0,
            }),
          ],
          imageObject: [],
        }),
      );
      this.lastSplitLayoutKey = resolved.key;
      this._currentMode = 'split';
      return;
    }
    this.splitHeader.setPosition((p) => p.setX(0).setY(0));
    this.splitHeader.setSize((s) => s.setWidth(DISPLAY_W).setHeight(resolved.headerHeight));
    this.splitHeader.setBorder((b) => b.setWidth(0).setColor('0').setRadius(0));
    this.splitLeft.setPosition((p) => p.setX(0).setY(resolved.headerHeight));
    this.splitLeft.setSize((s) => s.setWidth(resolved.leftWidth).setHeight(DISPLAY_H - resolved.headerHeight));
    this.splitLeft.setBorder((b) => b.setWidth(0).setColor('0').setRadius(0));
    this.splitRight.setPosition((p) => p.setX(resolved.leftWidth).setY(resolved.headerHeight));
    this.splitRight.setSize((s) => s.setWidth(resolved.rightWidth).setHeight(DISPLAY_H - resolved.headerHeight));
    this.splitRight.setBorder((b) => b.setWidth(0).setColor('0').setRadius(0));
    this.splitHeader.setContent(header);
    this.splitLeft.setContent(left);
    this.splitRight.setContent(right);
    notifyTextUpdate();
    await this.sdk.renderPage(this.splitPage);
    this._currentMode = 'split';
  }

  async updateSplitPage(header: string, left: string, right: string, layout?: SplitLayout): Promise<void> {
    if (!this._pageReady) return;
    if (this.rawBridge) {
      const resolved = this.resolveSplitLayout(layout);
      if (this._currentMode !== 'split' || this.lastSplitLayoutKey !== resolved.key) {
        await this.showSplitPage(header, left, right, layout);
        return;
      }
      notifyTextUpdate();
      await Promise.all([
        this.rawBridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: 6, containerName: 'split-header',
            contentOffset: 0, contentLength: 2000, content: header,
          }),
        ),
        this.rawBridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: 7, containerName: 'split-left',
            contentOffset: 0, contentLength: 2000, content: left,
          }),
        ),
        this.rawBridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: 8, containerName: 'split-right',
            contentOffset: 0, contentLength: 2000, content: right,
          }),
        ),
      ]);
      return;
    }
    this.splitHeader.setContent(header);
    this.splitLeft.setContent(left);
    this.splitRight.setContent(right);
    notifyTextUpdate();
    await this.sdk.renderPage(this.splitPage);
  }

  // ── Convenience: Watchlist (3-column layout) ──

  async switchToWatchlist(colSym: string, colPrice: string, colPct: string): Promise<boolean> {
    if (!this._pageReady) return false;
    try {
      await this.showColumnPage([colSym, colPrice, colPct]);
      return true;
    } catch { return false; }
  }

  async updateWatchlist(colSym: string, colPrice: string, colPct: string): Promise<void> {
    await this.updateColumns([colSym, colPrice, colPct]);
  }

  // ── Convenience: Settings (full-screen text) ──

  async switchToSettings(text: string): Promise<boolean> {
    if (!this._pageReady) return false;
    try {
      await this.showTextPage(text);
      return true;
    } catch { return false; }
  }

  async updateSettings(text: string): Promise<void> {
    await this.updateText(text);
  }

  // ── Home page (N images + empty overlay + menu text containers, no bounce) ──

  async switchToHomeLayout(menuText: string, imageTiles?: { id: number; name: string; x: number; y: number; w: number; h: number }[]): Promise<boolean> {
    if (!this.rawBridge || !this._pageReady) return false;
    try {
      await this.showHomePage(menuText, imageTiles);
      return true;
    } catch { return false; }
  }

  async showHomePage(menuText: string, imageTiles?: { id: number; name: string; x: number; y: number; w: number; h: number }[]): Promise<void> {
    if (!this.rawBridge || !this._pageReady) return;
    await this.sdk.renderPage(this.chartDummyPage);

    const tiles = imageTiles && imageTiles.length > 0 ? imageTiles : [];

    // Text starts below the first image tile (persistent logo tile).
    // Extra tiles (e.g. splash "Loading...") overlap with text area — cleared with black on transition.
    const textY = tiles.length > 0 ? tiles[0]!.y + tiles[0]!.h : 0;

    await this.rawBridge.rebuildPageContainer(
      new RebuildPageContainer({
        containerTotalNum: 2 + tiles.length,
        textObject: [
          new TextContainerProperty({
            containerID: 1, containerName: 'overlay',
            xPosition: 0, yPosition: 0, width: DISPLAY_W, height: DISPLAY_H,
            borderWidth: 0, borderColor: 0, paddingLength: 0,
            content: '', isEventCapture: 1,
          }),
          new TextContainerProperty({
            containerID: 5, containerName: 'menu',
            xPosition: 0, yPosition: textY, width: DISPLAY_W, height: DISPLAY_H - textY,
            borderWidth: 0, borderColor: 0, paddingLength: 6,
            content: menuText, isEventCapture: 0,
          }),
        ],
        imageObject: tiles.map(t =>
          new ImageContainerProperty({
            containerID: t.id, containerName: t.name,
            xPosition: t.x, yPosition: t.y, width: t.w, height: t.h,
          }),
        ),
      }),
    );
    this._currentMode = 'home';
  }

  async updateHomeText(content: string): Promise<void> {
    if (!this.rawBridge || !this._pageReady || this._currentMode !== 'home') return;
    notifyTextUpdate();
    await this.rawBridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: 5, containerName: 'menu',
        contentOffset: 0, contentLength: 2000, content,
      }),
    );
  }

  // ── Chart page (3 image tiles + 1 text = 4 containers) ──

  async switchToChartLayout(topText: string): Promise<boolean> {
    if (!this.rawBridge || !this._pageReady) return false;
    if (this._currentMode === 'chart') return true;
    try {
      await this.showChartPage(topText);
      return true;
    } catch { return false; }
  }

  async showChartPage(topText: string): Promise<void> {
    if (!this.rawBridge || !this._pageReady) return;
    if (this._currentMode === 'chart') return;
    await this.sdk.renderPage(this.chartDummyPage);
    await this.rawBridge.rebuildPageContainer(
      new RebuildPageContainer({
        containerTotalNum: 4,
        textObject: [
          new TextContainerProperty({
            containerID: CHART_TEXT.id, containerName: CHART_TEXT.name,
            xPosition: CHART_TEXT.x, yPosition: CHART_TEXT.y,
            width: CHART_TEXT.w, height: CHART_TEXT.h,
            borderWidth: 0, borderColor: 0, paddingLength: 0,
            content: topText, isEventCapture: 1,
          }),
        ],
        imageObject: IMAGE_TILES.map((t) =>
          new ImageContainerProperty({
            containerID: t.id, containerName: t.name,
            xPosition: t.x, yPosition: t.y, width: t.w, height: t.h,
          }),
        ),
      }),
    );
    this._currentMode = 'chart';
  }

  async updateChartText(content: string): Promise<void> {
    if (!this.rawBridge || !this._pageReady || this._currentMode !== 'chart') return;
    notifyTextUpdate();
    await this.rawBridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: CHART_TEXT.id, containerName: CHART_TEXT.name,
        contentOffset: 0, contentLength: 2000, content,
      }),
    );
  }

  // ── Image sending (for home + chart modes) ──

  async sendImage(containerID: number, containerName: string, pngBytes: Uint8Array): Promise<void> {
    if (!this.rawBridge || !this._pageReady || this._currentMode === 'text' || this._currentMode === 'columns' || this._currentMode === 'split' || pngBytes.length === 0) return;
    await this.rawBridge.updateImageRawData(
      new ImageRawDataUpdate({ containerID, containerName, imageData: pngBytes }),
    );
  }

  // ── IMU ──

  async imuEnable(): Promise<void> {
    if (!this.rawBridge) return;
    try {
      await (this.rawBridge as any).callEvenApp('imuControl', { isOpen: true });
    } catch { /* IMU might not be supported */ }
  }

  async imuDisable(): Promise<void> {
    if (!this.rawBridge) return;
    try {
      await (this.rawBridge as any).callEvenApp('imuControl', { isOpen: false });
    } catch { /* IMU might not be supported */ }
  }

  // ── Shutdown ──

  async showShutdownContainer(exitMode: 0 | 1 = 1): Promise<boolean> {
    if (!this.rawBridge || !this._pageReady) return false;
    try {
      if (typeof this.rawBridge.shutDownPageContainer === 'function') {
        return await this.rawBridge.shutDownPageContainer(exitMode);
      }
      return await (this.rawBridge as any).callEvenApp('shutDownPageContainer', { exitMode });
    } catch {
      return false;
    }
  }

  // ── Events ──

  onEvent(handler: (event: EvenHubEvent) => void): void {
    this.sdk.addEventListener(handler);
  }

  // ── Persistent storage (survives WebView restarts) ──

  async setLocalStorage(key: string, value: string): Promise<boolean> {
    if (!this.rawBridge) return false;
    try {
      return await (this.rawBridge as any).setLocalStorage(key, value);
    } catch {
      return false;
    }
  }

  async getLocalStorage(key: string): Promise<string> {
    if (!this.rawBridge) return '';
    try {
      return await (this.rawBridge as any).getLocalStorage(key);
    } catch {
      return '';
    }
  }

  dispose(): void {
    this.rawBridge = null;
  }
}
