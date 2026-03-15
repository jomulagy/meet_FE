import React, { createContext, useCallback, useContext, useState } from "react";

interface ErrorState {
  message: string;
  onClose?: () => void;
}

interface ErrorPopupContextValue {
  showError: (message: string, onClose?: () => void) => void;
}

const ErrorPopupContext = createContext<ErrorPopupContextValue>({
  showError: () => {},
});

export const useErrorPopup = () => useContext(ErrorPopupContext);

export const ErrorPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((message: string, onClose?: () => void) => {
    setError({ message, onClose });
  }, []);

  const handleClose = useCallback(() => {
    const callback = error?.onClose;
    setError(null);
    callback?.();
  }, [error]);

  return (
    <ErrorPopupContext.Provider value={{ showError }}>
      {children}
      {error && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[100]"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-[24px] shadow-lg px-6 py-6 w-4/5 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                className="text-[#8E8E93] bg-transparent text-sm"
                onClick={handleClose}
              >
                &#x2715;
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
                <i className="fa-solid fa-circle-exclamation text-[#FF3B30] text-xl"></i>
              </div>
              <p className="text-[15px] font-semibold text-[#1C1C1E] text-center whitespace-pre-wrap">
                {error.message}
              </p>
            </div>
            <button
              className="w-full bg-[#FFE607] rounded-[24px] py-3 text-[15px] font-bold text-[#1C1C1E]"
              onClick={handleClose}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </ErrorPopupContext.Provider>
  );
};
