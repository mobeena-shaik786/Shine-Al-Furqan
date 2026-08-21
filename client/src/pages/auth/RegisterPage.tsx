import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';

/**
 * Public self-registration is not enabled — accounts are created by academy staff.
 * This page keeps the same split auth layout.
 */
export function RegisterPage() {
  return <AuthSplitLayout panelEyebrow="Create your academy account">{null}</AuthSplitLayout>;
}

export default RegisterPage;
