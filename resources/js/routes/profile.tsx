import { createFileRoute } from "@tanstack/react-router";
import { profileApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Update form data when profile loads
  React.useEffect(() => {
    if (profileQuery.data?.user) {
      setFormData(prev => ({
        ...prev,
        name: profileQuery.data.user.name || '',
        email: profileQuery.data.user.email || '',
      }));
    }
  }, [profileQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    const updateData: { name: string; email: string; password?: string; password_confirmation?: string } = {
      name: formData.name,
      email: formData.email,
    };

    if (formData.password) {
      updateData.password = formData.password;
      updateData.password_confirmation = formData.password_confirmation;
    }

    updateMutation.mutate(updateData);
  };

  if (profileQuery.isLoading) {
    return <div className="flex items-center justify-center h-64">Loading profile...</div>;
  }

  if (profileQuery.error) {
    return <div className="flex items-center justify-center h-64 text-red-500">Error loading profile</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Update your account information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New Password (optional)</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirmation">Confirm New Password</Label>
          <Input
            id="password_confirmation"
            type="password"
            value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            minLength={8}
          />
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
}
