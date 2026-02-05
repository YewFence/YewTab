import type { ReactNode } from "react";

export type SettingsTabKey = string;

export type SettingsTabDefinition = {
  key: SettingsTabKey;
  title: string;
  description?: string;
  icon?: ReactNode;
  render: () => ReactNode;
};
