interface sendSuccess {
    email: string;
    messageId: string;
  }
  
interface sendFailed {
    email: string;
    error: string;
  }
  
  export interface sendResults {
    successful: sendSuccess[];
    failed: sendFailed[];
  }