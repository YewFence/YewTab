export type ContextMenuTarget =
  | {
      kind: "bookmark";
      id: string;
      title: string;
      url: string;
    }
  | {
      kind: "folder";
      id: string;
      title: string;
    }
  | {
      kind: "background";
      currentFolderId: string | null;
    };
