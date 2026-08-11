import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select } from '../../components/ui';
import { authApi, metaApi } from '../../services';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'Min 2 characters'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'FACULTY_COORDINATOR', 'SPEAKER']),
  departmentId: z.string().optional(),
  academicYear: z.string().optional(),
  rollNumber: z.string().optional(),
  phone: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => metaApi.getDepartments().then((r) => r.data.data) });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword, academicYear, ...rest } = data;
      await authApi.register({ ...rest, academicYear: academicYear ? parseInt(academicYear) : undefined });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  const deptOptions = (deptData || []).map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Campus Events platform</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" placeholder="Venisha" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last Name" placeholder="S" error={errors.lastName?.message} {...register('lastName')} />
            </div>
            <Input label="Email" type="email" placeholder="you@campus.edu" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" placeholder="+91 9876543210" error={errors.phone?.message} {...register('phone')} />
            <Select label="Role" options={[{ value: 'STUDENT', label: 'Student' }, { value: 'FACULTY_COORDINATOR', label: 'Faculty Coordinator' }, { value: 'SPEAKER', label: 'Speaker / Guest' }]} error={errors.role?.message} {...register('role')} />
            {deptOptions.length > 0 && (
              <Select label="Department" options={deptOptions} placeholder="Select department" error={errors.departmentId?.message} {...register('departmentId')} />
            )}
            {role === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-4">
                <Select label="Academic Year" options={[1,2,3,4].map((y) => ({ value: String(y), label: `Year ${y}` }))} placeholder="Select year" {...register('academicYear')} />
                <Input label="Roll Number" placeholder="CSE21001" {...register('rollNumber')} />
              </div>
            )}
            <Input label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Create Account</Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
