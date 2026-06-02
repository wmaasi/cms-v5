import type { Schema, Struct } from '@strapi/strapi';

export interface ChartItemChartItem extends Struct.ComponentSchema {
  collectionName: 'components_chart_item_chart_items';
  info: {
    description: '';
    displayName: 'chart_item';
    icon: 'chartPie';
  };
  attributes: {
    name: Schema.Attribute.String;
    toolTip: Schema.Attribute.String;
    value: Schema.Attribute.Decimal;
  };
}

export interface ChartSerieChartSerie extends Struct.ComponentSchema {
  collectionName: 'components_chart_serie_chart_series';
  info: {
    description: '';
    displayName: 'chart_serie';
    icon: 'chartCircle';
  };
  attributes: {
    items: Schema.Attribute.Component<'chart-item.chart-item', true>;
    name: Schema.Attribute.String;
  };
}

export interface NotificationsNotificationSelector
  extends Struct.ComponentSchema {
  collectionName: 'components_notifications_notification_selectors';
  info: {
    displayName: 'Notification Selector';
    icon: 'envelop';
  };
  attributes: {
    kind: Schema.Attribute.Enumeration<
      ['sector', 'commission', 'committee', 'user_tags']
    > &
      Schema.Attribute.Required;
  };
}

export interface SeoSeo extends Struct.ComponentSchema {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'Seo';
    icon: 'apps';
  };
  attributes: {
    metaDescription: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String;
    sharedImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'picture';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'quote';
  };
  attributes: {
    body: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    displayName: 'richText';
    icon: 'file';
  };
  attributes: {
    body: Schema.Attribute.Blocks;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    displayName: 'Slider';
    icon: 'landscape';
  };
  attributes: {
    files: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'chart-item.chart-item': ChartItemChartItem;
      'chart-serie.chart-serie': ChartSerieChartSerie;
      'notifications.notification-selector': NotificationsNotificationSelector;
      'seo.seo': SeoSeo;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.slider': SharedSlider;
    }
  }
}
