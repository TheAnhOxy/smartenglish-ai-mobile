import { create } from 'zustand';
import { UserRole } from '../types/schema';
import { apiClient } from '../api/client';
import { useAuthStore } from './authStore';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    learn_flashcard: true,
    learn_courses: true,
    take_quiz_exam: true,
    use_ai_scan: true,
    join_class_submit: true,
    use_community: true,
    access_ai_tools: true,
    view_students: true,
    edit_students: true,
    delete_students: true,
    create_classes: true,
    assign_homework: true,
    create_lessons: true,
    publish_exams: true,
    approve_public_content: true,
    view_revenue: true,
    manage_pricing: true,
    view_audit_logs: true,
    manage_reports: true,
    manage_settings: true,
  },
  teacher: {
    learn_flashcard: true,
    learn_courses: true,
    take_quiz_exam: true,
    use_ai_scan: true,
    join_class_submit: true,
    use_community: true,
    access_ai_tools: true,
    view_students: true,
    edit_students: true,
    delete_students: true,
    create_classes: true,
    assign_homework: true,
    create_lessons: true,
    publish_exams: true,
    approve_public_content: false,
    view_revenue: true,
    manage_pricing: false,
    view_audit_logs: true,
    manage_reports: false,
    manage_settings: false,
  },
  student: {
    learn_flashcard: true,
    learn_courses: true,
    take_quiz_exam: true,
    use_ai_scan: true,
    join_class_submit: true,
    use_community: true,
    access_ai_tools: true,
    view_students: false,
    edit_students: false,
    delete_students: false,
    create_classes: false,
    assign_homework: false,
    create_lessons: false,
    publish_exams: false,
    approve_public_content: false,
    view_revenue: false,
    manage_pricing: false,
    view_audit_logs: false,
    manage_reports: false,
    manage_settings: false,
  },
  guest: {
    learn_flashcard: true,
    learn_courses: true,
    take_quiz_exam: true,
    use_ai_scan: false,
    join_class_submit: false,
    use_community: false,
    access_ai_tools: true,
    view_students: false,
    edit_students: false,
    delete_students: false,
    create_classes: false,
    assign_homework: false,
    create_lessons: false,
    publish_exams: false,
    approve_public_content: false,
    view_revenue: false,
    manage_pricing: false,
    view_audit_logs: false,
    manage_reports: false,
    manage_settings: false,
  },
};

/** Vai trò hiệu lực: người đã đăng nhập theo tài khoản, chưa đăng nhập luôn là khách. */
const resolveEffectiveRole = (overrideRole?: string | null): string => {
  const authUser = useAuthStore.getState().currentUser;
  const raw = overrideRole || authUser?.role || 'guest';
  return String(raw).toLowerCase().replace(/^role_/, '');
};

interface RoleGateState {
  currentRole: UserRole | null;
  /** Người dùng chọn "Dùng thử" — vào khu học viên với quyền khách, không cần tài khoản */
  guestMode: boolean;
  rolePermissions: Record<string, Record<string, boolean>>;
  setRole: (role: UserRole | null) => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  getRouteForRole: (role: UserRole | null, onboardingCompleted?: boolean) => string;
  isGuest: () => boolean;
  canAccessDataScope: (scope: 'ALL' | 'SELF' | 'CLASS' | 'PUBLIC') => boolean;
  hasPermission: (permKey: string, overrideRole?: string | null) => boolean;
  syncRolePermissions: () => Promise<void>;
}

export const useRoleGateStore = create<RoleGateState>((set, get) => ({
  // Trước đây mặc định 'student' → người CHƯA đăng nhập bị tính quyền như học viên
  currentRole: null,
  guestMode: false,
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,

  setRole: (role) => set({ currentRole: role }),
  enterGuestMode: () => set({ guestMode: true, currentRole: 'guest' }),
  exitGuestMode: () => set({ guestMode: false }),

  isGuest: () => resolveEffectiveRole() === 'guest',

  hasPermission: (permKey: string, overrideRole?: string | null) => {
    const roleKey = resolveEffectiveRole(overrideRole);
    if (roleKey === 'admin' || roleKey === 'super_admin') return true;
    const map = get().rolePermissions[roleKey] || DEFAULT_ROLE_PERMISSIONS[roleKey] || DEFAULT_ROLE_PERMISSIONS.guest;
    // Quyền không khai báo → từ chối (tránh gõ sai key mà vô tình mở quyền)
    return Boolean(map[permKey]);
  },

  syncRolePermissions: async () => {
    try {
      const res = await apiClient.get('/auth/roles');
      const rolesList = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(rolesList) && rolesList.length > 0) {
        const nextMap: Record<string, Record<string, boolean>> = {
          ...get().rolePermissions,
        };
        for (const r of rolesList) {
          const rId = String(r.id || r.code || '').toLowerCase();
          if (rId && r.permissions && typeof r.permissions === 'object') {
            nextMap[rId] = {
              ...(DEFAULT_ROLE_PERMISSIONS[rId] || {}),
              ...r.permissions,
            };
          }
        }
        set({ rolePermissions: nextMap });
      }
    } catch (_) {
      // Fallback giữ nguyên cấu hình mặc định nếu mất kết nối
    }
  },

  canAccessDataScope: (scope) => {
    const role = resolveEffectiveRole();
    if (role === 'admin') return true;
    if (scope === 'PUBLIC') return true;
    if (role === 'guest') return false; // Guest can only access PUBLIC data
    if (role === 'student' || role === 'teacher') {
      return scope === 'SELF' || scope === 'CLASS';
    }
    return false;
  },

  getRouteForRole: (role, onboardingCompleted = true) => {
    if (!role) {
      return '/(auth)/login';
    }
    if (role === 'admin') {
      return '/admin-blocked';
    }
    if (role === 'teacher') {
      return '/(teacher-companion)/classes';
    }
    if (role === 'student' || role === 'guest') {
      if (!onboardingCompleted && role === 'student') {
        return '/(auth)/welcome';
      }
      return '/(student)/home';
    }
    return '/(auth)/login';
  }
}));
