import { useState, useEffect, useCallback, type RefObject } from "react";

export function useGridColumns(gridRef: RefObject<HTMLDivElement | null>, dependencies: unknown[] = []) {
  const [columns, setColumns] = useState(4);

  const updateColumns = useCallback(() => {
    if (gridRef.current) {
      const gridStyle = window.getComputedStyle(gridRef.current);
      const colStr = gridStyle.gridTemplateColumns;
      if (!colStr || colStr === "none") return;

      const colCount = colStr.split(" ").length;
      setColumns(colCount > 0 ? colCount : 1);
    }
  }, [gridRef]);

  useEffect(() => {
    const timer = setTimeout(updateColumns, 100);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateColumns, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(resizeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateColumns, ...dependencies]);

  return columns;
}
