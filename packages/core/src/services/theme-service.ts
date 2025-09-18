/**
 * Theme Service - Theme management and switching
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Event, 
  Theme, 
  IConfiguration 
} from '@lgnixai/luckin-foundation';
import { Emitter, LuckinError, ErrorCode } from '@lgnixai/luckin-foundation';
import { BaseService } from './base-service';

/**
 * Theme type enumeration
 */
export enum ThemeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'high-contrast'
}

/**
 * Extended theme interface
 */
export interface ITheme extends Theme {
  readonly description?: string;
  readonly author?: string;
  readonly version?: string;
  readonly extends?: string;
  readonly variables?: Record<string, string>;
}

/**
 * Theme service implementation
 */
export class ThemeService extends BaseService {
  private _themes = new Map<string, ITheme>();
  private _currentTheme?: ITheme;
  
  private _onThemeChanged = new Emitter<ITheme>();
  private _onThemeRegistered = new Emitter<ITheme>();
  private _onThemeUnregistered = new Emitter<string>();

  constructor(config?: IConfiguration) {
    super('theme', 'Theme Service', config);
    
    this.track(this._onThemeChanged);
    this.track(this._onThemeRegistered);
    this.track(this._onThemeUnregistered);
  }

  get onThemeChanged(): Event<ITheme> { return this._onThemeChanged.event; }
  get onThemeRegistered(): Event<ITheme> { return this._onThemeRegistered.event; }
  get onThemeUnregistered(): Event<string> { return this._onThemeUnregistered.event; }

  get currentTheme(): ITheme | undefined {
    return this._currentTheme;
  }

  protected async onInitialize(): Promise<void> {
    // Register built-in themes
    this._registerBuiltinThemes();
    
    // Load theme from configuration
    const themeId = this.getConfig<string>('theme', 'default-dark') || 'default-dark';
    await this.setTheme(themeId);
    
    // Watch for theme config changes
    this.watchConfig((key, value) => {
      if (key === 'theme') {
        this.setTheme(value);
      }
    });
  }

  /**
   * Register a theme
   */
  registerTheme(theme: ITheme): void {
    if (this._themes.has(theme.id)) {
      throw new LuckinError(
        ErrorCode.AlreadyExists,
        `Theme already registered: ${theme.id}`
      );
    }

    this._themes.set(theme.id, theme);
    this._onThemeRegistered.fire(theme);
  }

  /**
   * Unregister a theme
   */
  unregisterTheme(id: string): void {
    if (this._themes.delete(id)) {
      this._onThemeUnregistered.fire(id);
      
      // Switch to default if current theme was unregistered
      if (this._currentTheme?.id === id) {
        this.setTheme('default-dark');
      }
    }
  }

  /**
   * Get theme by ID
   */
  getTheme(id: string): ITheme | undefined {
    return this._themes.get(id);
  }

  /**
   * Get all registered themes
   */
  getThemes(): ITheme[] {
    return Array.from(this._themes.values());
  }

  /**
   * Get themes by type
   */
  getThemesByType(type: ThemeType): ITheme[] {
    return this.getThemes().filter(theme => theme.type === type);
  }

  /**
   * Set current theme
   */
  async setTheme(id: string): Promise<void> {
    const theme = this._themes.get(id);
    if (!theme) {
      throw new LuckinError(
        ErrorCode.NotFound,
        `Theme not found: ${id}`
      );
    }

    if (this._currentTheme?.id === id) {
      return;
    }

    this._currentTheme = theme;
    
    // Apply theme to DOM
    await this._applyTheme(theme);
    
    // Update configuration
    this.setConfig('theme', id);
    
    this._onThemeChanged.fire(theme);
  }

  /**
   * Toggle between light and dark themes
   */
  async toggleTheme(): Promise<void> {
    const currentType = this._currentTheme?.type || ThemeType.Dark;
    const targetType = currentType === ThemeType.Dark ? ThemeType.Light : ThemeType.Dark;
    
    const themes = this.getThemesByType(targetType);
    if (themes.length > 0) {
      await this.setTheme(themes[0].id);
    }
  }

  /**
   * Get theme color value
   */
  getColor(colorKey: string): string | undefined {
    return this._currentTheme?.colors[colorKey];
  }

  /**
   * Get resolved theme colors with variables
   */
  getResolvedColors(): Record<string, string> {
    if (!this._currentTheme) {
      return {};
    }

    const colors = { ...this._currentTheme.colors };
    const variables = this._currentTheme.variables || {};

    // Resolve variable references in colors
    for (const [key, value] of Object.entries(colors)) {
      colors[key] = this._resolveVariables(value, variables);
    }

    return colors;
  }

  private async _applyTheme(theme: ITheme): Promise<void> {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    
    // Add new theme class
    root.classList.add(`theme-${theme.type}`);
    root.setAttribute('data-theme', theme.id);
    
    // Apply CSS custom properties
    const resolvedColors = this.getResolvedColors();
    for (const [key, value] of Object.entries(resolvedColors)) {
      root.style.setProperty(`--${key}`, value);
    }

    // Apply variables if any
    if (theme.variables) {
      for (const [key, value] of Object.entries(theme.variables)) {
        root.style.setProperty(`--var-${key}`, value);
      }
    }
  }

  private _resolveVariables(value: string, variables: Record<string, string>): string {
    return value.replace(/var\(--var-([^)]+)\)/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  private _registerBuiltinThemes(): void {
    // Default Dark Theme
    this.registerTheme({
      id: 'default-dark',
      name: 'Default Dark',
      type: ThemeType.Dark,
      description: 'Default dark theme for Luckin IDE',
      colors: {
        'editor-background': '#1e1e1e',
        'editor-foreground': '#d4d4d4',
        'sidebar-background': '#252526',
        'sidebar-foreground': '#cccccc',
        'statusbar-background': '#007acc',
        'statusbar-foreground': '#ffffff',
        'activitybar-background': '#333333',
        'activitybar-foreground': '#ffffff',
        'panel-background': '#1e1e1e',
        'panel-foreground': '#d4d4d4',
        'border-color': '#3c3c3c',
        'button-background': '#0e639c',
        'button-foreground': '#ffffff',
        'input-background': '#3c3c3c',
        'input-foreground': '#cccccc',
        'dropdown-background': '#3c3c3c',
        'dropdown-foreground': '#cccccc',
        'list-hover-background': '#2a2d2e',
        'list-active-background': '#094771',
        'tab-active-background': '#1e1e1e',
        'tab-inactive-background': '#2d2d30',
        'tab-border': '#3c3c3c'
      }
    });

    // Default Light Theme
    this.registerTheme({
      id: 'default-light',
      name: 'Default Light',
      type: ThemeType.Light,
      description: 'Default light theme for Luckin IDE',
      colors: {
        'editor-background': '#ffffff',
        'editor-foreground': '#333333',
        'sidebar-background': '#f3f3f3',
        'sidebar-foreground': '#333333',
        'statusbar-background': '#007acc',
        'statusbar-foreground': '#ffffff',
        'activitybar-background': '#2c2c2c',
        'activitybar-foreground': '#ffffff',
        'panel-background': '#ffffff',
        'panel-foreground': '#333333',
        'border-color': '#e5e5e5',
        'button-background': '#007acc',
        'button-foreground': '#ffffff',
        'input-background': '#ffffff',
        'input-foreground': '#333333',
        'dropdown-background': '#ffffff',
        'dropdown-foreground': '#333333',
        'list-hover-background': '#f0f0f0',
        'list-active-background': '#e4e6f1',
        'tab-active-background': '#ffffff',
        'tab-inactive-background': '#ececec',
        'tab-border': '#e5e5e5'
      }
    });

    // High Contrast Theme
    this.registerTheme({
      id: 'high-contrast',
      name: 'High Contrast',
      type: ThemeType.HighContrast,
      description: 'High contrast theme for better accessibility',
      colors: {
        'editor-background': '#000000',
        'editor-foreground': '#ffffff',
        'sidebar-background': '#000000',
        'sidebar-foreground': '#ffffff',
        'statusbar-background': '#000000',
        'statusbar-foreground': '#ffffff',
        'activitybar-background': '#000000',
        'activitybar-foreground': '#ffffff',
        'panel-background': '#000000',
        'panel-foreground': '#ffffff',
        'border-color': '#ffffff',
        'button-background': '#ffffff',
        'button-foreground': '#000000',
        'input-background': '#000000',
        'input-foreground': '#ffffff',
        'dropdown-background': '#000000',
        'dropdown-foreground': '#ffffff',
        'list-hover-background': '#333333',
        'list-active-background': '#666666',
        'tab-active-background': '#000000',
        'tab-inactive-background': '#333333',
        'tab-border': '#ffffff'
      }
    });
  }
}

/**
 * Theme service identifier
 */
export const THEME_SERVICE_ID = 'theme';