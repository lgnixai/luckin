/**
 * Command Service - Command palette and execution system
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Event, 
  Keybinding, 
  IConfiguration 
} from '@lgnixai/luckin-foundation';
import { Emitter, LuckinError, ErrorCode } from '@lgnixai/luckin-foundation';
import { BaseService } from './base-service';

/**
 * Command interface
 */
export interface ICommand {
  readonly id: string;
  readonly title: string;
  readonly category?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly keybinding?: string;
  readonly when?: string; // Context condition
  readonly args?: any[];
}

/**
 * Command handler function
 */
export type CommandHandler = (...args: any[]) => any | Promise<any>;

/**
 * Command execution context
 */
export interface ICommandContext {
  readonly command: ICommand;
  readonly args: any[];
  readonly source: 'palette' | 'keybinding' | 'menu' | 'api';
}

/**
 * Command service implementation
 */
export class CommandService extends BaseService {
  private _commands = new Map<string, ICommand>();
  private _handlers = new Map<string, CommandHandler>();
  private _keybindings = new Map<string, string>(); // key -> commandId
  private _categories = new Set<string>();
  
  private _onCommandRegistered = new Emitter<ICommand>();
  private _onCommandUnregistered = new Emitter<string>();
  private _onCommandExecuted = new Emitter<ICommandContext>();
  private _onKeybindingPressed = new Emitter<{ key: string; commandId: string }>();

  constructor(config?: IConfiguration) {
    super('command', 'Command Service', config);
    
    this.track(this._onCommandRegistered);
    this.track(this._onCommandUnregistered);
    this.track(this._onCommandExecuted);
    this.track(this._onKeybindingPressed);
  }

  get onCommandRegistered(): Event<ICommand> { return this._onCommandRegistered.event; }
  get onCommandUnregistered(): Event<string> { return this._onCommandUnregistered.event; }
  get onCommandExecuted(): Event<ICommandContext> { return this._onCommandExecuted.event; }
  get onKeybindingPressed(): Event<{ key: string; commandId: string }> { return this._onKeybindingPressed.event; }

  protected async onInitialize(): Promise<void> {
    // Register built-in commands
    this._registerBuiltinCommands();
    
    // Set up keyboard event listeners
    this._setupKeyboardListeners();
  }

  /**
   * Register a command
   */
  registerCommand(command: ICommand, handler: CommandHandler): void {
    if (this._commands.has(command.id)) {
      throw new LuckinError(
        ErrorCode.AlreadyExists,
        `Command already registered: ${command.id}`
      );
    }

    this._commands.set(command.id, command);
    this._handlers.set(command.id, handler);
    
    if (command.category) {
      this._categories.add(command.category);
    }
    
    if (command.keybinding) {
      this._keybindings.set(command.keybinding, command.id);
    }

    this._onCommandRegistered.fire(command);
  }

  /**
   * Unregister a command
   */
  unregisterCommand(id: string): void {
    const command = this._commands.get(id);
    if (command) {
      this._commands.delete(id);
      this._handlers.delete(id);
      
      // Remove keybinding
      if (command.keybinding) {
        this._keybindings.delete(command.keybinding);
      }

      this._onCommandUnregistered.fire(id);
    }
  }

  /**
   * Get command by ID
   */
  getCommand(id: string): ICommand | undefined {
    return this._commands.get(id);
  }

  /**
   * Get all registered commands
   */
  getCommands(): ICommand[] {
    return Array.from(this._commands.values());
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): ICommand[] {
    return this.getCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this._categories);
  }

  /**
   * Search commands by title or description
   */
  searchCommands(query: string): ICommand[] {
    const lowerQuery = query.toLowerCase();
    return this.getCommands().filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.category?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Execute a command
   */
  async executeCommand(
    id: string, 
    args: any[] = [], 
    source: ICommandContext['source'] = 'api'
  ): Promise<any> {
    const command = this._commands.get(id);
    if (!command) {
      throw new LuckinError(
        ErrorCode.NotFound,
        `Command not found: ${id}`
      );
    }

    const handler = this._handlers.get(id);
    if (!handler) {
      throw new LuckinError(
        ErrorCode.NotFound,
        `Command handler not found: ${id}`
      );
    }

    const context: ICommandContext = {
      command,
      args,
      source
    };

    try {
      const result = await Promise.resolve(handler(...args));
      this._onCommandExecuted.fire(context);
      return result;
    } catch (error) {
      throw new LuckinError(
        ErrorCode.Unknown,
        `Command execution failed: ${id}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }

  /**
   * Register a keybinding
   */
  registerKeybinding(keybinding: Keybinding): void {
    this._keybindings.set(keybinding.key, keybinding.command);
  }

  /**
   * Unregister a keybinding
   */
  unregisterKeybinding(key: string): void {
    this._keybindings.delete(key);
  }

  /**
   * Get command for keybinding
   */
  getCommandForKeybinding(key: string): string | undefined {
    return this._keybindings.get(key);
  }

  /**
   * Get all keybindings
   */
  getKeybindings(): Array<{ key: string; commandId: string }> {
    return Array.from(this._keybindings.entries()).map(([key, commandId]) => ({
      key,
      commandId
    }));
  }

  private _registerBuiltinCommands(): void {
    // File commands
    this.registerCommand({
      id: 'file.new',
      title: 'New File',
      category: 'File',
      description: 'Create a new file',
      keybinding: 'Ctrl+N'
    }, () => {
      console.log('Creating new file...');
    });

    this.registerCommand({
      id: 'file.open',
      title: 'Open File',
      category: 'File',
      description: 'Open an existing file',
      keybinding: 'Ctrl+O'
    }, () => {
      console.log('Opening file...');
    });

    this.registerCommand({
      id: 'file.save',
      title: 'Save File',
      category: 'File',
      description: 'Save the current file',
      keybinding: 'Ctrl+S'
    }, () => {
      console.log('Saving file...');
    });

    // Editor commands
    this.registerCommand({
      id: 'editor.find',
      title: 'Find',
      category: 'Editor',
      description: 'Find text in the current file',
      keybinding: 'Ctrl+F'
    }, () => {
      console.log('Opening find dialog...');
    });

    this.registerCommand({
      id: 'editor.replace',
      title: 'Replace',
      category: 'Editor',
      description: 'Find and replace text',
      keybinding: 'Ctrl+H'
    }, () => {
      console.log('Opening replace dialog...');
    });

    // View commands
    this.registerCommand({
      id: 'view.command-palette',
      title: 'Show Command Palette',
      category: 'View',
      description: 'Show all commands',
      keybinding: 'Ctrl+Shift+P'
    }, () => {
      console.log('Showing command palette...');
    });

    this.registerCommand({
      id: 'view.toggle-sidebar',
      title: 'Toggle Sidebar',
      category: 'View',
      description: 'Show or hide the sidebar',
      keybinding: 'Ctrl+B'
    }, () => {
      console.log('Toggling sidebar...');
    });

    this.registerCommand({
      id: 'view.toggle-panel',
      title: 'Toggle Panel',
      category: 'View',
      description: 'Show or hide the bottom panel',
      keybinding: 'Ctrl+J'
    }, () => {
      console.log('Toggling panel...');
    });

    // Theme commands
    this.registerCommand({
      id: 'theme.toggle',
      title: 'Toggle Theme',
      category: 'Theme',
      description: 'Switch between light and dark theme'
    }, () => {
      console.log('Toggling theme...');
    });
  }

  private _setupKeyboardListeners(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = this._getKeyString(event);
      const commandId = this._keybindings.get(key);
      
      if (commandId) {
        event.preventDefault();
        event.stopPropagation();
        
        this._onKeybindingPressed.fire({ key, commandId });
        this.executeCommand(commandId, [], 'keybinding');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    this.track({
      dispose: () => {
        document.removeEventListener('keydown', handleKeyDown);
      }
    });
  }

  private _getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    let key = event.key;
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();
    
    parts.push(key);
    
    return parts.join('+');
  }
}

/**
 * Command service identifier
 */
export const COMMAND_SERVICE_ID = 'command';