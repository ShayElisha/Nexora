import { usePermission, useMultiplePermissions } from "../hooks/usePermission";
import { useTranslation } from "react-i18next";
import { Loader2, Lock } from "lucide-react";

/**
 * Component to guard content based on user permissions
 * @param {Object} props
 * @param {string} props.module - The module name (e.g., 'employees', 'finance')
 * @param {string} props.action - The action name (e.g., 'view', 'create', 'update', 'delete')
 * @param {React.ReactNode} props.children - Content to render if user has permission
 * @param {React.ReactNode} props.fallback - Content to render if user doesn't have permission (default: null)
 * @param {boolean} props.showMessage - Show a message if user doesn't have permission (default: false)
 * @param {string} props.message - Custom message to show (default: uses translation)
 */
export const PermissionGuard = ({
  module,
  action,
  children,
  fallback = null,
  showMessage = false,
  message = null,
}) => {
  const { hasPermission, isLoading } = usePermission(module, action);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!hasPermission) {
    if (showMessage) {
      return (
        <div
          className="text-center p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-sm font-medium">
            {message || t("permissions.noAccess") || "You don't have permission to access this content"}
          </p>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

/**
 * Higher-Order Component to protect a component based on permissions
 * @param {React.Component} Component - Component to protect
 * @param {string} module - The module name
 * @param {string} action - The action name
 * @param {React.Component} FallbackComponent - Component to render if no permission
 */
export const withPermission = (Component, module, action, FallbackComponent = null) => {
  return function ProtectedComponent(props) {
    return (
      <PermissionGuard
        module={module}
        action={action}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

/**
 * Component to show content only if user has ALL of the specified permissions
 * @param {Object} props
 * @param {Array<{module: string, action: string}>} props.permissions - Array of required permissions
 * @param {React.ReactNode} props.children - Content to render if user has all permissions
 */
export const RequireAllPermissions = ({ permissions = [], children, fallback = null }) => {
  const { permissions: userPermissions, isLoading, allGranted } = useMultiplePermissions(permissions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!allGranted) {
    return fallback;
  }

  return children;
};

/**
 * Component to show content if user has ANY of the specified permissions
 * @param {Object} props
 * @param {Array<{module: string, action: string}>} props.permissions - Array of permissions (user needs at least one)
 * @param {React.ReactNode} props.children - Content to render if user has at least one permission
 */
export const RequireAnyPermission = ({ permissions = [], children, fallback = null }) => {
  const { permissions: userPermissions, isLoading } = useMultiplePermissions(permissions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const hasAnyPermission = permissions.some(({ module, action }) => {
    return userPermissions?.[module]?.[action] === true;
  });

  if (!hasAnyPermission) {
    return fallback;
  }

  return children;
};

