import { AddManagedUserModal } from '../../components/admin/AddManagedUserModal';
import { UserRoleManagementPage } from './UserRoleManagementPage';

export function AdminManagementPage() {
  return (
    <UserRoleManagementPage
      managedRole="admin"
      title="Admins Management"
      description="Create and manage administrator accounts stored in MongoDB"
      addLabel="Add Admin"
      AddModal={(props) => (
        <AddManagedUserModal {...props} title="Add Admin" submitLabel="Create Admin" />
      )}
    />
  );
}

export default AdminManagementPage;
