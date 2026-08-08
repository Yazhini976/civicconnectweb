import React, { useState } from 'react';
import { X, User, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { API_BASE_URL } from "../services/api";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedByRole: string; // 'ae1' or 'ae2'
}

export function AssignOfficerModal({ isOpen, onClose, assignedByRole }: AssignOfficerModalProps) {
  // Map user role to default team selection
  const defaultTeam = assignedByRole === 'ae1' ? 'field' : 'survey';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState(defaultTeam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !phone || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);

    try {
      const assignedBy = team === 'field' ? 'ae1' : 'ae2';
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/YXNzaWduLW9mZmljZXI`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone_number: phone,
          name: name,
          password: password,
          assigned_by: assignedBy,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create officer. Please try again.');
      }

      setSuccess('Officer successfully created!');
      setTimeout(() => {
        onClose();
        setName('');
        setPhone('');
        setPassword('');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="mb-1 text-xl font-bold text-slate-800">Create Field Officer</h2>
        <p className="mb-6 text-sm text-slate-500">
          Create a new officer account for your team.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">User Name</label>
            <Input 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
            <Input 
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Team</label>
            <Select value={team} onValueChange={setTeam} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field">Field Team</SelectItem>
                <SelectItem value="survey">Survey Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Officer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
