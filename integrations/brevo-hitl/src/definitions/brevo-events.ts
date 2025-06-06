export interface BrevoMessage {
  type: 'agent' | 'visitor';
  id: string;
  text: string;
  html: string;
  createdAt: number;
  agentId?: string;
  agentName?: string;
  agentUserpic?: string | null;
  isPushed?: boolean;
  isTrigger?: boolean;
  file?: BrevoMessageFile;
  isMissed?: boolean;
}

export interface BrevoMessageImageInfo {
  width: number;
  height: number;
  previewUrl: string;
}

export interface BrevoMessageFile {
  name: string;
  size: number;
  isAllowedFileType: boolean;
  isImage: boolean;
  isSticker: boolean;
  link: string;
  imageInfo?: BrevoMessageImageInfo;
}

export interface BrevoAgent {
  id: string;
  name: string;
  email: string;
  userpic?: string | null;
}

export interface BrevoVisitorLastVisitPage {
  link: string;
  title: string;
}

export interface BrevoVisitorLastVisit {
  startedAt: number;
  finishedAt?: number | null;
  hostName: string;
  viewedPages: BrevoVisitorLastVisitPage[];
}

export interface BrevoVisitorContactAttributes {
  [key: string]: any; // Or more specific types if known, e.g., SMS: string;
}

export interface BrevoVisitorIntegrationAttributes {
  [key: string]: any; // E.g., FIRSTNAME: string; EMAIL: string;
}

export interface BrevoVisitorAttributes {
  [key: string]: any; // Combination of the above two
}

export interface BrevoVisitorFormattedAttributes {
  [key: string]: any; // E.g., SMS: string;
}

export interface BrevoVisitor {
  id: string;
  threadId: string;
  threadLink: string;
  source: string;
  sourceChannelRef?: string | null;
  sourceChannelLink?: string | null;
  sourceConversationRef?: string | null;
  groupId?: string | null;
  color: string;
  ip: string;
  browserLanguage: string;
  conversationLanguage: string;
  browser: string;
  os: string;
  userAgent: string;
  country: string;
  city: string;
  lastVisit?: BrevoVisitorLastVisit | null;
  displayedName: string;
  contactAttributes?: BrevoVisitorContactAttributes | null;
  integrationAttributes?: BrevoVisitorIntegrationAttributes | null;
  attributes?: BrevoVisitorAttributes | null;
  formattedAttributes?: BrevoVisitorFormattedAttributes | null;
  notes?: string | null;
  contactId?: number | null;
  marketingConsent: boolean;
  termsOfServiceConsent: boolean;
}

export interface BrevoConversationFragmentEvent {
  eventName: "conversationFragment";
  conversationId: string;
  messages: BrevoMessage[];
  agents: BrevoAgent[];
  visitor: BrevoVisitor;
  isNoAvailableAgent?: boolean; // Added as it's a common field in conversation events
}

export interface BrevoConversationStartPage {
  link: string;
  title: string;
}

export interface BrevoConversationTranscriptEvent {
  eventName: "conversationTranscript";
  conversationId: string;
  conversationStartPage: BrevoConversationStartPage;
  messages: BrevoMessage[];
  missedMessagesCount: number;
  agents: BrevoAgent[];
  visitor: BrevoVisitor;
} 