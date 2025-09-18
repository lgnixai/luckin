import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface OpenRequest {
  docId: string;
  title: string;
  filePath?: string;
}

interface EditorBridgeState {
  // 每次发起打开请求时自增，以便消费者用作触发器
  openNonce: number;
  lastOpen?: OpenRequest;
  openDocument: (docId: string, title: string, filePath?: string) => void;
}

export const useEditorBridge = create<EditorBridgeState>()(
  immer((set: (fn: (state: EditorBridgeState) => void) => void) => ({
    openNonce: 0,
    lastOpen: undefined,
    openDocument: (docId: string, title: string, filePath?: string) => {
      set((state: EditorBridgeState) => {
        state.lastOpen = { docId, title, filePath };
        state.openNonce += 1;
      });
    }
  }))
);

