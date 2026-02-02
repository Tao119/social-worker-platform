"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface PageLayoutProps {
  activeItem: string;
  title?: string;
  description?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  fullWidth?: boolean;
  noPadding?: boolean;
}

/**
 * PageLayout - 全ページ共通のレイアウトコンポーネント
 *
 * Usage:
 * <PageLayout activeItem="dashboard" title="ダッシュボード" description="概要を確認">
 *   {children}
 * </PageLayout>
 */
export default function PageLayout({
  activeItem,
  title,
  description,
  children,
  headerActions,
  fullWidth = false,
  noPadding = false,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem={activeItem} />

      <main className="flex-1 overflow-y-auto">
        {/* Page Header */}
        {(title || description) && (
          <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
            <div className={fullWidth ? "" : "max-w-6xl mx-auto"}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {title && (
                    <h2 className="text-2xl font-black text-[#0d141b] mb-2">{title}</h2>
                  )}
                  {description && (
                    <p className="text-[#4c739a]">{description}</p>
                  )}
                </div>
                {headerActions && (
                  <div className="flex items-center gap-3 shrink-0">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className={noPadding ? "" : `px-8 py-6 ${fullWidth ? "" : "max-w-6xl mx-auto"}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

interface PageLoadingProps {
  activeItem: string;
}

/**
 * PageLoading - 共通ローディング表示
 */
export function PageLoading({ activeItem }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem={activeItem} />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#2b8cee]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#4c739a]">読み込み中...</p>
        </div>
      </main>
    </div>
  );
}

interface PageErrorProps {
  activeItem: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * PageError - 共通エラー表示
 */
export function PageError({ activeItem, title, message, onRetry }: PageErrorProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem={activeItem} />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {title && <h3 className="text-lg font-bold text-[#0d141b] mb-2">{title}</h3>}
          {message && <p className="text-[#4c739a] mb-4">{message}</p>}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
            >
              再試行
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState - 共通の空状態表示
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-[#cfdbe7] p-12 text-center">
      {icon && (
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      {title && <h3 className="text-lg font-bold text-[#0d141b] mb-2">{title}</h3>}
      {description && <p className="text-[#4c739a] mb-4">{description}</p>}
      {action}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
}

/**
 * Card - 共通カードコンポーネント
 */
export function Card({ children, className = "", padding = "p-6" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#cfdbe7] ${padding} ${className}`}>
      {children}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * Button - 共通ボタンコンポーネント
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  type = "button",
}: ButtonProps) {
  const baseStyles = "font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50";

  const variants = {
    primary: "bg-[#2b8cee] text-white hover:bg-[#2b8cee]/90",
    secondary: "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-[#4c739a] hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

type AlertType = "info" | "success" | "warning" | "error";

interface AlertProps {
  type?: AlertType;
  children: ReactNode;
  onClose?: () => void;
}

/**
 * Alert - 共通アラートコンポーネント
 */
export function Alert({ type = "info", children, onClose }: AlertProps) {
  const types = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  };

  const style = types[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 ${style.text} text-sm flex items-start gap-3`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb - パンくずリスト
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg className="w-4 h-4 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <a href={item.href} className="text-[#4c739a] hover:text-[#2b8cee] transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-[#0d141b] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
