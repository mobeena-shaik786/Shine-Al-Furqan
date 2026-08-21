import { AddManagedUserModal } from '../../components/admin/AddManagedUserModal';
import { UserRoleManagementPage } from './UserRoleManagementPage';

export function UstadManagementPage() {
  return (
    <UserRoleManagementPage
      managedRole="ustad"
      title="Ustad Management"
      description="Create and manage ustad accounts stored in MongoDB"
      addLabel="Add Ustad"
      AddModal={(props) => (
        <AddManagedUserModal
          {...props}
          title="Add Ustad"
          submitLabel="Submit"
          layout="ustad"
          emailPlaceholder="ustad@example.com"
        />
      )}
    />
  );
}

export default UstadManagementPage;
