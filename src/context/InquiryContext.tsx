import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { emptyInquiry, type InquiryValues } from '../lib/inquiry';

const InquiryContext = createContext<{ draft: InquiryValues; setDraft: Dispatch<SetStateAction<InquiryValues>> } | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  // Keep a draft across routes without writing personal information to browser storage.
  const [draft, setDraft] = useState<InquiryValues>(emptyInquiry);
  const value = useMemo(() => ({ draft, setDraft }), [draft]);
  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiryDraft() {
  const context = useContext(InquiryContext);
  if (!context) throw new Error('InquiryProvider is required.');
  return context;
}