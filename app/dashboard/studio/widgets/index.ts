// Gratia's custom widgets, added to AG Studio's own and grouped under "Gratia" in the widget picker.

import type { AgDefaultWidgetDefinition, AgWidgetsConfig } from 'ag-studio';
import { createWidgets, type AgRegistry } from 'ag-studio-react';
import { donorWallDefinition } from './donor-wall';
import { giftFeedDefinition } from './gift-feed';
import { loyaltyHeatmapDefinition } from './loyalty-heatmap';

export interface GratiaRegistry extends AgRegistry {
  widgets: readonly (
    | AgDefaultWidgetDefinition
    | typeof donorWallDefinition
    | typeof giftFeedDefinition
    | typeof loyaltyHeatmapDefinition
  )[];
}

export const gratiaWidgets = (defaults: AgWidgetsConfig) =>
  createWidgets<GratiaRegistry>({
    additionalTypes: [donorWallDefinition, giftFeedDefinition, loyaltyHeatmapDefinition],
    menu: [...defaults.menu, { label: 'Gratia', widgetIds: ['donor-wall', 'gift-feed', 'loyalty-heatmap'] }],
  });
