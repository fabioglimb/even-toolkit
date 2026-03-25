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
import { DISPLAY_W, DISPLAY_H, CHART_TEXT, IMAGE_TILES } from './layout';
import type { PageMode } from './types';
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
    if (!this.rawBridge || !this._pageReady || this._currentMode === 'text' || this._currentMode === 'columns' || pngBytes.length === 0) return;
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

  // ── Events ──

  onEvent(handler: (event: EvenHubEvent) => void): void {
    this.sdk.addEventListener(handler);
  }

  dispose(): void {
    this.rawBridge = null;
  }
}
