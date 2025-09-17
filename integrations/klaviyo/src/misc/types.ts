export type ProfileSubscriptions = {
  email?: {
    marketing: {
      consent: "SUBSCRIBED";
      consented_at?: string;
    };
  };
  sms?: {
    marketing: {
      consent: "SUBSCRIBED";
      consented_at?: string;
    };
  };
};

export type KlaviyoPropertyValue = string | number | boolean | null;
