import { useState, useEffect } from "react";

export function useEditMode() {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) {
        return;
      }
      if (e.key?.toLowerCase() !== "e") {
        return;
      }
      e.preventDefault();
      setEditMode((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { editMode, setEditMode };
}
