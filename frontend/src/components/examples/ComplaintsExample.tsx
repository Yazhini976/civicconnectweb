// Example component showing how to fetch and display complaints data
import { useEffect, useState } from 'react';
import { getComplaintsByWard, getComplaintStats } from '../services/api';

interface Complaint {
    id: number;
    citizen_name: string;
    ward_number: string;
    street_name: string;
    type: string;
    status: string;
    created_at: string;
}

export function ComplaintsExample() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch complaints for ward 3
                const complaintsData = await getComplaintsByWard('3');
                setComplaints(complaintsData);

                // Fetch complaint statistics
                const statsData = await getComplaintStats();
                setStats(statsData);

                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-4">Loading complaints data...</div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600">Error: {error}</p>
                <p className="text-sm text-red-500 mt-2">
                    Make sure the backend server is running on http://localhost:8081
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Complaints Dashboard</h2>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(stats).map(([status, count]) => (
                    <div key={status} className="bg-white p-4 rounded-lg shadow border">
                        <div className="text-sm text-gray-600">{status}</div>
                        <div className="text-3xl font-bold mt-1">{count}</div>
                    </div>
                ))}
            </div>

            {/* Complaints Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Complaints in Ward 3</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizen</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {complaints.map((complaint) => (
                                <tr key={complaint.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{complaint.id}</td>
                                    <td className="px-4 py-3 text-sm">{complaint.citizen_name}</td>
                                    <td className="px-4 py-3 text-sm">{complaint.street_name}</td>
                                    <td className="px-4 py-3 text-sm">{complaint.type}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                    complaint.status === 'Assigned' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
