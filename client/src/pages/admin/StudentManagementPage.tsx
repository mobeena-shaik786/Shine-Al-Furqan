import { AddManagedUserModal } from '../../components/admin/AddManagedUserModal';
import { UserRoleManagementPage } from './UserRoleManagementPage';

export function StudentManagementPage() {
  return (
    <UserRoleManagementPage
      managedRole="student"
      title="Students Management"
      description="Create and manage student accounts stored in MongoDB"
      addLabel="Add Student"
      AddModal={(props) => (
        <AddManagedUserModal
          {...props}
          title="Add Student"
          submitLabel="Submit"
          layout="student"
          emailPlaceholder="student@example.com"
        />
      )}
    />
  );
}

export default StudentManagementPage;
