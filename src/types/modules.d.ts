declare module "mailparser" {
  interface AddressObject {
    text: string;
    value: Array<{ address: string; name: string }>;
  }
  interface ParsedMail {
    messageId?: string;
    from?: AddressObject;
    to?: AddressObject | AddressObject[];
    subject?: string;
    text?: string;
    html?: string;
    attachments: Array<{
      filename?: string;
      content: Buffer;
      contentType: string;
      size: number;
    }>;
  }
  export function simpleParser(source: Buffer | NodeJS.ReadableStream): Promise<ParsedMail>;
}

declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export default pdfParse;
}

declare module "xlsx" {
  export function readFile(filename: string, opts?: Record<string, unknown>): WorkBook;
  export function read(data: Buffer | string, opts?: Record<string, unknown>): WorkBook;
  export const utils: {
    sheet_to_json<T = unknown>(sheet: WorkSheet, opts?: Record<string, unknown>): T[];
  };
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  export interface WorkSheet {
    [key: string]: unknown;
  }
}

declare module "imapflow" {
  export class ImapFlow {
    constructor(config: Record<string, unknown>);
    connect(): Promise<void>;
    getMailboxLock(path: string): Promise<{ release: () => void }>;
    fetch(range: unknown, options: Record<string, unknown>): AsyncIterable<ImapMessage>;
    messageFlagsSet(range: unknown, flags: string[]): Promise<void>;
    logout(): Promise<void>;
  }
  interface ImapMessage {
    uid: number;
    source: Buffer;
  }
}
