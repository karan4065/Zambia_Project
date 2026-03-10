import { useEffect, useState } from "react";
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardClassStats,
} from "../apis/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  IndianRupee,
  Bus,
  Package,
} from "lucide-react";

const COLORS = ["#00C49F", "#FF8042", "#0088FE", "#FFBB28"];

const DashboardSummary = () => {
  const [overview, setOverview] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [classStats, setClassStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewData, performanceData, classStatsData] = await Promise.all([
          fetchDashboardOverview(),
          fetchDashboardPerformance(),
          fetchDashboardClassStats(),
        ]);
        setOverview(overviewData);
        setPerformance(performanceData);
        setClassStats(classStatsData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  const pieData = performance
    ? [
        { name: "Passed", value: performance.passedStudents },
        { name: "Failed", value: performance.failedStudents },
      ]
    : [];



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Admin Overview</h2>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={<Users size={24} className="text-blue-600" />}
          title="Total Students"
          value={overview?.totalStudents || 0}
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={<IndianRupee size={24} className="text-emerald-600" />}
          title="Fees Collected"
          value={`₹ ${overview?.totalFeesCollected?.toLocaleString() || 0}`}
          bgColor="bg-emerald-100"
        />
        <StatCard
          icon={<IndianRupee size={24} className="text-red-600" />}
          title="Pending Fees"
          value={`₹ ${overview?.pendingFees?.toLocaleString() || 0}`}
          bgColor="bg-red-100"
        />

        <StatCard
          icon={<Bus size={24} className="text-orange-600" />}
          title="Bus Stations"
          value={overview?.totalBusStations || 0}
          bgColor="bg-orange-100"
        />
        <StatCard
          icon={<Package size={24} className="text-indigo-600" />}
          title="Inventory Items"
          value={overview?.totalInventoryItems || 0}
          bgColor="bg-indigo-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Student Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Student Performance (Pass vs Fail)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">Passing Percentage: </span>
            <span className="font-bold text-emerald-600 text-lg">
              {performance?.passingPercentage || 0}%
            </span>
          </div>
        </div>

        {/* Students Per Class */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Students Per Class
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="className" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="studentCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor }: any) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-300 group">
      <div className="flex items-center">
        <div className={`p-2.5 rounded-lg ${bgColor} mr-3 transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate mb-1" title={title}>{title}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
