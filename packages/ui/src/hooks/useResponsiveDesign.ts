import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  wide: 1920
};

export const useResponsiveDesign = (customBreakpoints?: Partial<ResponsiveBreakpoints>) => {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };
  
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        isTouchDevice: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
      isWide: width >= breakpoints.desktop,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  });

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
      isWide: width >= breakpoints.desktop,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    });
  }, [breakpoints]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // 防抖处理，避免频繁更新
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150);
    };

    const handleOrientationChange = () => {
      // 延迟处理方向变化，等待浏览器完成布局调整
      setTimeout(updateState, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateState]);

  return state;
};

// 响应式设计工具函数
export const getResponsiveTabWidth = (
  containerWidth: number,
  tabCount: number,
  isMobile: boolean,
  isTablet: boolean
): { width: number; showScrollButtons: boolean } => {
  const minTabWidth = isMobile ? 80 : isTablet ? 120 : 150;
  const maxTabWidth = isMobile ? 160 : isTablet ? 200 : 250;
  const scrollButtonWidth = 32;
  const availableWidth = containerWidth - (scrollButtonWidth * 2);

  if (tabCount === 0) {
    return { width: maxTabWidth, showScrollButtons: false };
  }

  const idealWidth = availableWidth / tabCount;
  
  if (idealWidth >= maxTabWidth) {
    // 标签页可以使用最大宽度
    return { width: maxTabWidth, showScrollButtons: false };
  } else if (idealWidth >= minTabWidth) {
    // 标签页使用计算出的宽度
    return { width: idealWidth, showScrollButtons: false };
  } else {
    // 标签页使用最小宽度，需要滚动
    return { width: minTabWidth, showScrollButtons: true };
  }
};

export const shouldAutoMergePanes = (
  containerWidth: number,
  containerHeight: number,
  paneCount: number,
  isMobile: boolean,
  isTablet: boolean
): boolean => {
  if (isMobile) {
    // 移动设备上超过1个面板就合并
    return paneCount > 1;
  }
  
  if (isTablet) {
    // 平板设备上超过2个面板或容器太小时合并
    return paneCount > 2 || containerWidth < 600 || containerHeight < 400;
  }
  
  // 桌面设备上根据容器大小决定
  const minPaneWidth = 300;
  const minPaneHeight = 200;
  
  return (
    (containerWidth / paneCount < minPaneWidth) ||
    (containerHeight / paneCount < minPaneHeight)
  );
};

export const getOptimalPaneLayout = (
  containerWidth: number,
  containerHeight: number,
  paneCount: number,
  isMobile: boolean,
  isTablet: boolean
): 'single' | 'horizontal' | 'vertical' | 'grid' => {
  if (isMobile || paneCount === 1) {
    return 'single';
  }
  
  if (isTablet) {
    // 平板设备优先使用水平分割
    return paneCount === 2 ? 'horizontal' : 'single';
  }
  
  // 桌面设备根据容器比例决定
  const aspectRatio = containerWidth / containerHeight;
  
  if (paneCount === 2) {
    return aspectRatio > 1.5 ? 'vertical' : 'horizontal';
  }
  
  if (paneCount <= 4) {
    return aspectRatio > 1.2 ? 'grid' : 'vertical';
  }
  
  return 'grid';
};

// 触摸设备优化
export const getTouchOptimizedSizes = (isTouchDevice: boolean, isMobile: boolean) => {
  if (!isTouchDevice) {
    return {
      tabHeight: 32,
      buttonSize: 24,
      splitterSize: 4,
      minTouchTarget: 24
    };
  }
  
  return {
    tabHeight: isMobile ? 44 : 40,
    buttonSize: isMobile ? 32 : 28,
    splitterSize: isMobile ? 12 : 8,
    minTouchTarget: 44
  };
};