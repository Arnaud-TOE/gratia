// Gratia's custom widgets, added to AG Studio's own and grouped under "Gratia" in the widget picker.

import type { AgDefaultWidgetDefinition, AgWidgetsConfig } from 'ag-studio';
import { createWidgets, type AgRegistry } from 'ag-studio-react';
import { campaignProgressDefinition } from './campaign-progress';
import { donorWallDefinition } from './donor-wall';
import { giftFeedDefinition } from './gift-feed';
import { loyaltyHeatmapDefinition } from './loyalty-heatmap';

export interface GratiaRegistry extends AgRegistry {
  widgets: readonly (
    | AgDefaultWidgetDefinition
    | typeof campaignProgressDefinition
    | typeof donorWallDefinition
    | typeof giftFeedDefinition
    | typeof loyaltyHeatmapDefinition
  )[];
}

export const gratiaWidgets = (defaults: AgWidgetsConfig) =>
  createWidgets<GratiaRegistry>({
    additionalTypes: [campaignProgressDefinition, donorWallDefinition, giftFeedDefinition, loyaltyHeatmapDefinition],
    menu: [...defaults.menu, { label: 'Gratia', widgetIds: ['campaign-progress', 'donor-wall', 'gift-feed', 'loyalty-heatmap'] }],
  });
