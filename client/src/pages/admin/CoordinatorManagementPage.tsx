import { AddManagedUserModal } from '../../components/admin/AddManagedUserModal';
import { UserRoleManagementPage } from './UserRoleManagementPage';

export function CoordinatorManagementPage() {
  return (
    <UserRoleManagementPage
      managedRole="coordinator"
      title="Coordinator Management"
      description="Create and manage coordinator accounts stored in MongoDB"
      addLabel="Add Coordinator"
      AddModal={(props) => (
        <AddManagedUserModal
          {...props}
          title="Add Coordinator"
          submitLabel="Submit"
          layout="profile"
          emailPlaceholder="coordinator@example.com"
        />
      )}
    />
  );
}

export default CoordinatorManagementPage;
