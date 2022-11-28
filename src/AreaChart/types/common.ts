export enum Period {
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    QUARTER = "quarter",
    YEAR = "year",
  }
  
  export enum APIPeriod {
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
  }
  
  export enum QuestionType {
    TEXT_INPUT = "freeForm",
    MULTILINE_INPUT = "freeFormMultiline",
    SINGLE_SELECTION = "singleSelection", // single-select dropdown
    MULTIPLE_SELECTION = "multipleSelection", // multi-select dropdown
    TOGGLE = "toggle",
    IMG_UPLOAD = "upload",
    PASSWORD = "hiddenForm",
    NUMBER = "numberForm",
    NO_INPUT = "noForm",
  }
  
  export enum MiniCardStatus {
    DONE,
    IN_PROGRESS,
    TO_DO,
  }
  
  export enum ConnectStatus {
    CONNECT = "connect",
    IN_PROGRESS = "in progress",
    CONNECTED = "connected",
  }
  
  export interface TimeSeriesData {
    timestamp: string;
    value?: number | null;
    [key: string]: number | string | null | undefined;
  }
  
  export interface VisualizationCardResponse {
    title: string;
    observation: string;
  }
  