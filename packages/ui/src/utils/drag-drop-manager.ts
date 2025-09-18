import { DragPosition } from "@/types/obsidian-editor';

export interface DragDropState {
  isDragging: boolean;
  draggedTabId: string | null;
  draggedFromPane: string | null;
  dragOverPane: string | null;
  dragOverPosition: DragPosition | null;
  dragPreview: HTMLElement | null;
}

export interface DropZone {
  id: string;
  type: 'tab-reorder' | 'pane-merge' | 'pane-split-left' | 'pane-split-right' | 'pane-split-top' | 'pane-split-bottom';
  paneId: string;
  targetIndex?: number;
  splitDirection?: 'horizontal' | 'vertical';
  rect: DOMRect;
}

export class DragDropManager {
  private state: DragDropState = {
    isDragging: false,
    draggedTabId: null,
    draggedFromPane: null,
    dragOverPane: null,
    dragOverPosition: null,
    dragPreview: null
  };

  private dropZones: DropZone[] = [];
  private listeners: ((state: DragDropState) => void)[] = [];

  // 开始拖拽
  startDrag(tabId: string, fromPane: string, dragEvent: DragEvent) {
    this.state = {
      ...this.state,
      isDragging: true,
      draggedTabId: tabId,
      draggedFromPane: fromPane
    };

    // 创建拖拽预览
    this.createDragPreview(dragEvent);
    
    // 设置拖拽数据
    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.effectAllowed = 'move';
      dragEvent.dataTransfer.setData('text/plain', tabId);
      dragEvent.dataTransfer.setData('application/source-pane', fromPane);
    }

    this.notifyListeners();
  }

  // 更新拖拽状态
  updateDrag(dragOverPane: string | null, position: DragPosition | null) {
    this.state = {
      ...this.state,
      dragOverPane,
      dragOverPosition: position
    };

    this.notifyListeners();
  }

  // 结束拖拽
  endDrag() {
    // 清理拖拽预览
    if (this.state.dragPreview) {
      document.body.removeChild(this.state.dragPreview);
    }

    this.state = {
      isDragging: false,
      draggedTabId: null,
      draggedFromPane: null,
      dragOverPane: null,
      dragOverPosition: null,
      dragPreview: null
    };

    this.dropZones = [];
    this.notifyListeners();
  }

  // 创建拖拽预览
  private createDragPreview(dragEvent: DragEvent) {
    const target = dragEvent.target as HTMLElement;
    const tabElement = target.closest('[data-tab-id]') as HTMLElement;
    
    if (tabElement) {
      const preview = tabElement.cloneNode(true) as HTMLElement;
      preview.style.position = 'absolute';
      preview.style.top = '-1000px';
      preview.style.left = '-1000px';
      preview.style.opacity = '0.8';
      preview.style.transform = 'rotate(5deg)';
      preview.style.pointerEvents = 'none';
      preview.style.zIndex = '9999';
      
      document.body.appendChild(preview);
      this.state.dragPreview = preview;

      // 设置拖拽图像
      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.setDragImage(preview, 0, 0);
      }

      // 延迟移除预览元素
      setTimeout(() => {
        if (preview.parentNode) {
          document.body.removeChild(preview);
        }
      }, 0);
    }
  }

  // 计算拖拽位置
  calculateDragPosition(
    clientX: number, 
    clientY: number, 
    containerElement: HTMLElement,
    tabElements: HTMLElement[]
  ): DragPosition | null {
    const containerRect = containerElement.getBoundingClientRect();
    const relativeX = clientX - containerRect.left;
    const relativeY = clientY - containerRect.top;

    // 检查是否在边缘区域（用于创建分割）
    const edgeThreshold = 50;
    const centerThreshold = 100;

    // 边缘检测
    if (relativeX < edgeThreshold) {
      return {
        x: clientX,
        y: clientY,
        zone: 'split-vertical',
        targetIndex: 0
      };
    }

    if (relativeX > containerRect.width - edgeThreshold) {
      return {
        x: clientX,
        y: clientY,
        zone: 'split-vertical',
        targetIndex: -1
      };
    }

    if (relativeY < edgeThreshold) {
      return {
        x: clientX,
        y: clientY,
        zone: 'split-horizontal',
        targetIndex: 0
      };
    }

    if (relativeY > containerRect.height - edgeThreshold) {
      return {
        x: clientX,
        y: clientY,
        zone: 'split-horizontal',
        targetIndex: -1
      };
    }

    // 标签页重排序检测
    if (tabElements.length > 0) {
      let closestIndex = 0;
      let closestDistance = Infinity;

      tabElements.forEach((element, index) => {
        const elementRect = element.getBoundingClientRect();
        const elementCenter = elementRect.left + elementRect.width / 2;
        const distance = Math.abs(clientX - elementCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      // 确定插入位置
      const targetElement = tabElements[closestIndex];
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const targetCenter = targetRect.left + targetRect.width / 2;
        const insertIndex = clientX < targetCenter ? closestIndex : closestIndex + 1;

        return {
          x: clientX,
          y: clientY,
          zone: 'tab',
          targetIndex: insertIndex
        };
      }
    }

    // 面板合并区域
    return {
      x: clientX,
      y: clientY,
      zone: 'pane',
      targetIndex: 0
    };
  }

  // 获取拖拽状态
  getState(): DragDropState {
    return { ...this.state };
  }

  // 添加状态监听器
  addListener(listener: (state: DragDropState) => void) {
    this.listeners.push(listener);
  }

  // 移除状态监听器
  removeListener(listener: (state: DragDropState) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // 注册拖拽区域
  registerDropZone(zone: DropZone) {
    this.dropZones.push(zone);
  }

  // 清除拖拽区域
  clearDropZones() {
    this.dropZones = [];
  }

  // 获取当前拖拽区域
  getDropZones(): DropZone[] {
    return [...this.dropZones];
  }

  // 查找最佳拖拽区域
  findBestDropZone(clientX: number, clientY: number): DropZone | null {
    let bestZone: DropZone | null = null;
    let bestDistance = Infinity;

    for (const zone of this.dropZones) {
      const rect = zone.rect;
      
      // 检查点是否在区域内
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        // 计算到区域中心的距离
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestZone = zone;
        }
      }
    }

    return bestZone;
  }
}

// 全局拖拽管理器实例
export const dragDropManager = new DragDropManager();

// 拖拽工具函数
export const createDragImage = (element: HTMLElement): HTMLElement => {
  const dragImage = element.cloneNode(true) as HTMLElement;
  dragImage.style.opacity = '0.8';
  dragImage.style.transform = 'rotate(5deg)';
  dragImage.style.pointerEvents = 'none';
  return dragImage;
};

export const getTabElementsInContainer = (container: HTMLElement): HTMLElement[] => {
  return Array.from(container.querySelectorAll('[data-tab-id]')) as HTMLElement[];
};

export const calculateInsertIndex = (
  clientX: number,
  tabElements: HTMLElement[]
): number => {
  if (tabElements.length === 0) return 0;

  for (let i = 0; i < tabElements.length; i++) {
    const element = tabElements[i];
    const rect = element.getBoundingClientRect();
    const center = rect.left + rect.width / 2;

    if (clientX < center) {
      return i;
    }
  }

  return tabElements.length;
};