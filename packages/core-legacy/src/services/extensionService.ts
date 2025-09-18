import type { IExtension, ILuckinContext } from '../types';

export class ExtensionService {
  private extensions: Map<string, IExtension> = new Map();
  private activatedExtensions: Set<string> = new Set();
  private context: ILuckinContext | null = null;

  constructor() {}

  setContext(context: ILuckinContext) {
    this.context = context;
  }

  addExtension(extension: IExtension) {
    this.extensions.set(extension.id.toString(), extension);
  }

  removeExtension(extensionId: string) {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      this.deactivateExtension(extensionId);
      this.extensions.delete(extensionId);
    }
  }

  getExtension(extensionId: string): IExtension | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): IExtension[] {
    return Array.from(this.extensions.values());
  }

  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || this.activatedExtensions.has(extensionId)) {
      return;
    }

    if (!this.context) {
      throw new Error('Extension context not set');
    }

    try {
      if (extension.activate) {
        await extension.activate(this.context, (this.context as any).monaco);
      }
      this.activatedExtensions.add(extensionId);
    } catch (error) {
      console.error(`Failed to activate extension ${extensionId}:`, error);
      throw error;
    }
  }

  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || !this.activatedExtensions.has(extensionId)) {
      return;
    }

    try {
      if (extension.deactivate) {
        await extension.deactivate();
      }
      this.activatedExtensions.delete(extensionId);
    } catch (error) {
      console.error(`Failed to deactivate extension ${extensionId}:`, error);
    }
  }

  isActivated(extensionId: string): boolean {
    return this.activatedExtensions.has(extensionId);
  }

  loadContributes(extension: IExtension): void {
    if (!extension.contributes || !this.context) {
      return;
    }

    const { contributes } = extension;
    
    // Load actions
    if (contributes.actions) {
      contributes.actions.forEach(action => {
        (this.context as any).action?.addAction(action);
      });
    }

    // Load menus
    if (contributes.menus) {
      contributes.menus.forEach(menu => {
        (this.context as any).menuBar?.addMenu(menu);
      });
    }

    // Load keybindings
    if (contributes.keybindings) {
      contributes.keybindings.forEach(keybinding => {
        (this.context as any).monaco?.addKeybinding(keybinding);
      });
    }

    // Load themes
    if (contributes.themes) {
      contributes.themes.forEach(theme => {
        (this.context as any).colorTheme?.addTheme(theme);
      });
    }

    // Load locales
    if (contributes.locales) {
      contributes.locales.forEach(locale => {
        (this.context as any).locale?.addLocale(locale);
      });
    }

    // Load views
    if (contributes.views) {
      contributes.views.forEach(view => {
        (this.context as any).sidebar?.addView(view);
      });
    }

    // Load commands
    if (contributes.commands) {
      contributes.commands.forEach(command => {
        (this.context as any).action?.addCommand(command);
      });
    }
  }

  async activateAll(): Promise<void> {
    const activationPromises = Array.from(this.extensions.keys()).map(id => 
      this.activateExtension(id).catch(error => {
        console.error(`Failed to activate extension ${id}:`, error);
      })
    );
    
    await Promise.all(activationPromises);
  }

  async deactivateAll(): Promise<void> {
    const deactivationPromises = Array.from(this.activatedExtensions).map(id => 
      this.deactivateExtension(id).catch(error => {
        console.error(`Failed to deactivate extension ${id}:`, error);
      })
    );
    
    await Promise.all(deactivationPromises);
  }

  dispose(): void {
    this.deactivateAll();
    this.extensions.clear();
    this.activatedExtensions.clear();
    this.context = null;
  }
}
