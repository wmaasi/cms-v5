import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAboutAbout extends Struct.SingleTypeSchema {
  collectionName: 'abouts';
  info: {
    displayName: 'About';
    pluralName: 'abouts';
    singularName: 'about';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<
      ['shared.slider', 'shared.rich-text', 'shared.quote', 'shared.media']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about.about'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAuthorAuthor extends Struct.CollectionTypeSchema {
  collectionName: 'authors';
  info: {
    description: '';
    displayName: 'Author';
    pluralName: 'authors';
    singularName: 'author';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::author.author'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    statistics: Schema.Attribute.Relation<
      'oneToMany',
      'api::statistic.statistic'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBlogBlog extends Struct.CollectionTypeSchema {
  collectionName: 'blogs';
  info: {
    description: '';
    displayName: 'News';
    pluralName: 'blogs';
    singularName: 'blog';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::blog.blog'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBrainUserBrainUser extends Struct.CollectionTypeSchema {
  collectionName: 'brain_users';
  info: {
    description: '';
    displayName: 'brainUser';
    pluralName: 'brain-users';
    singularName: 'brain-user';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean;
    avatar: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    continents: Schema.Attribute.Relation<
      'manyToMany',
      'api::continent.continent'
    >;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    entity: Schema.Attribute.Relation<'manyToOne', 'api::entity.entity'>;
    im_service_requests: Schema.Attribute.Relation<
      'oneToMany',
      'api::iminterest.iminterest'
    >;
    interest: Schema.Attribute.Relation<'oneToOne', 'api::interest.interest'>;
    lastName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::brain-user.brain-user'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    notifications: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    >;
    password: Schema.Attribute.String & Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    position: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    regions: Schema.Attribute.Relation<'manyToMany', 'api::region.region'>;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    uid: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBuyerContactBuyerContact
  extends Struct.CollectionTypeSchema {
  collectionName: 'buyer_contacts';
  info: {
    displayName: 'Buyer Contact';
    pluralName: 'buyer-contacts';
    singularName: 'buyer-contact';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    buyer: Schema.Attribute.Relation<'manyToOne', 'api::buyer.buyer'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::buyer-contact.buyer-contact'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'oneToMany',
      'api::opportunity.opportunity'
    >;
    phoneMobile: Schema.Attribute.String;
    phoneOffice: Schema.Attribute.String;
    position: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBuyerBuyer extends Struct.CollectionTypeSchema {
  collectionName: 'buyers';
  info: {
    description: '';
    displayName: 'Buyer';
    pluralName: 'buyers';
    singularName: 'buyer';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.String;
    buyer_contacts: Schema.Attribute.Relation<
      'oneToMany',
      'api::buyer-contact.buyer-contact'
    >;
    certifications: Schema.Attribute.Text;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commercial_name: Schema.Attribute.String;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    interests: Schema.Attribute.Relation<'oneToMany', 'api::interest.interest'>;
    legal_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::buyer.buyer'> &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      true
    >;
    opportunities: Schema.Attribute.Relation<
      'oneToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    volume: Schema.Attribute.String;
    webpage: Schema.Attribute.String;
  };
}

export interface ApiCategoryCategory extends Struct.CollectionTypeSchema {
  collectionName: 'categories';
  info: {
    description: '';
    displayName: 'Sustainability home';
    pluralName: 'categories';
    singularName: 'category';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::category.category'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCodeCode extends Struct.CollectionTypeSchema {
  collectionName: 'codes';
  info: {
    description: '';
    displayName: 'Code';
    pluralName: 'codes';
    singularName: 'code';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    classification: Schema.Attribute.String;
    code: Schema.Attribute.String;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    desc_en: Schema.Attribute.Text;
    desc_sp: Schema.Attribute.Text;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    im_service_requests: Schema.Attribute.Relation<
      'manyToMany',
      'api::iminterest.iminterest'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::code.code'> &
      Schema.Attribute.Private;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    parent: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    slug: Schema.Attribute.String;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.String;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiCommissionCommission extends Struct.CollectionTypeSchema {
  collectionName: 'commissions';
  info: {
    description: '';
    displayName: 'Commission';
    pluralName: 'commissions';
    singularName: 'commission';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    committees: Schema.Attribute.Relation<
      'oneToMany',
      'api::committee.committee'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crmName: Schema.Attribute.String;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::commission.commission'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    sector: Schema.Attribute.Relation<'manyToOne', 'api::sector.sector'>;
    services: Schema.Attribute.Relation<'manyToMany', 'api::service.service'>;
    source: Schema.Attribute.Enumeration<['Agexport', 'Banguat', 'EBOPS']>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    type: Schema.Attribute.Enumeration<['Productos', 'Servicios']>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiCommitteeCommittee extends Struct.CollectionTypeSchema {
  collectionName: 'committees';
  info: {
    description: '';
    displayName: 'Committee';
    pluralName: 'committees';
    singularName: 'committee';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commission: Schema.Attribute.Relation<
      'manyToOne',
      'api::commission.commission'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crmName: Schema.Attribute.String;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::committee.committee'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.Enumeration<['Agexport', 'Banguat', 'EBOPS']>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    subcommittees: Schema.Attribute.Relation<
      'oneToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    type: Schema.Attribute.Enumeration<['Productos', 'Servicios']>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContinentContinent extends Struct.CollectionTypeSchema {
  collectionName: 'continents';
  info: {
    displayName: 'Continent';
    pluralName: 'continents';
    singularName: 'continent';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::continent.continent'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCountryCountry extends Struct.CollectionTypeSchema {
  collectionName: 'countries';
  info: {
    description: '';
    displayName: 'Country';
    pluralName: 'countries';
    singularName: 'country';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean;
    alpha2: Schema.Attribute.String;
    alpha3: Schema.Attribute.String;
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    code: Schema.Attribute.String;
    continents: Schema.Attribute.Relation<
      'manyToMany',
      'api::continent.continent'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'oneToMany', 'api::entity.entity'>;
    im_service_requests: Schema.Attribute.Relation<
      'manyToMany',
      'api::iminterest.iminterest'
    >;
    iso: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::country.country'
    > &
      Schema.Attribute.Private;
    name_bg: Schema.Attribute.String;
    name_en: Schema.Attribute.String;
    name_sp: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    regions: Schema.Attribute.Relation<'manyToMany', 'api::region.region'>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    tradeshows: Schema.Attribute.Relation<
      'oneToMany',
      'api::tradeshow.tradeshow'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url_flag: Schema.Attribute.String;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiDocDoc extends Struct.CollectionTypeSchema {
  collectionName: 'docs';
  info: {
    description: '';
    displayName: 'Doc';
    pluralName: 'docs';
    singularName: 'doc';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    authors: Schema.Attribute.Relation<'manyToMany', 'api::author.author'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    content: Schema.Attribute.Blocks;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_creation: Schema.Attribute.Date;
    desc: Schema.Attribute.Blocks;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'> &
      Schema.Attribute.SetPluginOptions<{
        'content-manager': {
          hidden: true;
        };
      }>;
    docs_relations: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::doc.doc'> &
      Schema.Attribute.Private;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      true
    >;
    public: Schema.Attribute.Boolean;
    publishedAt: Schema.Attribute.DateTime;
    references: Schema.Attribute.Blocks;
    related_documents: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<
      [
        'Conferencia',
        'Estad\u00EDstica Independiente',
        'Estudio de Mercado',
        'Infograf\u00EDa',
        'Informe',
        'Investigaci\u00F3n de Mercado',
        'Ley',
        'Normas y Regulaciones',
        'Nota al Comercio',
        'Noticias',
        'Reglamento',
        'Repositorio',
        'Webinar',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiDomainDomain extends Struct.CollectionTypeSchema {
  collectionName: 'domains';
  info: {
    displayName: 'Domain';
    pluralName: 'domains';
    singularName: 'domain';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    domain: Schema.Attribute.String;
    entity: Schema.Attribute.Relation<'manyToOne', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::domain.domain'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEntityTypeEntityType extends Struct.CollectionTypeSchema {
  collectionName: 'entity_types';
  info: {
    displayName: 'Entity Type';
    pluralName: 'entity-types';
    singularName: 'entity-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    agexport_services: Schema.Attribute.Relation<
      'manyToMany',
      'api::service.service'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::entity-type.entity-type'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEntityEntity extends Struct.CollectionTypeSchema {
  collectionName: 'entities';
  info: {
    description: '';
    displayName: 'Entity';
    pluralName: 'entities';
    singularName: 'entity';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.String;
    associated: Schema.Attribute.Boolean;
    brain_users: Schema.Attribute.Relation<
      'oneToMany',
      'api::brain-user.brain-user'
    >;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    country: Schema.Attribute.Relation<'manyToOne', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crmCode: Schema.Attribute.String;
    desc: Schema.Attribute.Text;
    domains: Schema.Attribute.Relation<'oneToMany', 'api::domain.domain'>;
    email: Schema.Attribute.Email;
    entry_date: Schema.Attribute.Date;
    im_service_requests: Schema.Attribute.Relation<
      'oneToMany',
      'api::iminterest.iminterest'
    >;
    interests: Schema.Attribute.Relation<'oneToMany', 'api::interest.interest'>;
    legal_name: Schema.Attribute.String;
    license: Schema.Attribute.Relation<'manyToOne', 'api::license.license'>;
    licenseStartDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::entity.entity'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    nit: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    type: Schema.Attribute.Enumeration<
      [
        'Asociado',
        'Alianza',
        'Academia',
        'Particular',
        'No Asociado',
        'Agexport',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webpage: Schema.Attribute.String;
  };
}

export interface ApiFaqFaq extends Struct.CollectionTypeSchema {
  collectionName: 'faqs';
  info: {
    description: '';
    displayName: 'faq';
    pluralName: 'faqs';
    singularName: 'faq';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answer: Schema.Attribute.Blocks;
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGlobalGlobal extends Struct.SingleTypeSchema {
  collectionName: 'globals';
  info: {
    displayName: 'Global';
    pluralName: 'globals';
    singularName: 'global';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultSeo: Schema.Attribute.Component<'seo.seo', false>;
    favicon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::global.global'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    siteName: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGlossaryGlossary extends Struct.CollectionTypeSchema {
  collectionName: 'glossaries';
  info: {
    displayName: 'Glossary';
    pluralName: 'glossaries';
    singularName: 'glossary';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::glossary.glossary'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiIminterestIminterest extends Struct.CollectionTypeSchema {
  collectionName: 'iminterests';
  info: {
    description: '';
    displayName: 'IM service request';
    pluralName: 'iminterests';
    singularName: 'iminterest';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    agexport_service: Schema.Attribute.Relation<
      'manyToOne',
      'api::service.service'
    >;
    Apellido: Schema.Attribute.String;
    brain_user: Schema.Attribute.Relation<
      'manyToOne',
      'api::brain-user.brain-user'
    >;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    entity: Schema.Attribute.Relation<'manyToOne', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::iminterest.iminterest'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text;
    Nombre: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInterestInterest extends Struct.CollectionTypeSchema {
  collectionName: 'interests';
  info: {
    description: '';
    displayName: 'BI service request';
    pluralName: 'interests';
    singularName: 'interest';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_user: Schema.Attribute.Relation<
      'oneToOne',
      'api::brain-user.brain-user'
    >;
    buyer: Schema.Attribute.Relation<'manyToOne', 'api::buyer.buyer'>;
    channel: Schema.Attribute.Enumeration<
      ['manual', 'Brain portal', 'Whatsapp', 'Campaign']
    >;
    comments: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_posted: Schema.Attribute.Date;
    email: Schema.Attribute.String;
    entity: Schema.Attribute.Relation<'manyToOne', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::interest.interest'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunity: Schema.Attribute.Relation<
      'manyToOne',
      'api::opportunity.opportunity'
    >;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.Enumeration<['New', 'Review', 'Done']>;
    type: Schema.Attribute.Enumeration<
      ['Opportunity Info', 'Tradeshow Info', 'Buyer Info']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiLicenseLicense extends Struct.CollectionTypeSchema {
  collectionName: 'licenses';
  info: {
    description: '';
    displayName: 'License';
    pluralName: 'licenses';
    singularName: 'license';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    duration: Schema.Attribute.Integer;
    entities: Schema.Attribute.Relation<'oneToMany', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::license.license'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    restrictedFeatures: Schema.Attribute.Enumeration<
      ['feature1', 'feature2', 'feature3']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNotificationNotification
  extends Struct.CollectionTypeSchema {
  collectionName: 'notifications';
  info: {
    displayName: 'Notification';
    pluralName: 'notifications';
    singularName: 'notification';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_user: Schema.Attribute.Relation<
      'manyToOne',
      'api::brain-user.brain-user'
    >;
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['New', 'Opened', 'Closed', 'Deleted']
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOpportunityOpportunity extends Struct.CollectionTypeSchema {
  collectionName: 'opportunities';
  info: {
    description: '';
    displayName: 'Opportunity';
    pluralName: 'opportunities';
    singularName: 'opportunity';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    buyer: Schema.Attribute.Relation<'manyToOne', 'api::buyer.buyer'>;
    buyer_classification: Schema.Attribute.String;
    buyer_contact: Schema.Attribute.Relation<
      'manyToOne',
      'api::buyer-contact.buyer-contact'
    >;
    certifications: Schema.Attribute.Text;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_end: Schema.Attribute.Date;
    description: Schema.Attribute.RichText;
    destination_port: Schema.Attribute.String;
    frequency: Schema.Attribute.String;
    interests: Schema.Attribute.Relation<'oneToMany', 'api::interest.interest'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::opportunity.opportunity'
    > &
      Schema.Attribute.Private;
    media: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      true
    >;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    state: Schema.Attribute.Enumeration<['Active', 'Close']>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    volume: Schema.Attribute.String;
  };
}

export interface ApiRegionRegion extends Struct.CollectionTypeSchema {
  collectionName: 'regions';
  info: {
    displayName: 'Region';
    pluralName: 'regions';
    singularName: 'region';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::region.region'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRegulationRegulation extends Struct.CollectionTypeSchema {
  collectionName: 'regulations';
  info: {
    description: '';
    displayName: 'Regulation';
    pluralName: 'regulations';
    singularName: 'regulation';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'Requisitos Legales Obligatorios',
        'Requisitos de Mercado Obligatorios',
        'Est\u00E1ndares Voluntarios',
      ]
    >;
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::regulation.regulation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceResource extends Struct.CollectionTypeSchema {
  collectionName: 'resources';
  info: {
    description: '';
    displayName: 'Resource';
    pluralName: 'resources';
    singularName: 'resource';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'Cursos de Formaci\u00F3n en l\u00EDnea',
        'Gu\u00EDas y protocolos',
        'Fuentes de Consulta Comercio Sostenible',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    links: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSectorSector extends Struct.CollectionTypeSchema {
  collectionName: 'sectors';
  info: {
    description: '';
    displayName: 'Sector';
    pluralName: 'sectors';
    singularName: 'sector';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'oneToMany',
      'api::commission.commission'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crmName: Schema.Attribute.String;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sector.sector'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    services: Schema.Attribute.Relation<'manyToMany', 'api::service.service'>;
    source: Schema.Attribute.Enumeration<['Banguat', 'Agexport', 'EBOPS']>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    type: Schema.Attribute.Enumeration<['Productos', 'Servicios']>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
  collectionName: 'services';
  info: {
    description: '';
    displayName: 'Agexport Service';
    pluralName: 'services';
    singularName: 'service';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<['Inteligencia', 'Negocios']>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    entity_types: Schema.Attribute.Relation<
      'manyToMany',
      'api::entity-type.entity-type'
    >;
    im_service_requests: Schema.Attribute.Relation<
      'oneToMany',
      'api::iminterest.iminterest'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service.service'
    > &
      Schema.Attribute.Private;
    notificationEmail: Schema.Attribute.Email;
    price: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStatisticStatistic extends Struct.CollectionTypeSchema {
  collectionName: 'statistics';
  info: {
    description: '';
    displayName: 'statistic';
    pluralName: 'statistics';
    singularName: 'statistic';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    axisTitleX: Schema.Attribute.String;
    axisTitleY: Schema.Attribute.String;
    chart_series: Schema.Attribute.Component<'chart-serie.chart-serie', true>;
    chart_theme: Schema.Attribute.Enumeration<
      ['corporativo', 'corporativo_soft', 'glass']
    >;
    chart_type: Schema.Attribute.Enumeration<['bar', 'line', 'pie']>;
    chartTitle: Schema.Attribute.String;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    content: Schema.Attribute.Blocks;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    desc: Schema.Attribute.Blocks;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::statistic.statistic'
    > &
      Schema.Attribute.Private;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      false
    >;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    slug: Schema.Attribute.UID<'title'>;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiSubcommitteeSubcommittee
  extends Struct.CollectionTypeSchema {
  collectionName: 'subcommittees';
  info: {
    description: '';
    displayName: 'Subcommittee';
    pluralName: 'subcommittees';
    singularName: 'subcommittee';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    committee: Schema.Attribute.Relation<
      'manyToOne',
      'api::committee.committee'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crmName: Schema.Attribute.String;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subcommittee.subcommittee'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.Enumeration<['Agexport', 'Banguat', 'EBOPS']>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    type: Schema.Attribute.Enumeration<['Productos', 'Servicios']>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiTagTag extends Struct.CollectionTypeSchema {
  collectionName: 'tags';
  info: {
    displayName: 'Tag';
    pluralName: 'tags';
    singularName: 'tag';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    blogs: Schema.Attribute.Relation<'manyToMany', 'api::blog.blog'>;
    brain_users: Schema.Attribute.Relation<
      'manyToMany',
      'api::brain-user.brain-user'
    >;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    desc: Schema.Attribute.Text;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    glossaries: Schema.Attribute.Relation<
      'manyToMany',
      'api::glossary.glossary'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tag.tag'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    opportunities: Schema.Attribute.Relation<
      'manyToMany',
      'api::opportunity.opportunity'
    >;
    publishedAt: Schema.Attribute.DateTime;
    regulations: Schema.Attribute.Relation<
      'manyToMany',
      'api::regulation.regulation'
    >;
    resources: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource.resource'
    >;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tradeshows: Schema.Attribute.Relation<
      'manyToMany',
      'api::tradeshow.tradeshow'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinars: Schema.Attribute.Relation<'manyToMany', 'api::webinar.webinar'>;
  };
}

export interface ApiTradeshowTradeshow extends Struct.CollectionTypeSchema {
  collectionName: 'tradeshows';
  info: {
    description: '';
    displayName: 'Tradeshow';
    pluralName: 'tradeshows';
    singularName: 'tradeshow';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    activities: Schema.Attribute.Blocks;
    benefits: Schema.Attribute.Blocks;
    buyers: Schema.Attribute.Relation<'manyToMany', 'api::buyer.buyer'>;
    city: Schema.Attribute.String;
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    committees: Schema.Attribute.Relation<
      'manyToMany',
      'api::committee.committee'
    >;
    contact: Schema.Attribute.Blocks;
    country: Schema.Attribute.Relation<'manyToOne', 'api::country.country'>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_end: Schema.Attribute.Date;
    date_start: Schema.Attribute.Date;
    description: Schema.Attribute.Blocks;
    edition: Schema.Attribute.String;
    entities: Schema.Attribute.Relation<'manyToMany', 'api::entity.entity'>;
    expected_visitors: Schema.Attribute.Integer;
    floorsize: Schema.Attribute.String;
    format: Schema.Attribute.Enumeration<['Presencial', 'Virtual']>;
    frequency: Schema.Attribute.Enumeration<
      ['Anual', 'Mensual', 'Cada 2 a\u00F1os', 'Cada 3 a\u00F1os']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tradeshow.tradeshow'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    name: Schema.Attribute.String;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      true
    >;
    organizers: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    qty_stands: Schema.Attribute.Integer;
    reference: Schema.Attribute.Blocks;
    related_documents: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    statistic_info: Schema.Attribute.Blocks;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webpage: Schema.Attribute.String;
  };
}

export interface ApiWebinarWebinar extends Struct.CollectionTypeSchema {
  collectionName: 'webinars';
  info: {
    description: '';
    displayName: 'webinar';
    pluralName: 'webinars';
    singularName: 'webinar';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    codes: Schema.Attribute.Relation<'manyToMany', 'api::code.code'>;
    commissions: Schema.Attribute.Relation<
      'manyToMany',
      'api::commission.commission'
    >;
    content: Schema.Attribute.Blocks;
    countries: Schema.Attribute.Relation<'manyToMany', 'api::country.country'>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    docs: Schema.Attribute.Relation<'manyToMany', 'api::doc.doc'>;
    event_date: Schema.Attribute.Date;
    event_end_time: Schema.Attribute.Time;
    event_start_time: Schema.Attribute.Time;
    interests: Schema.Attribute.Relation<
      'manyToMany',
      'api::interest.interest'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::webinar.webinar'
    > &
      Schema.Attribute.Private;
    notificationMode: Schema.Attribute.Enumeration<
      ['none', 'test', 'normal', 'both']
    >;
    notificationTestEmail: Schema.Attribute.Email;
    notify: Schema.Attribute.Component<
      'notifications.notification-selector',
      false
    >;
    organizer: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    sectors: Schema.Attribute.Relation<'manyToMany', 'api::sector.sector'>;
    signup_url: Schema.Attribute.String;
    speaker: Schema.Attribute.String;
    statistics: Schema.Attribute.Relation<
      'manyToMany',
      'api::statistic.statistic'
    >;
    subcommittees: Schema.Attribute.Relation<
      'manyToMany',
      'api::subcommittee.subcommittee'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    video_url: Schema.Attribute.String;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginGroupManagerGroup extends Struct.CollectionTypeSchema {
  collectionName: 'group_manager_groups';
  info: {
    displayName: 'Group';
    pluralName: 'groups';
    singularName: 'group';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    collectionTypes: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    components: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.String & Schema.Attribute.DefaultTo<'folder'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::group-manager.group'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::about.about': ApiAboutAbout;
      'api::author.author': ApiAuthorAuthor;
      'api::blog.blog': ApiBlogBlog;
      'api::brain-user.brain-user': ApiBrainUserBrainUser;
      'api::buyer-contact.buyer-contact': ApiBuyerContactBuyerContact;
      'api::buyer.buyer': ApiBuyerBuyer;
      'api::category.category': ApiCategoryCategory;
      'api::code.code': ApiCodeCode;
      'api::commission.commission': ApiCommissionCommission;
      'api::committee.committee': ApiCommitteeCommittee;
      'api::continent.continent': ApiContinentContinent;
      'api::country.country': ApiCountryCountry;
      'api::doc.doc': ApiDocDoc;
      'api::domain.domain': ApiDomainDomain;
      'api::entity-type.entity-type': ApiEntityTypeEntityType;
      'api::entity.entity': ApiEntityEntity;
      'api::faq.faq': ApiFaqFaq;
      'api::global.global': ApiGlobalGlobal;
      'api::glossary.glossary': ApiGlossaryGlossary;
      'api::iminterest.iminterest': ApiIminterestIminterest;
      'api::interest.interest': ApiInterestInterest;
      'api::license.license': ApiLicenseLicense;
      'api::notification.notification': ApiNotificationNotification;
      'api::opportunity.opportunity': ApiOpportunityOpportunity;
      'api::region.region': ApiRegionRegion;
      'api::regulation.regulation': ApiRegulationRegulation;
      'api::resource.resource': ApiResourceResource;
      'api::sector.sector': ApiSectorSector;
      'api::service.service': ApiServiceService;
      'api::statistic.statistic': ApiStatisticStatistic;
      'api::subcommittee.subcommittee': ApiSubcommitteeSubcommittee;
      'api::tag.tag': ApiTagTag;
      'api::tradeshow.tradeshow': ApiTradeshowTradeshow;
      'api::webinar.webinar': ApiWebinarWebinar;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::group-manager.group': PluginGroupManagerGroup;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
