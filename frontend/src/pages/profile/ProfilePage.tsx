import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../store/auth';
import { usersApi, authApi } from '../../services';
import { Button, Input, Card, Avatar } from '../../components/ui';
import { getRoleLabel } from '../../utils';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: profileSubmitting } } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone || '' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { isSubmitting: pwdSubmitting } } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const updateProfile = useMutation({
    mutationFn: (data: object) => usersApi.updateProfile(data),
    onSuccess: (res) => { updateUser(res.data.data); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => { toast.success('Password changed. Please login again.'); resetPwd(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account information</p>
      </div>

      {/* Profile Header */}
      <Card className="flex items-center gap-5">
        <Avatar name={`${user?.firstName} ${user?.lastName}`} src={user?.avatar} size="lg" />
        <div>
          <p className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge-blue text-xs mt-1">{getRoleLabel(user?.role || 'STUDENT')}</span>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Edit Profile</h2>
        <form onSubmit={handleProfile((d) => updateProfile.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...regProfile('firstName')} />
            <Input label="Last Name" {...regProfile('lastName')} />
          </div>
          <Input label="Phone" type="tel" {...regProfile('phone')} />
          <div className="flex justify-end">
            <Button type="submit" loading={profileSubmitting || updateProfile.isPending}>Save Changes</Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePwd((d) => changePassword.mutate(d))} className="space-y-4">
          <Input label="Current Password" type="password" {...regPwd('currentPassword', { required: true })} />
          <Input label="New Password" type="password" {...regPwd('newPassword', { required: true, minLength: 8 })} />
          <Input label="Confirm New Password" type="password" {...regPwd('confirmPassword', { required: true })} />
          <div className="flex justify-end">
            <Button type="submit" loading={pwdSubmitting || changePassword.isPending}>Change Password</Button>
          </div>
        </form>
      </Card>

      {/* Account Info */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email Verified</span>
            <span className={user?.isEmailVerified ? 'text-green-600 font-medium' : 'text-red-600'}>{user?.isEmailVerified ? 'Yes' : 'No'}</span>
          </div>
          {user?.department && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Department</span>
              <span className="text-gray-900">{user.department.name}</span>
            </div>
          )}
          {user?.academicYear && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Academic Year</span>
              <span className="text-gray-900">Year {user.academicYear}</span>
            </div>
          )}
          {user?.rollNumber && (
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Roll Number</span>
              <span className="text-gray-900">{user.rollNumber}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
