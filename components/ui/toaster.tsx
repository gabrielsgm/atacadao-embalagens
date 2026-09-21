"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

export type ToastOptions = Omit<ToastData, "id">;

type ToastListener = (data: ToastData) => void;
const listeners = new Set<ToastListener>();

export function toast(data: ToastOptions) {
  const id = Math.random().toString(36).slice(2);
  const toastItem: ToastData = { ...data, id };
  listeners.forEach((listener) => listener(toastItem));
}

export function useToast() {
  return { toast };
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  React.useEffect(() => {
    const handleNewToast: ToastListener = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 5000);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-brand-400 shrink-0" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    info: "border-brand-500/30",
  };

  return (
    <ToastPrimitive.Provider>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
          className={cn(
            "glass-strong rounded-xl p-4 flex items-start gap-3 shadow-card animate-slide-up",
            "border",
            borderColors[t.type]
          )}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <ToastPrimitive.Title className="text-sm font-semibold text-white">
              {t.title}
            </ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description className="text-xs text-surface-50 mt-0.5">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className="shrink-0 text-surface-100 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm" />
    </ToastPrimitive.Provider>
  );
}
